import { useMessages } from "@/hooks/use-messages";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Message, ThinkingMessage } from "./message";
import { BYOK } from "../byok";
import { EmptyMessage } from "./empty-message";

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

  // Store callback to prevent unnecessary effect calls
  const onScrollStateChangeRef = useRef(onScrollStateChange);
  onScrollStateChangeRef.current = onScrollStateChange;

  // Notify parent component of scroll state changes
  useEffect(() => {
    onScrollStateChangeRef.current?.(isAtBottom, scrollToBottom);
  }, [isAtBottom, scrollToBottom]);

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
      className="relative mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col px-3 pt-10"
    >
      {messages.length === 0 && (!hasKeys ? <EmptyMessage /> : <BYOK />)}

      {messages.map((message, index) => (
        <Message
          key={message.id}
          threadId={threadId}
          message={message as MessageWithMetadata}
          isLoading={isMessageLoading(index)}
          // This is a workaround to show the thinking message until the first chunk is received
          isPending={shouldShowThinkingMessage}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isLastMessage={isLastMessage(index)}
          requiresScrollPadding={requiresScrollPadding(index)}
        />
      ))}

      {shouldShowThinkingMessage && <ThinkingMessage />}

      <motion.div
        ref={endRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
};
