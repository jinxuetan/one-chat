import { type Model, getModelByKey } from "@/lib/ai";
import { trpc } from "@/lib/trpc/client";
import type { MessageWithMetadata } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { LinkIcon, PencilIcon, RotateCcwIcon, Split } from "lucide-react";
import { memo, useState } from "react";
import { ModelSelectionDropdown } from "./model-selection-dropdown";
import { ProviderIcon } from "./model-selection-popover";
import { TTSButton } from "./tts-button";

interface MessageActionsProps {
  message: MessageWithMetadata;
  model?: Model;
  isReadonly: boolean;
  onReload: (model?: Model) => void;
  onEdit: () => void;
  onBranchOut: (model?: Model) => void;
  onCopy: (text: string) => void;
  isReloading: boolean;
  isBranching: boolean;
  textContent: string;
  threadId: string;
}

export const MessageActions = memo<MessageActionsProps>(
  ({
    message,
    model,
    isReadonly,
    onReload,
    onEdit,
    onBranchOut,
    onCopy,
    isReloading,
    isBranching,
    textContent,
    threadId,
  }) => {
    const [isReloadDropdownOpen, setIsReloadDropdownOpen] = useState(false);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isTTSDropdownOpen, setIsTTSDropdownOpen] = useState(false);

    const createPartialShareMutation = trpc.thread.createPartialShare.useMutation({
      onSuccess: (data) => {
        const shareUrl = `${window.location.origin}/share/partial/${data.token}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Partial share link copied to clipboard!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create partial share");
      },
    });

    const handlePartialShare = () => {
      createPartialShareMutation.mutate({
        threadId,
        messageId: message.id,
      });
    };

    if (isReadonly) return null;

    const modelConfig = model && getModelByKey(model);
    const isAnyDropdownOpen = isReloadDropdownOpen || isBranchDropdownOpen || isTTSDropdownOpen;
    const isPartialShareLoading = createPartialShareMutation.status === "pending";

    return (
      <div
        className={cn(
          "absolute mt-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100",
          {
            "right-0": message.role === "user",
            "left-0": message.role === "assistant",
            "opacity-100": isAnyDropdownOpen,
          }
        )}
      >
        {modelConfig && message.role === "assistant" && (
          <div className="mr-2 flex flex-shrink-0 items-center whitespace-nowrap rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
            <ProviderIcon provider={modelConfig.provider} className="size-3" />
            <span className="ml-1">{modelConfig.name}</span>
          </div>
        )}

        <ModelSelectionDropdown
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group/edit"
                  disabled={isReloading}
                >
                  <RotateCcwIcon
                    size={14}
                    className="text-muted-foreground group-hover/edit:text-foreground"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Regenerate from here
              </TooltipContent>
            </Tooltip>
          }
          onSelect={(model) => onReload(model)}
          onOpenChange={setIsReloadDropdownOpen}
          disabled={isReloading}
          side="bottom"
          align="end"
        />

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
          <ModelSelectionDropdown
            trigger={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/edit"
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
            }
            onSelect={(model) => onBranchOut(model)}
            onOpenChange={setIsBranchDropdownOpen}
            disabled={isBranching}
            side="bottom"
            align="end"
          />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="group/edit"
              onClick={handlePartialShare}
              disabled={isPartialShareLoading}
            >
              <LinkIcon
                size={14}
                className={cn(
                  "text-muted-foreground group-hover/edit:text-foreground",
                  {
                    "animate-pulse": isPartialShareLoading,
                  }
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPartialShareLoading ? "Creating share..." : "Share up to here"}
          </TooltipContent>
        </Tooltip>

        {message.role === "assistant" && (
          <TTSButton
            text={textContent}
            onOpenChange={setIsTTSDropdownOpen}
            isOpen={isTTSDropdownOpen}
          />
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
