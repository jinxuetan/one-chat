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
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import { Globe, Lock, Share } from "lucide-react";
import { useCallback, useState } from "react";

interface SharePopoverProps {
  threadId: string;
  initialVisibility: "private" | "public";
  className?: string;
  children?: React.ReactNode;
}

const VisibilityToggle = ({
  isPublic,
  onToggle,
}: {
  isPublic: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-accent/50 group-hover:bg-accent/70 transition-colors">
          {isPublic ? (
            <Globe className="size-4 text-foreground" />
          ) : (
            <Lock className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-sm leading-none">
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
        className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted"
      />
    </div>
  );
};

export const SharePopover = ({
  threadId,
  initialVisibility,
  className,
  children,
}: SharePopoverProps) => {
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
    } catch (error) {
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
            className={`hover:bg-neutral-200 rounded-[6px] ${className || ""}`}
          >
            <Share className="size-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 rounded-xl shadow-sm border border-border/50"
        align="end"
        sideOffset={8}
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-lg tracking-tight flex items-center gap-2">
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
              <label className="font-medium text-xs text-muted-foreground tracking-wide">
                SHARE LINK
              </label>
              {isPublic && (
                <div className="flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 font-medium">
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
                    "h-9 pr-3 text-xs font-mono bg-muted/30 border-border/50 focus-visible:border-border focus-visible:bg-background transition-colors",
                    !isPublic && "opacity-50 cursor-not-allowed"
                  )}
                  placeholder={
                    !isPublic ? "Enable sharing to generate link" : ""
                  }
                />
              </div>
              <CopyButton
                onCopy={handleCopyLink}
                className={cn(
                  !isPublic && "opacity-50 pointer-events-none"
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
