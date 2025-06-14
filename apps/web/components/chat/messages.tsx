import { useMessages } from "@/hooks/use-messages";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { motion } from "motion/react";
import { Message, ThinkingMessage } from "./message";
import React, { useEffect, useRef } from "react";
import { MessageWithMetadata } from "@/types";

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
}

export const Messages = ({
  threadId,
  status,
  messages,
  isReadonly,
  setMessages,
  reload,
  onScrollStateChange,
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

  // Use ref to store the callback to prevent unnecessary effect calls
  const onScrollStateChangeRef = useRef(onScrollStateChange);
  onScrollStateChangeRef.current = onScrollStateChange;

  useEffect(() => {
    onScrollStateChangeRef.current?.(isAtBottom, scrollToBottom);
  }, [isAtBottom, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex min-w-0 w-full max-w-3xl flex-1 flex-col gap-6 px-3 pt-10"
    >
      {messages.length === 0 && (
        <div className="mx-auto flex size-full max-w-3xl flex-col justify-center px-8 md:mt-20" />
      )}

      {messages.map((message, index) => (
        <Message
          key={message.id}
          threadId={threadId}
          message={message as MessageWithMetadata}
          isLoading={status === "streaming" && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isLastMessage={index === messages.length - 1}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {status === "submitted" &&
        messages.length > 0 &&
        messages.at(-1)?.role === "user" && <ThinkingMessage />}

      <motion.div
        ref={endRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
};
