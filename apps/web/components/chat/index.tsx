"use client";

import { ShareButton } from "@/components/nav/share-button";
import { ThemeButton } from "@/components/nav/theme-button";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useAutoResume } from "@/hooks/use-auto-resume";
import type { Model } from "@/lib/ai";
import { useSession } from "@/lib/auth/client";
import { OneChatSDKError } from "@/lib/errors";
import type { ChatRequest } from "@/lib/schema";
import { trpc } from "@/lib/trpc/client";
import { generateUUID } from "@/lib/utils";
import { getRoutingFromCookie } from "@/lib/utils/cookie";
import type { ChatSubmitData } from "@/types";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import type { UIMessage } from "ai";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { DragDropOverlay } from "./drag-drop-overlay";
import { Messages } from "./messages";

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
  initialChatModel: Model;
  initialVisibilityType: "public" | "private";
  isReadonly: boolean;
  autoResume: boolean;
  initialIsNewThread?: boolean;
  hasKeys?: boolean;
  username?: string;
}

export const Chat = ({
  threadId,
  initialMessages = [],
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  username,
  initialIsNewThread = false,
  hasKeys: hasKeysFromProps = false,
}: ChatProps) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { keys: userApiKeys, hasKeys: hasKeysFromApiKeys } = useApiKeys();
  const trpcUtils = trpc.useUtils();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [isNewThread, setIsNewThread] = useState(initialIsNewThread);
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollToBottomRef = useRef<(() => void) | null>(null);
  const [hasKeys, setHasKeys] = useState(hasKeysFromProps);

  // Drag and drop state
  const [isDragOverlay, setIsDragOverlay] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_, setDragCounter] = useState(0);
  const fileHandlerRef = useRef<((files: FileList) => Promise<void>) | null>(
    null
  );

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
    experimental_prepareRequestBody: ({ id, messages, requestBody }) => ({
      id,
      message: messages.at(-1),
      userApiKeys,
      forceOpenRouter: getRoutingFromCookie() ?? false,
      ...requestBody,
    }),
    onError: (error) => {
      console.error("Chat error:", error);

      if (error instanceof OneChatSDKError) {
        toast.error(error.message);
        return;
      }

      // Handle structured error responses from API
      if (error?.message) {
        try {
          const parsedError = JSON.parse(error.message);

          if (parsedError.error && parsedError.code) {
            toast.error(parsedError.error);
            return;
          }

          if (parsedError.error) {
            toast.error(parsedError.error);
            return;
          }

          if (parsedError.message) {
            toast.error(parsedError.message);
            return;
          }
        } catch {
          // If JSON parsing fails, use the raw error message
          toast.error(error.message);
          return;
        }
      }

      // Fallback for any other error types
      toast.error("An error occurred while processing your request.");
    },
  });

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

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleSubmitMessage = useCallback(
    (data: ChatSubmitData) => {
      if (isNewThread)
        window.history.replaceState({}, "", `/thread/${threadId}`);

      const request: ChatRequest = {
        id: threadId,
        reasoningEffort: data.reasoningEffort,
        selectedModel: data.selectedModel,
        searchStrategy: data.searchStrategy,
        forceOpenRouter: data.forceOpenRouter,
      };

      handleSubmit(undefined, {
        body: request,
        experimental_attachments: data.attachments,
      });

      if (isNewThread) {
        setIsNewThread(false);

        generateAndUpdateThreadTitle({
          id: threadId,
          userQuery: data.input,
          apiKeys: userApiKeys,
        });
      }
    },
    [threadId, handleSubmit, isNewThread, generateAndUpdateThreadTitle]
  );

  const handleScrollStateChange = useCallback(
    (newIsAtBottom: boolean, newScrollToBottom: () => void) => {
      setIsAtBottom(newIsAtBottom);
      scrollToBottomRef.current = newScrollToBottom;
    },
    []
  );

  useEffect(() => {
    setHasKeys(hasKeysFromApiKeys);
  }, [hasKeysFromApiKeys]);

  const scrollToBottom = useCallback(() => {
    scrollToBottomRef.current?.();
  }, []);

  const isStreamInterrupted = useMemo(() => {
    return (
      messages.length >= 1 &&
      messages.at(-1)?.role !== "assistant" &&
      status !== "streaming" &&
      status !== "submitted"
    );
  }, [messages, status]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prev) => prev + 1);

    if (e.dataTransfer?.items) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        (item) => item.kind === "file"
      );
      if (hasFiles) {
        setIsDragOverlay(true);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setIsDragOverlay(false);
        setIsDragOver(false);
        return 0;
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragOverlay(false);
    setIsDragOver(false);
    setDragCounter(0);

    if (!fileHandlerRef.current) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await fileHandlerRef.current(files);
    }
  }, []);

  const handleFileHandlerSet = useCallback(
    (handler: (files: FileList) => Promise<void>) => {
      fileHandlerRef.current = handler;
    },
    []
  );

  return (
    <section
      className={cn(
        "relative flex h-dvh min-w-0 flex-col bg-background",
        isReadonly && "w-full"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Chat interface with file drag and drop support"
    >
      {!isReadonly && (
        <div className="pointer-events-auto fixed top-2 right-2 z-50 flex flex-row gap-0.5 rounded-md border border-border/50 bg-neutral-50 p-1 shadow-xs backdrop-blur-sm transition-all duration-200 dark:border-border/30 dark:bg-neutral-800/90">
          {pathname !== "/" && (
            <ShareButton
              threadId={threadId}
              initialVisibility={initialVisibilityType}
            />
          )}
          <ThemeButton />
        </div>
      )}
      <Messages
        threadId={threadId}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        onScrollStateChange={handleScrollStateChange}
        hasKeys={hasKeys}
        username={username || session?.user?.name!}
        append={(message) => setInput(message)}
      />
      {!isReadonly && (
        <ChatInput
          threadId={threadId}
          initialChatModel={initialChatModel}
          input={input}
          setInput={setInput}
          onInputChange={handleInputChange}
          onSubmit={handleSubmitMessage}
          status={status}
          onStop={stop}
          setMessages={setMessages}
          reload={reload}
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
          isStreamInterrupted={isStreamInterrupted}
          disabled={!hasKeys}
          onExternalFileDrop={handleFileHandlerSet}
        />
      )}
      <DragDropOverlay isVisible={isDragOverlay} isDragOver={isDragOver} />
    </section>
  );
};
