import { useDefaultModel } from "@/hooks/use-default-model";
import { useMessages } from "@/hooks/use-messages";
import type { Model } from "@/lib/ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { getModelFromCookie, resolveModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { TextShimmer } from "@workspace/ui/components/text-shimmer";
import { cn } from "@workspace/ui/lib/utils";
import type { UIMessage } from "ai";
import { Loader } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { BYOK } from "../byok";
import { EmptyMessage } from "./empty-message";
import { Message, ThinkingMessage } from "./message";

interface MessagesProps {
  threadId: string;
  status: UseChatHelpers["status"];
  messages: UIMessage[];
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  onScrollStateChange?: (
    isAtBottom: boolean,
    scrollToBottom: () => void
  ) => void;
  hasKeys?: boolean;
  append: (message: string) => void;
  username: string;
}

export const Messages = ({
  threadId,
  status,
  messages,
  isReadonly,
  setMessages,
  reload,
  onScrollStateChange,
  hasKeys = false,
  append,
  username,
}: MessagesProps) => {
  const {
    containerRef,
    endRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
    isAtBottom,
    scrollToBottom,
  } = useMessages({
    threadId,
    status,
  });
  const searchParams = useSearchParams();
  const isNewBranch = searchParams.get("branch") === "true";

  const defaultModel = useDefaultModel();

  const onScrollStateChangeRef = useRef(onScrollStateChange);
  onScrollStateChangeRef.current = onScrollStateChange;

  useEffect(() => {
    onScrollStateChangeRef.current?.(isAtBottom, scrollToBottom);
  }, [isAtBottom, scrollToBottom]);

  const resolveMessageModel = useMemo(() => {
    return (message: MessageWithMetadata, index: number): Model => {
      if (message.role === "assistant")
        return resolveModel(message) || DEFAULT_CHAT_MODEL;

      if (message.role === "user") {
        const nextMessage = messages[index + 1] as MessageWithMetadata;

        if (nextMessage?.role === "assistant") {
          const nextMessageModel = resolveModel(nextMessage);
          if (nextMessageModel) return nextMessageModel;
        }

        return getModelFromCookie() || defaultModel;
      }

      return DEFAULT_CHAT_MODEL;
    };
  }, [messages, defaultModel]);

  const shouldShowThinkingMessage =
    (status === "submitted" || status === "streaming") &&
    messages.length > 0 &&
    !(
      messages.at(-1)?.role === "assistant" &&
      (messages.at(-1)?.parts?.length || 0) > 1
    );

  const isMessageLoading = (index: number) =>
    status === "streaming" && messages.length - 1 === index;
  const isLastMessage = (index: number) => index === messages.length - 1;
  const requiresScrollPadding = (index: number) =>
    hasSentMessage && isLastMessage(index);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col px-0 pt-20 md:px-3 md:pt-10",
        { "items-center justify-center": isNewBranch }
      )}
    >
      {messages.length === 0 ? (
        isNewBranch ? (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <Loader className="size-4 animate-spin text-muted-foreground" />
            <TextShimmer className="text-lg">Cloning...</TextShimmer>
          </div>
        ) : hasKeys ? (
          <EmptyMessage username={username} onMessageClick={append} />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-2 px-4 md:px-0">
            <BYOK />
          </div>
        )
      ) : null}

      {messages.map((message, index) => (
        <Message
          key={message.id}
          threadId={threadId}
          message={message as MessageWithMetadata}
          resolvedMessageModel={resolveMessageModel(
            message as MessageWithMetadata,
            index
          )}
          isLoading={isMessageLoading(index)}
          isPending={shouldShowThinkingMessage}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isLastMessage={isLastMessage(index)}
          requiresScrollPadding={requiresScrollPadding(index)}
        />
      ))}

      {shouldShowThinkingMessage && <ThinkingMessage />}

      {!isReadonly && (
        <motion.div
          ref={endRef}
          className="min-h-[24px] min-w-[24px] shrink-0"
          onViewportLeave={onViewportLeave}
          onViewportEnter={onViewportEnter}
        />
      )}
    </div>
  );
};
