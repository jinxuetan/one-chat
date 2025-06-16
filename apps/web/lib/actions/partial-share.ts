"use server";

import { auth } from "@/lib/auth/server";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getMessageById, getThreadWithMessagesCached } from "./thread";

export interface PartialShare {
  token: string;
  threadId: string;
  messageId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const PARTIAL_SHARE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const PARTIAL_SHARE_KEY_PREFIX = "partial_share:";
const USER_PARTIAL_SHARES_KEY_PREFIX = "user_partial_shares:";

/**
 * Create a partial share token for a thread up to a specific message
 */
export const createPartialShare = async ({
  threadId,
  messageId,
}: {
  threadId: string;
  messageId: string;
}): Promise<PartialShare> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify the thread exists and user owns it
  const thread = await getThreadWithMessagesCached(threadId);
  if (!thread?.thread || thread.thread.userId !== session.user.id) {
    throw new Error("Thread not found or access denied");
  }

  // Verify the message exists in this thread
  const [message] = await getMessageById(messageId);
  if (!message || message.threadId !== threadId) {
    throw new Error("Message not found in this thread");
  }

  const token = nanoid(12);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PARTIAL_SHARE_TTL * 1000);

  const partialShare: PartialShare = {
    token,
    threadId,
    messageId,
    userId: session.user.id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Store the partial share in Redis
  await redis.setex(
    `${PARTIAL_SHARE_KEY_PREFIX}${token}`,
    PARTIAL_SHARE_TTL,
    JSON.stringify(partialShare)
  );

  // Add to user's partial shares list
  const userPartialSharesKey = `${USER_PARTIAL_SHARES_KEY_PREFIX}${session.user.id}`;
  await redis.sadd(userPartialSharesKey, token);
  await redis.expire(userPartialSharesKey, PARTIAL_SHARE_TTL);

  return partialShare;
};

/**
 * Get a partial share by token
 */
export const getPartialShare = async (
  token: string
): Promise<PartialShare | null> => {
  try {
    const data = await redis.get(`${PARTIAL_SHARE_KEY_PREFIX}${token}`);
    if (!data) return null;

    // Redis might return an object or string depending on the client
    const partialShare =
      typeof data === "string"
        ? (JSON.parse(data) as PartialShare)
        : (data as PartialShare);

    // Check if expired
    if (new Date(partialShare.expiresAt) < new Date()) {
      // Delete expired partial share without auth check
      await redis.del(`${PARTIAL_SHARE_KEY_PREFIX}${token}`);
      return null;
    }

    return partialShare;
  } catch (error) {
    console.error("Error getting partial share:", error);
    return null;
  }
};

/**
 * Delete a partial share
 */
export const deletePartialShare = async (token: string): Promise<boolean> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the partial share to verify ownership
  const partialShare = await getPartialShare(token);
  if (partialShare && partialShare.userId !== session.user.id) {
    throw new Error("Access denied");
  }

  // Remove from Redis
  const pipeline = redis.pipeline();
  pipeline.del(`${PARTIAL_SHARE_KEY_PREFIX}${token}`);
  pipeline.srem(`${USER_PARTIAL_SHARES_KEY_PREFIX}${session.user.id}`, token);

  const results = await pipeline.exec();
  return results !== null && Array.isArray(results[0]) && results[0][1] === 1;
};

/**
 * Get all partial shares for a user
 */
export const getUserPartialShares = async (): Promise<PartialShare[]> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const tokens = await redis.smembers(
    `${USER_PARTIAL_SHARES_KEY_PREFIX}${session.user.id}`
  );
  const partialShares: PartialShare[] = [];

  for (const token of tokens) {
    const partialShare = await getPartialShare(token);
    if (partialShare) {
      partialShares.push(partialShare);
    }
  }

  // Sort by creation date (newest first)
  return partialShares.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get thread data for a partial share (up to the specified message)
 */
export const getPartialThreadData = async (token: string) => {
  const partialShare = await getPartialShare(token);
  if (!partialShare) {
    return null;
  }

  const thread = await getThreadWithMessagesCached(partialShare.threadId);
  if (!thread?.thread) {
    return null;
  }

  // Get the target message to find the cutoff point
  const [targetMessage] = await getMessageById(partialShare.messageId);
  if (!targetMessage) {
    return null;
  }

  // Filter messages up to and including the target message
  const messagesUpToTarget = thread.messages.filter(
    (msg) => new Date(msg.createdAt) <= new Date(targetMessage.createdAt)
  );

  return {
    thread: {
      ...thread.thread,
      id: partialShare.token, // Use token as ID for partial share
      title: `${thread.thread.title} (Partial)`,
      visibility: "public" as const, // Partial shares are always public
    },
    messages: messagesUpToTarget,
    isPartialShare: true,
    originalThreadId: partialShare.threadId,
    cutoffMessageId: partialShare.messageId,
  };
};
