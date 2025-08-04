"use client";

import type { Model } from "@/lib/ai";
import { trpc } from "@/lib/trpc/client";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "@workspace/ui/components/button";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

export type EditMessageProps = {
  message: MessageWithMetadata;
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  model: Model;
};

export const EditMessage = ({
  message,
  setMode,
  setMessages,
  reload,
  model,
}: EditMessageProps) => {
  const [draftContent, setDraftContent] = useState<string>(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deleteTrailingMessagesMutation =
    trpc.thread.deleteTrailingMessages.useMutation();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
      textareaRef.current.focus();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleCancel = () => {
    setDraftContent(message.content);
    setMode("view");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
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

      reload({
        body: {
          selectedModel: model,
        },
      });
    } catch (error) {
      console.error("Failed to delete trailing messages:", error);
      setMode("view");
      reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="ml-auto inline-block w-full max-w-[80%] break-words rounded-xl border px-2 py-2 text-left shadow-xs bg-neutral-100 dark:bg-neutral-900">
      <textarea
        ref={textareaRef}
        className="size-full resize-none overflow-hidden border-none bg-transparent text-base text-secondary-foreground leading-6 shadow-none outline-none [vertical-align:unset] focus-visible:ring-0"
        value={draftContent}
        onChange={handleInput}
        style={{
          minHeight: "42px",
          maxHeight: "384px",
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
