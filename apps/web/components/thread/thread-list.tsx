"use client";

import { useParams } from "next/navigation";
import { useDeferredValue, useMemo, useEffect } from "react";

import { usePinnedThreads } from "@/hooks/use-pinned-threads";
import { trpc } from "@/lib/trpc/client";
import {
  filterThreads,
  getThreadGroupsForDisplay,
  groupThreadsByTime,
} from "@/lib/utils/thread-grouping";
import { ThreadItem } from "./thread-item";

interface ThreadListProps {
  search: string;
}

const ThreadGroupComponent = ({
  label,
  threads,
  currentThreadId,
  pinnedThreadIds,
}: {
  label: string;
  threads: any[];
  currentThreadId?: string;
  pinnedThreadIds: string[];
}) => (
  <div className="space-y-1">
    <div className="px-2 py-1">
      <h3 className="text-xs font-medium text-muted-foreground tracking-wider">
        {label}
      </h3>
    </div>
    <div className="space-y-0.5">
      {threads.map((thread) => (
        <ThreadItem
          key={`${thread.id}-${
            pinnedThreadIds.includes(thread.id) ? "pinned" : "unpinned"
          }`}
          thread={thread}
          isActive={currentThreadId === thread.id}
        />
      ))}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-4 py-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 w-20 bg-secondary border animate-pulse rounded px-2" />
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, j) => (
            <div
              key={j}
              className="h-8 bg-secondary border animate-pulse rounded mx-1"
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-muted-foreground text-sm">
      {hasSearch ? "No threads found" : "No threads yet"}
    </div>
    {hasSearch && (
      <div className="text-xs text-muted-foreground mt-1">
        Try adjusting your search terms
      </div>
    )}
  </div>
);

const ErrorState = ({ error }: { error: any }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-destructive text-sm">Failed to load threads</div>
    <div className="text-xs text-muted-foreground mt-1">
      {error?.message || "Please try again"}
    </div>
  </div>
);

export const ThreadList = ({ search }: ThreadListProps) => {
  const params = useParams();
  const currentThreadId = params?.id as string;
  const deferredSearch = useDeferredValue(search);
  const isSearching = search !== deferredSearch;

  const { pinnedThreadIds, isLoaded: isPinningLoaded } = usePinnedThreads();

  const {
    data: threads = [],
    isLoading,
    isError,
    error,
  } = trpc.thread.getUserThreads.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.data?.code === "UNAUTHORIZED") return false;
      return failureCount < 3;
    },
  });

  const filteredAndGroupedThreads = useMemo(() => {
    if (!threads || !isPinningLoaded) {
      return null;
    }

    const filtered = filterThreads(threads, deferredSearch);
    const grouped = groupThreadsByTime(filtered, pinnedThreadIds);
    return getThreadGroupsForDisplay(grouped);
  }, [threads, deferredSearch, pinnedThreadIds, isPinningLoaded]);

  const renderKey = `${pinnedThreadIds.join(",")}-${currentThreadId}`;

  if (isLoading || !isPinningLoaded) return <LoadingSkeleton />;
  if (isError) return <ErrorState error={error} />;
  if (!filteredAndGroupedThreads || filteredAndGroupedThreads.length === 0)
    return <EmptyState hasSearch={deferredSearch.trim().length > 0} />;

  return (
    <div className="space-y-2 py-2" key={renderKey}>
      {isSearching && (
        <div className="text-xs text-muted-foreground px-2 animate-pulse">
          Searching...
        </div>
      )}
      {filteredAndGroupedThreads.map((group) => (
        <ThreadGroupComponent
          key={group.label}
          label={group.label}
          threads={group.threads}
          currentThreadId={currentThreadId}
          pinnedThreadIds={pinnedThreadIds}
        />
      ))}
    </div>
  );
};
