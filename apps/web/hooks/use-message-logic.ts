import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { type Model, type ModelConfig, getModelByKey } from "@/lib/ai";
import { useSession } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { generateUUID, resolveModel, setModelCookie } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { SourceUIPart } from "@ai-sdk/ui-utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@workspace/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

interface UseMessageLogicProps {
  threadId: string;
  message: MessageWithMetadata;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  messageModel: Model;
}

export const useMessageLogic = ({
  threadId,
  message,
  setMessages,
  reload,
  messageModel,
}: UseMessageLogicProps): {
  displayMode: "view" | "edit";
  setDisplayMode: Dispatch<SetStateAction<"view" | "edit">>;
  messageModelConfig: ModelConfig | false | null;
  sources: SourceUIPart["source"][];
  isBranchingThread: boolean;
  isReloading: boolean;
  handleMessageReload: (model?: Model) => Promise<void>;
  handleThreadBranchOut: (model?: Model) => void;
  handleTextCopy: (textContent: string) => Promise<void>;
} => {
  const router = useRouter();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [displayMode, setDisplayMode] = useState<"view" | "edit">("view");
  const [isBranchingThread, setIsBranchingThread] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const trpcUtils = trpc.useUtils();
  const deleteMessageAndTrailingMutation =
    trpc.thread.deleteMessageAndTrailing.useMutation();
  const branchOutMutation = trpc.thread.branchOut.useMutation({
    onMutate: async ({
      originalThreadId,
      newThreadId,
    }: {
      originalThreadId: string;
      newThreadId: string;
    }) => {
      setIsBranchingThread(true);
      await trpcUtils.thread.getUserThreads.cancel();
      const previousThreads = trpcUtils.thread.getUserThreads.getData();
      if (!session?.user?.id) return { previousThreads };

      // Optimistically add the new thread
      trpcUtils.thread.getUserThreads.setData(undefined, (old) => {
        if (!old) return old;
        const optimisticThread = {
          id: newThreadId,
          title: "Cloning...",
          userId: session.user.id,
          originThreadId: originalThreadId ?? null,
          visibility: "private" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString() as string | null,
        };
        return [optimisticThread, ...old];
      });
      return { previousThreads };
    },
    onSuccess: (data) => router.push(`/thread/${data.newThreadId}`),
    onError: (error, _vars, context) => {
      if (context?.previousThreads) {
        trpcUtils.thread.getUserThreads.setData(
          undefined,
          context.previousThreads
        );
      }
      console.error("Failed to branch out:", error);
      const errorMessage = error.message.includes("Unauthorized")
        ? "You don't have permission to branch this thread"
        : error.message.includes("not found")
        ? "Message or thread not found"
        : "Failed to branch out. Please try again.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsBranchingThread(false);
      queryClient.invalidateQueries({ queryKey: ["thread-list"] });
      trpcUtils.thread.getUserThreads.invalidate();
    },
  });

  // Memoized computations
  const resolvedModel = useMemo(() => resolveModel(message), [message]);

  const messageModelConfig = useMemo(
    () =>
      message.role === "assistant" &&
      resolvedModel &&
      getModelByKey(resolvedModel),
    [message.role, resolvedModel]
  );

  const sources = useMemo((): SourceUIPart["source"][] => {
    return (
      message.parts
        ?.filter((part) => part.type === "source")
        ?.map((part) => (part as { source: SourceUIPart["source"] }).source) ||
      []
    );
  }, [message.parts]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Event handlers
  const handleMessageReload = useCallback(
    async (model?: Model) => {
      try {
        setMessages((messages) => {
          const currentIndex = messages.findIndex((m) => m.id === message.id);
          if (currentIndex === -1) return messages;

          // For user messages: delete from next message, for assistant: delete from current
          const deleteFromIndex =
            message.role === "user" ? currentIndex + 1 : currentIndex;
          const targetMessage = messages[deleteFromIndex];

          if (!targetMessage) return messages;

          // Delete from database
          deleteMessageAndTrailingMutation.mutate({
            messageId: targetMessage.id,
          });

          // Update local state
          return messages.slice(0, deleteFromIndex);
        });
        await reload({
          body: {
            selectedModel: model || messageModel,
          },
        });
      } catch (error) {
        console.error("Failed to reload from message:", error);
      }
    },
    [
      deleteMessageAndTrailingMutation,
      message.id,
      message.role,
      setMessages,
      reload,
    ]
  );

  const handleThreadBranchOut = useCallback(
    (model?: Model) => {
      const newThreadId = generateUUID();
      if (model) setModelCookie(model);
      branchOutMutation.mutate({
        messageId: message.id,
        originalThreadId: threadId,
        newThreadId,
      });
      // Optimistically navigate immediately
      router.push(`/thread/${newThreadId}?branch=true`);
    },
    [branchOutMutation, message.id, threadId, router]
  );

  const handleTextCopy = useCallback(
    async (textContent: string) => {
      await copyToClipboard(textContent);
    },
    [copyToClipboard]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (isBranchingThread) setIsBranchingThread(false);
    };
  }, [isBranchingThread]);

  return {
    displayMode,
    setDisplayMode,
    messageModelConfig,
    sources,
    isBranchingThread,
    isReloading: deleteMessageAndTrailingMutation.isPending,
    handleMessageReload,
    handleThreadBranchOut,
    handleTextCopy,
  };
};
