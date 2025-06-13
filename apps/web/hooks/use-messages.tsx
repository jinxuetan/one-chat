import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useScrollToBottom } from "./use-scroll-to-bottom";

interface MessagesInterface {
  threadId: string;
  status: UseChatHelpers["status"];
}

export const useMessages = ({ threadId, status }: MessagesInterface) => {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (threadId) {
      scrollToBottom("instant");
      setHasSentMessage(false);
    }
  }, [threadId, scrollToBottom]);

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom("instant");
      setHasSentMessage(true);
    }
  }, [status, scrollToBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
};
