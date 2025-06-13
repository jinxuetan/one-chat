import { redis } from "@/lib/redis";
import { after } from "next/server";
import { cache } from "react";

// Thread list item type for sidebar display
// Note: tRPC returns date strings, so we handle both Date objects and strings
export type ThreadListItem = {
  id: string;
  title: string;
  userId: string;
  originThreadId: string | null;
  visibility: "public" | "private";
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt: Date | string | null;
};

// Cache key pattern for user thread lists
export const getUserThreadsCacheKey = (userId: string) => `user:${userId}:threads`;

// Cache TTL in seconds (5 minutes for thread lists)
const THREAD_LIST_CACHE_TTL = 300;

// Get user threads from cache
export const getUserThreadsFromCache = async (
  userId: string
): Promise<ThreadListItem[] | null> => {
  const cacheKey = getUserThreadsCacheKey(userId);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as ThreadListItem[];
    }
  } catch (error) {
    console.warn("Redis cache read failed for user threads:", userId, error);
  }

  return null;
};

// Set user threads in cache (non-blocking using after)
export const setUserThreadsCache = (
  userId: string,
  threads: ThreadListItem[]
) => {
  after(async () => {
    const cacheKey = getUserThreadsCacheKey(userId);
    try {
      await redis.set(cacheKey, threads, { ex: THREAD_LIST_CACHE_TTL });
    } catch (error) {
      console.warn("Redis cache write failed for user threads:", userId, error);
    }
  });
};

// Invalidate user threads cache (non-blocking using after)
export const invalidateUserThreadsCache = (userId: string) => {
  after(async () => {
    const cacheKey = getUserThreadsCacheKey(userId);
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.warn(
        "Failed to invalidate threads cache for user:",
        userId,
        error
      );
    }
  });
};

// Create cached version of getUserThreads function
export const createCachedThreadsFunction = <
  T extends (userId: string) => Promise<ThreadListItem[]>
>(
  getUserThreads: T
) => {
  return async (userId: string): Promise<ThreadListItem[]> => {
    const cached = await getUserThreadsFromCache(userId);
    if (cached) return cached;

    const threads = await getUserThreads(userId);

    // Cache the result asynchronously (non-blocking)
    setUserThreadsCache(userId, threads);

    return threads;
  };
};
