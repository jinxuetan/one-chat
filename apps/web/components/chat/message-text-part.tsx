import type { Model } from "@/lib/ai";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { SourceUIPart, ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { EditMessage } from "./edit-message";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { MessageSources } from "./message-sources";
import { TextShimmer } from "@workspace/ui/components/text-shimmer";

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
  isLoading: boolean;
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
    isLoading,
    isBranching,
    threadId,
  }) => {
    const [isMobileActionsVisible, setIsMobileActionsVisible] = useState(false);

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

    const handleMobileTouch = () => {
      if (isReadonly || displayMode === "edit") return;
      setIsMobileActionsVisible(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
      // Only hide if focus is moving completely outside the message container
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsMobileActionsVisible(false);
      }
    };

    return (
      <div
        className={cn("group relative mb-12 gap-2", {
          "ml-auto": message.role === "user",
          "w-full": message.role === "user" && displayMode === "edit",
        })}
        onBlur={handleBlur}
      >
        <div className="flex w-full flex-col gap-3">
          {displayMode === "view" ? (
            <div
              role="button"
              className={cn("flex w-full flex-col gap-3", {
                "rounded-xl bg-primary px-3 py-2": message.role === "user",
                "cursor-pointer touch-manipulation md:cursor-default":
                  !isReadonly,
              })}
              onClick={handleMobileTouch}
              onTouchStart={handleMobileTouch}
              tabIndex={isReadonly ? undefined : 0}
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

        {isLoading && message.role === "assistant" && (
          <TextShimmer className="text-4xl font-bold -mt-2">...</TextShimmer>
        )}
        {displayMode === "view" && (
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
            isMobileActionsVisible={isMobileActionsVisible}
          />
        )}
      </div>
    );
  }
);

MessageTextPart.displayName = "MessageTextPart";
