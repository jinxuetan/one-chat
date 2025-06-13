"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect } from "react";

export interface UseAutoResumeProps {
  autoResume: boolean;
  initialMessages: UIMessage[];
  experimental_resume: UseChatHelpers["experimental_resume"];
  data: UseChatHelpers["data"];
  setMessages: UseChatHelpers["setMessages"];
}

export const useAutoResume = ({
  autoResume,
  initialMessages,
  experimental_resume,
  data,
  setMessages,
}: UseAutoResumeProps) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: we intentionally run this once
  useEffect(() => {
    if (!autoResume) return;
    const mostRecentMessage = initialMessages.at(-1);
    if (mostRecentMessage?.role === "user") experimental_resume();
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.length === 0) return;

    const dataPart = data[0] as { type: "append-message"; message: string };

    if (dataPart.type === "append-message") {
      const message = JSON.parse(dataPart.message) as UIMessage;
      setMessages([...initialMessages, message]);
    }
  }, [data, initialMessages, setMessages]);
};
