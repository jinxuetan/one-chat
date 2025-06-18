"use client";

import { usePinnedThreads } from "@/hooks/use-pinned-threads";
import { trpc } from "@/lib/trpc/client";
import {
  filterThreads,
  getThreadGroupsForDisplay,
  groupThreadsByTime,
} from "@/lib/utils/thread-grouping";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command";
import { Loader, Pin, Split } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ThreadCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

interface ThreadCommandItemProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  thread: any;
  isPinned: boolean;
  onSelect: (threadId: string) => void;
}

const ThreadCommandItem = ({
  thread,
  isPinned,
  onSelect,
}: ThreadCommandItemProps) => {
  const isBusy =
    thread.title === "Cloning..." || thread.title === "Generating Title...";

  return (
    <CommandItem
      key={thread.id}
      value={`${thread.title} ${thread.id}`}
      onSelect={() => !isBusy && onSelect(thread.id)}
      disabled={isBusy}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isPinned && (
          <Pin className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {thread.originThreadId && (
          <Split className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{thread.title}</span>
      </div>
      {isBusy && (
        <Loader className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      )}
    </CommandItem>
  );
};

export const ThreadCommandDialog = ({
  open,
  onOpenChange,
  onClose,
}: ThreadCommandDialogProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { pinnedThreadIds, isLoaded: pinnedThreadsLoaded } = usePinnedThreads();

  const { data: threads = [], isLoading } = trpc.thread.getUserThreads.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.data?.code === "UNAUTHORIZED") return false;
        return failureCount < 3;
      },
    }
  );

  const groupedThreads = useMemo(() => {
    if (!threads || !pinnedThreadsLoaded) return null;

    const filteredThreads = filterThreads(threads, searchQuery);
    const threadGroups = groupThreadsByTime(filteredThreads, pinnedThreadIds);
    return getThreadGroupsForDisplay(threadGroups);
  }, [threads, searchQuery, pinnedThreadIds, pinnedThreadsLoaded]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    onClose?.();
  }, [onOpenChange, onClose]);

  const handleThreadSelect = useCallback(
    (threadId: string) => {
      router.push(`/thread/${threadId}`);
      handleClose();
    },
    [router, handleClose]
  );

  const handleNewThread = useCallback(() => {
    router.push("/");
    router.refresh();
    handleClose();
  }, [router, handleClose]);

  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setSearchQuery("");
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Threads"
      description="Search and navigate to your conversations"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search threads..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="size-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground text-sm">
              Loading threads...
            </span>
          </div>
        ) : (
          <>
            <CommandGroup heading="Actions">
              <CommandItem value="new-thread" onSelect={handleNewThread}>
                <span>New Thread</span>
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            {!groupedThreads || groupedThreads.length === 0 ? (
              <CommandEmpty>
                {searchQuery.trim() ? "No threads found" : "No threads yet"}
              </CommandEmpty>
            ) : (
              groupedThreads.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.threads.map((thread) => (
                    <ThreadCommandItem
                      key={thread.id}
                      thread={thread}
                      isPinned={pinnedThreadIds.includes(thread.id)}
                      onSelect={handleThreadSelect}
                    />
                  ))}
                </CommandGroup>
              ))
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
