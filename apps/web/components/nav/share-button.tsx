"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { toast } from "@workspace/ui/components/sonner";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { Globe, Lock, Share } from "lucide-react";
import { useCallback, useState } from "react";

interface ShareButtonProps {
  threadId: string;
  initialVisibility: "private" | "public";
  className?: string;
  disabled?: boolean;
}

const VisibilityToggle = ({
  isPublic,
  onToggle,
}: {
  isPublic: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent/50 transition-colors group-hover:bg-accent/70 dark:bg-accent/20 dark:group-hover:bg-accent/30">
          {isPublic ? (
            <Globe className="size-4 text-foreground" />
          ) : (
            <Lock className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-foreground text-sm leading-none">
            {isPublic ? "Public" : "Private"}
          </div>
          <div className="text-muted-foreground text-xs leading-none">
            {isPublic ? "Shareable with anyone" : "Visible to you only"}
          </div>
        </div>
      </div>

      <Switch
        checked={isPublic}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-muted/60"
      />
    </div>
  );
};

export const ShareButton = ({
  threadId,
  initialVisibility,
  className,
  children,
  disabled = false,
}: ShareButtonProps & { children?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialVisibility === "public");

  const shareUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/share/${threadId}`;

  const toggleVisibility = trpc.thread.toggleVisibility.useMutation({
    onSuccess: (data) => {
      // Optimistic update already applied, just sync final state
      const serverIsPublic = data.visibility === "public";
      if (serverIsPublic !== isPublic) {
        setIsPublic(serverIsPublic);
      }
    },
    onError: (error) => {
      // Revert optimistic update on error
      setIsPublic(!isPublic);
      console.error("Share toggle error:", error);
      toast.error(error.message || "Failed to update sharing settings");
    },
  });

  const handleToggle = useCallback(() => {
    // Optimistic update - immediately toggle the UI
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);

    // Then call the API
    toggleVisibility.mutate({ threadId });
  }, [isPublic, threadId, toggleVisibility]);

  const handleCopyLink = useCallback(async () => {
    if (!isPublic) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (_error) {
      toast.error("Failed to copy link");
    }
  }, [shareUrl, isPublic]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-[6px] transition-all duration-200 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent/60",
              className,
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            aria-label="Share conversation"
          >
            <Share className="size-4 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-80 rounded-xl border border-border/50 bg-background p-0 shadow-sm dark:border-border/30 dark:bg-card"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-5 p-5">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-foreground text-lg tracking-tight">
              <Share className="size-4" />
              Share conversation
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Control access to this chat thread
            </p>
          </div>

          {/* Visibility Toggle */}
          <VisibilityToggle isPublic={isPublic} onToggle={handleToggle} />

          {/* Share Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-xs tracking-wide">
                SHARE LINK
              </span>
              {isPublic && (
                <div className="flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  <span className="font-medium text-green-600 text-xs dark:text-green-400">
                    Active
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={shareUrl}
                  readOnly
                  disabled={!isPublic}
                  className={cn(
                    "h-9 border-border/50 bg-muted/30 pr-3 font-mono text-xs transition-colors focus-visible:border-border focus-visible:bg-background dark:border-border/30 dark:bg-muted/20 dark:focus-visible:bg-card",
                    !isPublic && "cursor-not-allowed opacity-50"
                  )}
                  placeholder={
                    isPublic ? "" : "Enable sharing to generate link"
                  }
                />
              </div>
              <CopyButton
                onCopy={handleCopyLink}
                className={cn(
                  "transition-opacity duration-200",
                  !isPublic && "pointer-events-none opacity-50"
                )}
                disabled={!isPublic}
              />
            </div>

            {!isPublic && (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Turn on sharing to generate a public link
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
