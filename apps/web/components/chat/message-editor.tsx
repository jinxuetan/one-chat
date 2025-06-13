"use client";

import { trpc } from "@/lib/trpc/client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Message } from "ai";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
};

export const MessageEditor = ({
  message,
  setMode,
  setMessages,
  reload,
}: MessageEditorProps) => {
  const [draftContent, setDraftContent] = useState<string>(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deleteTrailingMessagesMutation =
    trpc.thread.deleteTrailingMessages.useMutation();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      try {
        // @ts-expect-error todo: support UIMessage in setMessages
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);

          if (index !== -1) {
            const updatedMessage = {
              ...message,
              content: draftContent,
              parts: [{ type: "text", text: draftContent }],
            };

            return [...messages.slice(0, index), updatedMessage];
          }

          return messages;
        });
        setMode("view");

        deleteTrailingMessagesMutation.mutate({
          messageId: message.id,
        });

        reload();
      } catch (error) {
        console.error("Failed to delete trailing messages:", error);
        setMode("view");
        reload();
      }
    }
  };

  return (
    <div className="ml-auto inline-block w-full max-w-[80%] break-words rounded-xl border px-4 py-3 text-left">
      <div className="w-full overflow-y-scroll" style={{ maxHeight: 256 }}>
        <textarea
          ref={textareaRef}
          className="!text-base mb-px w-full resize-none overflow-hidden border-none bg-transparent px-0 pt-[3px] text-secondary-foreground leading-6 shadow-none outline-none [vertical-align:unset] focus-visible:ring-0"
          value={draftContent}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
