import type { ThreadListItem } from "@/lib/cache/thread-list-cache";

export type ThreadGroup = {
  label: string;
  threads: ThreadListItem[];
};

export type GroupedThreads = {
  pinned: ThreadListItem[];
  today: ThreadListItem[];
  yesterday: ThreadListItem[];
  lastSevenDays: ThreadListItem[];
  lastThirtyDays: ThreadListItem[];
  older: ThreadListItem[];
};

const ensureDate = (date: Date | string): Date => {
  return typeof date === "string" ? new Date(date) : date;
};

const getDateBoundaries = (() => {
  let cached: {
    today: Date;
    yesterday: Date;
    sevenDaysAgo: Date;
    thirtyDaysAgo: Date;
    todayStart: Date;
    yesterdayStart: Date;
  } | null = null;

  return () => {
    if (!cached) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      cached = {
        today,
        yesterday,
        sevenDaysAgo,
        thirtyDaysAgo,
        todayStart: today,
        yesterdayStart: yesterday,
      };
    }
    return cached;
  };
})();

const isToday = (date: Date | string): boolean => {
  const dateObj = ensureDate(date);
  const { todayStart } = getDateBoundaries();
  const nextDay = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  return dateObj >= todayStart && dateObj < nextDay;
};

const isYesterday = (date: Date | string): boolean => {
  const dateObj = ensureDate(date);
  const { yesterdayStart, todayStart } = getDateBoundaries();

  return dateObj >= yesterdayStart && dateObj < todayStart;
};

const isWithinDays = (date: Date | string, days: number): boolean => {
  const dateObj = ensureDate(date);
  const boundaries = getDateBoundaries();

  if (days === 7) {
    return dateObj >= boundaries.sevenDaysAgo;
  } else if (days === 30) {
    return dateObj >= boundaries.thirtyDaysAgo;
  }

  const daysBefore = new Date();
  daysBefore.setDate(daysBefore.getDate() - days);
  return dateObj >= daysBefore;
};

export const groupThreadsByTime = (
  threads: ThreadListItem[],
  pinnedThreadIds: string[]
): GroupedThreads => {
  const grouped: GroupedThreads = {
    pinned: [],
    today: [],
    yesterday: [],
    lastSevenDays: [],
    lastThirtyDays: [],
    older: [],
  };

  for (const thread of threads) {
    if (pinnedThreadIds.includes(thread.id)) {
      grouped.pinned.push(thread);
      continue;
    }

    const relevantDate = thread.lastMessageAt || thread.updatedAt;

    if (isToday(relevantDate)) {
      grouped.today.push(thread);
    } else if (isYesterday(relevantDate)) {
      grouped.yesterday.push(thread);
    } else if (isWithinDays(relevantDate, 7)) {
      grouped.lastSevenDays.push(thread);
    } else if (isWithinDays(relevantDate, 30)) {
      grouped.lastThirtyDays.push(thread);
    } else {
      grouped.older.push(thread);
    }
  }

  return grouped;
};

export const filterThreads = (
  threads: ThreadListItem[],
  searchTerm: string
): ThreadListItem[] => {
  if (!searchTerm.trim()) return threads;

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return threads.filter((thread) =>
    thread.title.toLowerCase().includes(normalizedSearch)
  );
};

export const getThreadGroupsForDisplay = (
  grouped: GroupedThreads
): ThreadGroup[] => {
  const groups: ThreadGroup[] = [];

  if (grouped.pinned.length > 0) {
    groups.push({ label: "Pinned", threads: grouped.pinned });
  }

  if (grouped.today.length > 0) {
    groups.push({ label: "Today", threads: grouped.today });
  }

  if (grouped.yesterday.length > 0) {
    groups.push({ label: "Yesterday", threads: grouped.yesterday });
  }

  if (grouped.lastSevenDays.length > 0) {
    groups.push({ label: "Last 7 Days", threads: grouped.lastSevenDays });
  }

  if (grouped.lastThirtyDays.length > 0) {
    groups.push({ label: "Last 30 Days", threads: grouped.lastThirtyDays });
  }

  if (grouped.older.length > 0) {
    groups.push({ label: "Older", threads: grouped.older });
  }

  return groups;
};
