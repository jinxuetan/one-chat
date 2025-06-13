import { redis } from "@/lib/redis";
import { Attachment } from "ai";
import { after } from "next/server";
import { cache } from "react";

// Define the thread data type (matches actual return type of getThreadWithMessages)
type ThreadWithMessages = {
  thread: {
    id: string;
    title: string | null;
    userId: string;
    visibility: "public" | "private";
  };
  messages: Array<{
    id: string;
    content: string | null;
    parts: unknown;
    role: "user" | "assistant" | "system" | "data";
    model: string | null;
    status: "pending" | "streaming" | "done" | "error" | null;
    createdAt: Date;
    attachments: Attachment[] | null;
  }>;
} | null;

// Cache key pattern for thread data
const getThreadCacheKey = (threadId: string) =>
  `thread:${threadId}:withMessages`;

// Cache TTL in seconds (30 seconds)
const CACHE_TTL = 30;

// Get thread data from cache
export const getThreadFromCache = async (
  threadId: string
): Promise<ThreadWithMessages> => {
  const cacheKey = getThreadCacheKey(threadId);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as ThreadWithMessages;
    }
  } catch (error) {
    console.warn("Redis cache read failed for thread:", threadId, error);
  }

  return null;
};

// Set thread data in cache (non-blocking using after)
export const setThreadCache = (threadId: string, data: ThreadWithMessages) => {
  if (!data) return;

  after(async () => {
    const cacheKey = getThreadCacheKey(threadId);
    try {
      await redis.set(cacheKey, data, { ex: CACHE_TTL });
    } catch (error) {
      console.warn("Redis cache write failed for thread:", threadId, error);
    }
  });
};

// Invalidate thread cache (non-blocking using after)
export const invalidateThreadCache = (threadId: string) => {
  after(async () => {
    const cacheKey = getThreadCacheKey(threadId);
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.warn("Failed to invalidate cache for thread:", threadId, error);
    }
  });
};

// Create cached version of any function that returns ThreadWithMessages
export const createCachedThreadFunction = <
  T extends (chatId: string) => Promise<ThreadWithMessages>
>(
  getThreadWithMessages: T
) => {
  return cache(async (chatId: string): Promise<ThreadWithMessages> => {
    const cached = await getThreadFromCache(chatId);
    if (cached) return cached;

    const data = await getThreadWithMessages(chatId);

    // Cache the result asynchronously (non-blocking)
    setThreadCache(chatId, data);

    return data;
  });
};

// Specialized caching for branched threads - pre-populate cache with expected structure
export const prePopulateBranchedThreadCache = async (
  newThreadId: string,
  originalMessages: Array<{
    id: string;
    content: string | null;
    parts: unknown;
    role: "user" | "assistant" | "system" | "data";
    model: string | null;
    status: "pending" | "streaming" | "done" | "error" | null;
    createdAt: Date;
    updatedAt: Date;
    attachments: Attachment[] | null;
  }>,
  threadInfo: {
    title: string | null;
    userId: string;
    visibility: "public" | "private";
  }
) => {
  const cacheData: ThreadWithMessages = {
    thread: {
      id: newThreadId,
      title: threadInfo.title,
      userId: threadInfo.userId,
      visibility: threadInfo.visibility,
    },
    messages: originalMessages,
  };

  // Set cache with longer TTL for branched threads (they change less frequently)
  const cacheKey = getThreadCacheKey(newThreadId);
  try {
    await redis.setex(cacheKey, 120, JSON.stringify(cacheData)); // 2 minutes
  } catch (error) {
    console.warn("Failed to pre-populate branched thread cache:", error);
  }
};
