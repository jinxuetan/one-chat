import type { ModelConfig } from "@/lib/ai";
import type { MessageWithMetadata } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { PencilIcon, RotateCcwIcon, Split } from "lucide-react";
import { memo } from "react";
import { ProviderIcon } from "./select-model-button";

interface MessageActionsProps {
  message: MessageWithMetadata;
  messageModel?: ModelConfig;
  isReadonly: boolean;
  onReload: () => void;
  onEdit: () => void;
  onBranchOut: () => void;
  onCopy: (text: string) => void;
  isReloading: boolean;
  isBranching: boolean;
  textContent: string;
}

export const MessageActions = memo<MessageActionsProps>(
  ({
    message,
    messageModel,
    isReadonly,
    onReload,
    onEdit,
    onBranchOut,
    onCopy,
    isReloading,
    isBranching,
    textContent,
  }) => {
    if (isReadonly) return null;

    return (
      <div
        className={cn(
          "absolute mt-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100",
          {
            "right-0": message.role === "user",
            "left-0": message.role === "assistant",
          }
        )}
      >
        {messageModel && (
          <div className="mr-2 flex flex-shrink-0 items-center whitespace-nowrap rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
            <ProviderIcon provider={messageModel.provider} className="size-3" />
            <span className="ml-1">{messageModel.name}</span>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="group/edit"
              onClick={onReload}
              disabled={isReloading}
            >
              <RotateCcwIcon
                size={14}
                className="text-muted-foreground group-hover/edit:text-foreground"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Regenerate from here</TooltipContent>
        </Tooltip>

        {message.role === "user" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group/edit"
                onClick={onEdit}
              >
                <PencilIcon
                  size={14}
                  className="text-muted-foreground group-hover/edit:text-foreground"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Edit message</TooltipContent>
          </Tooltip>
        )}

        {message.role !== "user" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group/edit"
                onClick={onBranchOut}
                disabled={isBranching}
              >
                <Split
                  size={14}
                  className={cn(
                    "text-muted-foreground group-hover/edit:text-foreground",
                    {
                      "animate-pulse": isBranching,
                    }
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isBranching ? "Branching..." : "Branch Out"}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <CopyButton onCopy={() => onCopy(textContent)} />
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy message</TooltipContent>
        </Tooltip>
      </div>
    );
  }
);

MessageActions.displayName = "MessageActions";
