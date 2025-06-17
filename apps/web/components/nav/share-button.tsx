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
import { Globe, Lock, Share, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ShareButtonProps {
  threadId: string;
  initialVisibility: "private" | "public";
  className?: string;
  disabled?: boolean;
}

const VisibilityToggle = ({
  isPublic,
  onToggle,
  isLoading,
}: {
  isPublic: boolean;
  onToggle: () => void;
  isLoading: boolean;
}) => (
  <div className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-4 transition-all duration-200 hover:border-border hover:bg-background/80 dark:border-border/40 dark:bg-card/30 dark:hover:border-border/60 dark:hover:bg-card/50">
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/80 to-accent/60 shadow-sm transition-all duration-200 group-hover:from-accent group-hover:to-accent/80 group-hover:shadow dark:from-accent/30 dark:to-accent/20 dark:group-hover:from-accent/40 dark:group-hover:to-accent/30">
        {isPublic ? (
          <Globe className="size-4 text-foreground dark:text-foreground/90" />
        ) : (
          <Lock className="size-4 text-foreground/70 dark:text-foreground/60" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-foreground text-sm leading-none">
          {isPublic ? "Public" : "Private"}
        </div>
        <div className="text-foreground/60 text-xs leading-none dark:text-foreground/50">
          {isPublic ? "Shareable with anyone" : "Visible to you only"}
        </div>
      </div>
    </div>
    <Switch
      checked={isPublic}
      onCheckedChange={onToggle}
      disabled={isLoading}
      className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-border/60 dark:data-[state=checked]:bg-foreground/90 dark:data-[state=unchecked]:bg-border/40"
    />
  </div>
);

export const ShareButton = ({
  threadId,
  initialVisibility,
  className,
  children,
  disabled = false,
}: ShareButtonProps & { children?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialVisibility === "public");
  const [deletingTokens, setDeletingTokens] = useState<string[]>([]);

  const { data: allPartialShares } = trpc.thread.getUserPartialShares.useQuery(
    undefined,
    { enabled: isOpen }
  );

  useEffect(() => {
    if (allPartialShares) {
      const existingTokens = allPartialShares
        .filter((share) => share.threadId === threadId)
        .map((share) => share.token);

      setDeletingTokens((prev) =>
        prev.filter((token) => existingTokens.includes(token))
      );
    }
  }, [allPartialShares, threadId]);

  const partialShares = useMemo(() => {
    const threadShares =
      allPartialShares?.filter((share) => share.threadId === threadId) || [];
    return threadShares.filter(
      (share) => !deletingTokens.includes(share.token)
    );
  }, [allPartialShares, threadId, deletingTokens]);

  const deletePartialShare = trpc.thread.deletePartialShare.useMutation({
    onError: (error, variables) => {
      toast.error(error.message || "Failed to delete partial share");
      setDeletingTokens((prev) =>
        prev.filter((token) => token !== variables.token)
      );
    },
  });

  const toggleVisibility = trpc.thread.toggleVisibility.useMutation({
    onSuccess: (data) => {
      const serverIsPublic = data.visibility === "public";
      if (serverIsPublic !== isPublic) {
        setIsPublic(serverIsPublic);
      }
      toast.success(`Thread is now ${serverIsPublic ? "public" : "private"}`);
    },
    onError: (error) => {
      setIsPublic(!isPublic);
      toast.error(error.message || "Failed to update sharing settings");
    },
  });

  const shareUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/share/${threadId}`;

  const handleToggleVisibility = useCallback(() => {
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    toggleVisibility.mutate({ threadId });
  }, [isPublic, threadId, toggleVisibility]);

  const handleCopyShareLink = useCallback(async () => {
    if (!isPublic) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl, isPublic]);

  const handleDeletePartialShare = useCallback(
    (token: string) => {
      setDeletingTokens((prev) => [...prev, token]);
      deletePartialShare.mutate({ token });
    },
    [deletePartialShare]
  );

  const handleCopyPartialShare = useCallback(async (token: string) => {
    try {
      const partialShareUrl = `${window.location.origin}/share/partial/${token}`;
      await navigator.clipboard.writeText(partialShareUrl);
    } catch {
      toast.error("Failed to copy partial share link");
    }
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-[6px] transition-all duration-200 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-neutral-700",
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
        className="w-80 rounded-xl border border-border/80 bg-background p-0 shadow-lg backdrop-blur-sm dark:border-border/50 dark:bg-card"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-6 p-6">
          <div className="space-y-3 border-border/20">
            <h3 className="flex items-center gap-2.5 font-semibold text-foreground text-lg">
              <Share className="size-4.5" />
              Share conversation
            </h3>
            <p className="text-foreground/60 text-sm dark:text-foreground/50">
              Control access to this chat thread
            </p>
          </div>

          <VisibilityToggle
            isPublic={isPublic}
            onToggle={handleToggleVisibility}
            isLoading={toggleVisibility.status === "pending"}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground/70 text-xs uppercase tracking-wide dark:text-foreground/60">
                Share Link
              </span>
              {isPublic && (
                <div className="flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 dark:border-green-700/60 dark:bg-green-950/60">
                  <div className="size-1.5 rounded-full bg-green-500 shadow-sm" />
                  <span className="font-medium text-green-700 text-xs dark:text-green-400">
                    Active
                  </span>
                </div>
              )}
            </div>

            <div className="flex w-full items-center gap-3">
              <Input
                value={shareUrl}
                readOnly
                disabled={!isPublic}
                className={cn(
                  "h-11 min-w-0 flex-1 font-mono text-xs",
                  !isPublic && "cursor-not-allowed opacity-60"
                )}
                placeholder={isPublic ? "" : "Enable sharing to generate link"}
                shellClassName="w-full"
              />
              <CopyButton
                onCopy={handleCopyShareLink}
                className={cn(
                  "flex-shrink-0",
                  !isPublic && "pointer-events-none border-border/50 opacity-50"
                )}
                disabled={!isPublic}
              />
            </div>

            {!isPublic && (
              <p className="text-foreground/60 text-xs dark:text-foreground/50">
                Turn on sharing to generate a public link
              </p>
            )}
          </div>

          {partialShares.length > 0 && (
            <div className="space-y-4 border-border/40 border-t pt-6 dark:border-border/30">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground/70 text-xs uppercase tracking-wide dark:text-foreground/60">
                  Partial Shares
                </span>
                <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-medium text-foreground/70 text-xs dark:border-border/50 dark:bg-card/30 dark:text-foreground/60">
                  {partialShares.length}
                </span>
              </div>

              <div className="max-h-40 space-y-3 overflow-y-auto">
                {partialShares.map((share) => (
                  <div
                    key={share.token}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3.5 shadow-sm transition-all dark:bg-card/30 dark:hover:border-border/70 dark:hover:bg-card/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-foreground/70 text-xs dark:text-foreground/60">
                        {share.token}
                      </div>
                      <div className="mt-1.5 text-foreground/50 text-xs dark:text-foreground/40">
                        Created {new Date(share.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        onCopy={() => handleCopyPartialShare(share.token)}
                        className="size-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 border border-transparent bg-background/40 p-0 text-foreground/60 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-card/20 dark:text-foreground/50 dark:hover:border-red-700/60 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                        onClick={() => handleDeletePartialShare(share.token)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-foreground/60 text-xs leading-relaxed dark:text-foreground/50">
                Partial shares allow others to view this conversation up to a
                specific message.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
