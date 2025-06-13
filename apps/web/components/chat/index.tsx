"use client";

import { useAutoResume } from "@/hooks/use-auto-resume";
import type { Model } from "@/lib/ai";
import type { Effort } from "@/lib/ai/config";
import { useSession } from "@/lib/auth/client";
import type { ChatRequest } from "@/lib/schema";
import { trpc } from "@/lib/trpc/client";
import { generateUUID } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@workspace/ui/components/sonner";
import type { Attachment, UIMessage } from "ai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { Messages } from "./messages";

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
  initialChatModel: Model;
  initialVisibilityType: "public" | "private";
  isReadonly: boolean;
  autoResume: boolean;
  initialIsNewThread?: boolean;
}

interface ChatSubmitData {
  input: string;
  selectedModel: Model;
  effort: Effort;
  isSearchActive: boolean;
  attachments?: Attachment[];
}

export const Chat = ({
  threadId,
  initialMessages = [],
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialIsNewThread = false,
}: ChatProps) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const trpcUtils = trpc.useUtils();
  const [isNewThread, setIsNewThread] = useState(initialIsNewThread);

  const { mutate: generateAndUpdateThreadTitle } =
    trpc.thread.generateAndUpdateThreadTitle.useMutation({
      onMutate: async ({ id }) => {
        if (!session?.user?.id) return;

        await trpcUtils.thread.getUserThreads.cancel();
        const previousThreads = trpcUtils.thread.getUserThreads.getData();

        trpcUtils.thread.getUserThreads.setData(undefined, (old) => {
          if (!old) return old;

          const optimisticThread = {
            id,
            title: "Generating Title...",
            userId: session.user.id,
            originThreadId: null,
            visibility: initialVisibilityType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
          };

          return [optimisticThread, ...old];
        });

        return { previousThreads };
      },
      onError: (error, _variables, context) => {
        if (context?.previousThreads) {
          trpcUtils.thread.getUserThreads.setData(
            undefined,
            context.previousThreads
          );
        }
        toast.error(error.message || "Failed to generate thread title");
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["thread", "getUserThreads"]],
        });
      },
    });

  const {
    input,
    experimental_resume,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    data,
    status,
    messages,
    setMessages,
    reload,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_prepareRequestBody: ({ id, messages, requestBody }) => {
      const lastMessage = messages.at(-1);
      return {
        id,
        message: lastMessage,
        selectedVisibilityType: initialVisibilityType,
        ...requestBody,
      };
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: "user",
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/thread/${threadId}`);
    }
  }, [query, append, hasAppendedQuery, threadId]);

  const onSubmit = useCallback(
    (data: ChatSubmitData) => {
      if (isNewThread)
        window.history.replaceState({}, "", `/thread/${threadId}`);

      const request: ChatRequest = {
        effort: data.effort,
        selectedModel: data.selectedModel,
        enableSearch: data.isSearchActive,
      };

      handleSubmit(undefined, { body: request });

      if (isNewThread) {
        setIsNewThread(false);

        generateAndUpdateThreadTitle({
          id: threadId,
          userQuery: data.input,
        });
      }
    },
    [threadId, append, isNewThread]
  );

  const handleScrollStateChange = useCallback(
    (newIsAtBottom: boolean, newScrollToBottom: () => void) => {
      setIsAtBottom(newIsAtBottom);
      scrollToBottomRef.current = newScrollToBottom;
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    scrollToBottomRef.current?.();
  }, []);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <div className="flex h-dvh min-w-0 flex-col bg-background">
      <Messages
        threadId={threadId}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        onScrollStateChange={handleScrollStateChange}
      />
      {!isReadonly && (
        <ChatInput
          threadId={threadId}
          initialChatModel={initialChatModel}
          input={input}
          setInput={setInput}
          onInputChange={handleInputChange}
          onSubmit={onSubmit}
          status={status}
          onStop={stop}
          setMessages={setMessages}
          reload={reload}
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
        />
      )}
    </div>
  );
};
