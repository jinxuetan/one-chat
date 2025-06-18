import { useDefaultModel } from "@/hooks/use-default-model";
import { useMessages } from "@/hooks/use-messages";
import type { Model } from "@/lib/ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { getModelFromCookie, resolveModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@workspace/ui/lib/utils";
import type { UIMessage } from "ai";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { BYOK } from "../byok";
import { EmptyMessage } from "./empty-message";
import { Message, ThinkingMessage } from "./message";
import { useSearchParams } from "next/navigation";

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

  console.info({ messages });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col px-3 pt-10",
        {
          "pb-14": !isReadonly && messages.length > 0,
        }
      )}
    >
      {messages.length === 0 &&
        (hasKeys && !isNewBranch ? (
          <EmptyMessage username={username} onMessageClick={append} />
        ) : (
          <BYOK />
        ))}

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
