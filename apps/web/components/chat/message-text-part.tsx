import type { Model } from "@/lib/ai";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { SourceUIPart, ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { EditMessage } from "./edit-message";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { MessageSources } from "./message-sources";

interface MessageTextPartProps {
  message: MessageWithMetadata;
  model: Model;
  text: string;
  sources: SourceUIPart["source"][];
  displayMode: "view" | "edit";
  isReadonly: boolean;
  onModeChange: Dispatch<SetStateAction<"view" | "edit">>;
  onReload: (model?: Model) => void;
  onBranchOut: (model?: Model) => void;
  onCopy: (text: string) => void;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReloading: boolean;
  isBranching: boolean;
  threadId: string;
}

export const MessageTextPart = memo<MessageTextPartProps>(
  ({
    message,
    model,
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
    threadId,
  }) => {
    const webSearchTool = message.parts.find(
      (part): part is ToolInvocationUIPart =>
        part.type === "tool-invocation" &&
        part.toolInvocation.toolName === "webSearch"
    );
    const toolSearch =
      webSearchTool?.toolInvocation.state === "result"
        ? webSearchTool.toolInvocation.result
        : undefined;

    const allSources = sources.concat(toolSearch ?? []);

    return (
      <div
        className={cn("group relative mb-12 gap-2", {
          "ml-auto": message.role === "user",
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
              <Markdown
                className={cn({
                  "text-primary-foreground": message.role === "user",
                })}
                role={message.role === "user" ? "user" : "assistant"}
              >
                {text}
              </Markdown>
            </div>
          ) : (
            <EditMessage
              key={message.id}
              message={message}
              setMode={onModeChange}
              setMessages={setMessages}
              reload={reload}
              model={model}
            />
          )}

          <MessageSources sources={allSources} />
        </div>

        <MessageActions
          message={message}
          model={model}
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
          threadId={threadId}
        />
      </div>
    );
  }
);

MessageTextPart.displayName = "MessageTextPart";
