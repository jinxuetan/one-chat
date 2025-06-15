import type { ModelConfig } from "@/lib/ai";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { SourceUIPart } from "@ai-sdk/ui-utils";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AIResponse } from "./ai-response";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageSources } from "./message-sources";

interface MessageTextPartProps {
  message: MessageWithMetadata;
  messageModel?: ModelConfig;
  text: string;
  sources: SourceUIPart["source"][];
  displayMode: "view" | "edit";
  isReadonly: boolean;
  onModeChange: Dispatch<SetStateAction<"view" | "edit">>;
  onReload: () => void;
  onBranchOut: () => void;
  onCopy: (text: string) => void;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReloading: boolean;
  isBranching: boolean;
}

export const MessageTextPart = memo<MessageTextPartProps>(
  ({
    message,
    messageModel,
    text,
    sources,
    displayMode,
    isReadonly,
    onModeChange,
    onReload,
    onBranchOut,
    onCopy,
    setMessages,
    reload,
    isReloading,
    isBranching,
  }) => {
    return (
      <div
        className={cn("group relative mb-12 gap-2", {
          "ml-auto": message.role === "user",
          "mr-auto": message.role === "assistant",
          "w-full": message.role === "user" && displayMode === "edit",
        })}
      >
        <div className="flex w-full flex-col gap-3">
          {displayMode === "view" ? (
            <div
              className={cn("flex w-full flex-col gap-3", {
                "rounded-xl bg-primary px-3 py-2": message.role === "user",
              })}
            >
              <AIResponse
                className={cn({
                  "text-primary-foreground": message.role === "user",
                })}
              >
                {text}
              </AIResponse>
            </div>
          ) : (
            <MessageEditor
              key={message.id}
              message={message}
              setMode={onModeChange}
              setMessages={setMessages}
              reload={reload}
            />
          )}

          {sources.length > 0 && <MessageSources sources={sources} />}
        </div>

        <MessageActions
          message={message}
          messageModel={messageModel}
          isReadonly={isReadonly}
          onReload={onReload}
          onEdit={() =>
            onModeChange((prev) => (prev === "view" ? "edit" : "view"))
          }
          onBranchOut={onBranchOut}
          onCopy={onCopy}
          isReloading={isReloading}
          isBranching={isBranching}
          textContent={text}
        />
      </div>
    );
  }
);

MessageTextPart.displayName = "MessageTextPart";
