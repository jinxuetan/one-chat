"use client";

import type { Model } from "@/lib/ai";
import type { Effort } from "@/lib/ai/config";
import type { ChatRequest } from "@/lib/schema";
import { useChat } from "@ai-sdk/react";
import type { Attachment, Message } from "ai";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatInput } from "./chat-input";

export const Chat = () => {
  const { input, handleInputChange, append, status } = useChat();

  const onSubmit = useCallback(
    (data: {
      input: string;
      selectedModel: Model;
      effort: Effort;
      isSearchActive: boolean;
      attachments?: Attachment[] | undefined;
    }) => {
      const payload: Message = {
        id: uuidv4(),
        role: "user",
        content: data.input,
        experimental_attachments: data.attachments,
        createdAt: new Date(),
      };
      const request: ChatRequest = {
        selectedModel: data.selectedModel,
        effort: data.effort,
        enableSearch: data.isSearchActive,
      };
      append(payload, { body: request });
    },
    [append]
  );

  return (
    <div className="flex size-full items-center justify-center">
      <ChatInput
        input={input}
        onInputChange={handleInputChange}
        onSubmit={onSubmit}
        isProcessing={status === "streaming" || status === "submitted"}
      />
    </div>
  );
};
