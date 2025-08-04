"use client";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "@workspace/ui/components/badge";
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

interface VisibilityToggleProps {
  isPublic: boolean;
  onToggle: () => void;
  isLoading: boolean;
}

const VisibilityToggle = ({
  isPublic,
  onToggle,
  isLoading,
}: VisibilityToggleProps) => (
  <div className="flex items-center justify-between border border-border rounded-lg p-4 mx-4">
    <div className="flex items-center gap-3">
      {isPublic ? (
        <Globe className="size-8 text-foreground/80" strokeWidth={1.5} />
      ) : (
        <Lock className="size-8 text-foreground/80" strokeWidth={1.5} />
      )}
      <div>
        <h4 className="font-medium text-sm text-foreground">
          {isPublic ? "Public" : "Private"}
        </h4>
        <p className="text-muted-foreground text-xs">
          {isPublic ? "Shareable with anyone" : "Visible to you only"}
        </p>
      </div>
    </div>
    <Switch
      checked={isPublic}
      onCheckedChange={onToggle}
      disabled={isLoading}
    />
  </div>
);

export const ShareButton = ({
  threadId,
  initialVisibility,
  className,
  children,
  disabled = false,
}: ShareButtonProps & React.PropsWithChildren) => {
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
        className="w-80 rounded-lg border border-border bg-background p-0"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2 px-4">
            <h3 className="flex items-center gap-2 font-medium text-foreground text-sm">
              <Share className="size-4" />
              Share conversation
            </h3>
            <p className="text-muted-foreground text-xs">
              Control access to this chat thread
            </p>
          </div>

          <VisibilityToggle
            isPublic={isPublic}
            onToggle={handleToggleVisibility}
            isLoading={toggleVisibility.status === "pending"}
          />

          <div className="space-y-2 px-4">
            <p className="font-medium text-foreground text-xs">Share Link</p>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                disabled={!isPublic}
                className={cn(
                  "h-9 min-w-0 w-full flex-1 font-mono text-xs rounded-sm",
                  !isPublic && "cursor-not-allowed opacity-60"
                )}
                placeholder={isPublic ? "" : "Enable sharing to generate link"}
              />
              <CopyButton
                onCopy={handleCopyShareLink}
                className={cn(
                  "rounded-sm size-9",
                  !isPublic && "pointer-events-none opacity-50"
                )}
                disabled={!isPublic}
              />
            </div>
            {!isPublic && (
              <p className="text-muted-foreground text-xs">
                Turn on sharing to generate a public link
              </p>
            )}
          </div>

          {partialShares.length > 0 && (
            <div className="space-y-2 border-border border-t pt-4 px-4">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground text-xs">
                  Partial Shares
                </label>
                <Badge variant="outline" className="text-xs rounded-sm px-1.5">
                  {partialShares.length}
                </Badge>
              </div>

              <div className="max-h-32 space-y-2 overflow-y-auto">
                {partialShares.map((share) => (
                  <div
                    key={share.token}
                    className="flex items-center gap-2 border border-border rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-foreground text-xs">
                        {share.token}
                      </div>
                      <div className="mt-1 text-muted-foreground text-xs">
                        Created {new Date(share.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        onCopy={() => handleCopyPartialShare(share.token)}
                        className="size-8 rounded-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="size-8 rounded-sm p-0 hover:bg-destructive/10"
                        onClick={() => handleDeletePartialShare(share.token)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground text-xs">
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
