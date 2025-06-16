"use server";

import { auth } from "@/lib/auth/server";
import {
  createCachedThreadFunction,
  invalidateThreadCache,
  prePopulateBranchedThreadCache,
} from "@/lib/cache/thread-cache";
import {
  type ThreadListItem,
  createCachedThreadsFunction,
  invalidateUserThreadsCache,
} from "@/lib/cache/thread-list-cache";
import { db } from "@/lib/db";
import { message as messageTable, thread } from "@/lib/db/schema/thread";
import type { UIMessage } from "ai";
import { and, desc, eq, gt, gte, lt, lte, max, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import type { Model } from "../ai";
import { generateThreadTitle } from "../ai/action";

export const getThreadById = cache(async (id: string) => {
  return await db.select().from(thread).where(eq(thread.id, id)).limit(1);
});

export const getMessageById = cache(
  async (id: string): Promise<(typeof messageTable.$inferSelect)[]> => {
    return await db
      .select()
      .from(messageTable)
      .where(eq(messageTable.id, id))
      .limit(1);
  }
);

const getUserThreadsUncached = async (
  userId: string
): Promise<ThreadListItem[]> => {
  const threadsWithLastMessage = await db
    .select({
      id: thread.id,
      title: thread.title,
      userId: thread.userId,
      visibility: thread.visibility,
      originThreadId: thread.originThreadId,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastMessageAt: max(messageTable.createdAt),
    })
    .from(thread)
    .leftJoin(messageTable, eq(thread.id, messageTable.threadId))
    .where(eq(thread.userId, userId))
    .groupBy(
      thread.id,
      thread.title,
      thread.userId,
      thread.visibility,
      thread.originThreadId,
      thread.createdAt,
      thread.updatedAt
    )
    .orderBy(
      desc(sql`COALESCE(${max(messageTable.createdAt)}, ${thread.updatedAt})`)
    );

  return threadsWithLastMessage.map((t) => ({
    id: t.id,
    title: t.title ?? "New Thread",
    userId: t.userId,
    visibility: t.visibility,
    createdAt: t.createdAt,
    originThreadId: t.originThreadId,
    updatedAt: t.updatedAt,
    lastMessageAt: t.lastMessageAt,
  }));
};

const getThreadWithMessages = async (chatId: string) => {
  const [threadResult, messages] = await Promise.all([
    db
      .select({
        id: thread.id,
        title: thread.title,
        userId: thread.userId,
        visibility: thread.visibility,
      })
      .from(thread)
      .where(eq(thread.id, chatId))
      .limit(1),
    getMessages(chatId),
  ]);

  if (threadResult.length === 0) {
    return null;
  }

  return {
    thread: threadResult[0],
    messages: messages,
  };
};

export const createChat = async ({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}): Promise<string | undefined> => {
  const [result] = await db
    .insert(thread)
    .values({
      id,
      userId,
      title: "New Thread",
    })
    .returning();

  return result?.id;
};

export const upsertMessage = async ({
  threadId,
  message,
  id,
  model,
  status,
  isErrored = false,
  isStopped = false,
  errorMessage,
}: {
  id: string;
  threadId: string;
  message: UIMessage;
  model?: Model;
  status?: "pending" | "streaming" | "done" | "error" | "stopped";
  isErrored?: boolean;
  isStopped?: boolean;
  errorMessage?: string;
}): Promise<typeof messageTable.$inferSelect | undefined> => {
  const [result] = await db
    .insert(messageTable)
    .values({
      id,
      threadId,
      content:
        typeof message.content === "string" ? message.content : undefined,
      parts: message.parts ?? [],
      role: message.role,
      model,
      status,
      isErrored,
      isStopped,
      errorMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: messageTable.id,
      set: {
        content:
          typeof message.content === "string" ? message.content : undefined,
        parts: message.parts ?? [],
        threadId,
        model,
        status,
        isErrored,
        isStopped,
        errorMessage,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (result) {
    invalidateThreadCache(threadId);
  }

  return result;
};

export const loadChat = async (chatId: string) => {
  return await getMessages(chatId);
};

export const getThread = async (): Promise<(typeof thread.$inferSelect)[]> => {
  return await db.select().from(thread);
};

export const getOrCreateThread = async ({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) => {
  // TODO: Maybe use upsert here?
  const [existingThread] = await getThreadById(id);
  if (existingThread) return existingThread;

  const newThread = await createChat({ id, userId });
  if (newThread) invalidateUserThreadsCache(userId);

  return newThread;
};

type GenerateAndUpdateThreadTitlePayload = {
  id: string;
  userQuery: string;
  apiKeys: {
    openai?: string;
    openrouter?: string;
  };
};

export const generateAndUpdateThreadTitle = async ({
  id,
  userQuery,
  apiKeys,
}: GenerateAndUpdateThreadTitlePayload) => {
  const title = await generateThreadTitle({ userQuery, apiKeys });
  await db.update(thread).set({ title }).where(eq(thread.id, id));
};

export const toggleThreadVisibility = async (
  threadId: string
): Promise<{ visibility: "private" | "public"; threadId: string }> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [existingThread] = await getThreadById(threadId);
  if (!existingThread) {
    throw new Error("Thread not found");
  }

  if (existingThread.userId !== session.user.id) {
    throw new Error("Unauthorized: You can only share your own threads");
  }

  const newVisibility =
    existingThread.visibility === "private" ? "public" : "private";

  const [updatedThread] = await db
    .update(thread)
    .set({
      visibility: newVisibility,
      updatedAt: new Date(),
    })
    .where(eq(thread.id, threadId))
    .returning();

  if (updatedThread) {
    invalidateThreadCache(threadId);
    invalidateUserThreadsCache(session.user.id);
  }

  return {
    visibility: newVisibility,
    threadId: updatedThread?.id ?? threadId,
  };
};

export const deleteChat = async (chatId: string): Promise<void> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(thread).where(eq(thread.id, chatId));

  invalidateThreadCache(chatId);
  invalidateUserThreadsCache(session.user.id);
};

export const deleteMessage = async (
  messageId: string
): Promise<(typeof messageTable.$inferSelect)[] | false> => {
  const message = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.id, messageId))
    .limit(1);

  if (message.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: The array has elements
    const targetMessage = message.at(0)!;

    const removed = await db
      .delete(messageTable)
      .where(
        and(
          eq(messageTable.threadId, targetMessage.threadId),
          gt(messageTable.createdAt, targetMessage.createdAt)
        )
      )
      .returning();

    await db.delete(messageTable).where(eq(messageTable.id, messageId));

    invalidateThreadCache(targetMessage.threadId);

    return removed;
  }
  return false;
};

export const deleteTrailingMessages = async ({
  id,
}: {
  id: string;
}): Promise<(typeof messageTable.$inferSelect)[]> => {
  const [referenceMessage] = await db
    .select({
      threadId: messageTable.threadId,
      createdAt: messageTable.createdAt,
    })
    .from(messageTable)
    .where(eq(messageTable.id, id))
    .limit(1);

  if (!referenceMessage) {
    return [];
  }

  const removed = await db
    .delete(messageTable)
    .where(
      and(
        eq(messageTable.threadId, referenceMessage.threadId),
        gt(messageTable.createdAt, referenceMessage.createdAt)
      )
    )
    .returning();

  if (removed.length > 0) {
    invalidateThreadCache(referenceMessage.threadId);
  }

  return removed;
};

export const deleteMessageAndTrailing = async ({
  id,
}: {
  id: string;
}): Promise<(typeof messageTable.$inferSelect)[]> => {
  const [referenceMessage] = await db
    .select({
      threadId: messageTable.threadId,
      createdAt: messageTable.createdAt,
    })
    .from(messageTable)
    .where(eq(messageTable.id, id))
    .limit(1);

  if (!referenceMessage) {
    return [];
  }

  const removed = await db
    .delete(messageTable)
    .where(
      and(
        eq(messageTable.threadId, referenceMessage.threadId),
        gte(messageTable.createdAt, referenceMessage.createdAt)
      )
    )
    .returning();

  if (removed.length > 0) {
    invalidateThreadCache(referenceMessage.threadId);
  }

  return removed;
};

export const getMessageModel = async (
  messageId: string
): Promise<string | null> => {
  const [message] = await db
    .select({ model: messageTable.model })
    .from(messageTable)
    .where(eq(messageTable.id, messageId))
    .limit(1);

  return message?.model || null;
};

export const getLastAssistantModel = async (
  threadId: string
): Promise<string | null> => {
  const [message] = await db
    .select({ model: messageTable.model })
    .from(messageTable)
    .where(
      and(
        eq(messageTable.threadId, threadId),
        eq(messageTable.role, "assistant")
      )
    )
    .orderBy(messageTable.createdAt)
    .limit(1);

  return message?.model || null;
};

export const getMostRecentModel = async (
  threadId: string
): Promise<Model | null> => {
  const [message] = await db
    .select({ model: messageTable.model })
    .from(messageTable)
    .where(
      and(
        eq(messageTable.threadId, threadId),
        sql`${messageTable.model} IS NOT NULL`
      )
    )
    .orderBy(desc(messageTable.createdAt))
    .limit(1);

  return (message?.model as Model) || null;
};

export const retryMessageWithOriginalModel = async (
  messageId: string
): Promise<{
  threadId: string;
  model: string | null;
  messagesUpToRetry: (typeof messageTable.$inferSelect)[];
} | null> => {
  const [targetMessage] = await getMessageById(messageId);
  if (!targetMessage) return null;

  const messagesUpToRetry = await db
    .select()
    .from(messageTable)
    .where(
      and(
        eq(messageTable.threadId, targetMessage.threadId),
        lt(messageTable.createdAt, targetMessage.createdAt)
      )
    )
    .orderBy(messageTable.createdAt);

  return {
    threadId: targetMessage.threadId,
    model: targetMessage.model,
    messagesUpToRetry,
  };
};

const getMessages = async (threadId: string) => {
  const rows = await db
    .select({
      id: messageTable.id,
      threadId: messageTable.threadId,
      content: messageTable.content,
      parts: messageTable.parts,
      role: messageTable.role,
      model: messageTable.model,
      status: messageTable.status,
      annotations: messageTable.annotations,
      createdAt: messageTable.createdAt,
      updatedAt: messageTable.updatedAt,
    })
    .from(messageTable)
    .where(eq(messageTable.threadId, threadId))
    .orderBy(messageTable.createdAt);

  return rows;
};

export const branchOutFromMessage = async ({
  messageId,
  userId,
  originalThreadId,
  newThreadId,
}: {
  messageId: string;
  userId: string;
  originalThreadId: string;
  newThreadId: string;
}): Promise<{ newThreadId: string; messageCount: number }> => {
  const [originalThread] = await getThreadById(originalThreadId);
  if (!originalThread) {
    throw new Error("Original thread not found");
  }

  const [targetMessage] = await getMessageById(messageId);
  if (!targetMessage) {
    throw new Error("Target message not found");
  }

  const messagesToCopy = await db
    .select()
    .from(messageTable)
    .where(
      and(
        eq(messageTable.threadId, originalThreadId),
        lte(messageTable.createdAt, targetMessage.createdAt)
      )
    )
    .orderBy(messageTable.createdAt);

  if (messagesToCopy.length === 0) {
    throw new Error("No messages found to copy");
  }

  const [newThread] = await db
    .insert(thread)
    .values({
      id: newThreadId,
      userId,
      title: originalThread.title,
      originThreadId: originalThreadId,
      visibility: "private",
    })
    .returning();

  if (!newThread) {
    throw new Error("Failed to create new thread");
  }

  const newMessageInserts = messagesToCopy.map((msg, index) => ({
    id: `${newThreadId}-msg-${index}`,
    threadId: newThreadId,
    content: msg.content,
    parts: msg.parts,
    role: msg.role,
    model: msg.model,
    status: msg.status,
    createdAt: new Date(Date.now() + index),
    updatedAt: new Date(Date.now() + index),
  }));

  const insertedMessages = await db
    .insert(messageTable)
    .values(newMessageInserts)
    .returning();

  prePopulateBranchedThreadCache(newThreadId, insertedMessages, {
    title: newThread.title,
    userId: newThread.userId,
    visibility: newThread.visibility,
  });

  return {
    newThreadId: newThread.id,
    messageCount: insertedMessages.length,
  };
};

export { branchOutFromMessage as branchOutFromMessageAlt };

export const getThreadWithMessagesCached = createCachedThreadFunction(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  getThreadWithMessages as any
);

export const getUserThreadsCached = createCachedThreadsFunction(
  getUserThreadsUncached
);

export const markMessageAsStopped = async ({
  messageId,
  threadId,
}: {
  messageId: string;
  threadId: string;
}): Promise<typeof messageTable.$inferSelect | undefined> => {
  const [result] = await db
    .update(messageTable)
    .set({
      status: "stopped",
      isStopped: true,
      updatedAt: new Date(),
    })
    .where(eq(messageTable.id, messageId))
    .returning();

  if (result) {
    invalidateThreadCache(threadId);
  }

  return result;
};

export const markMessageAsErrored = async ({
  messageId,
  threadId,
  errorMessage,
}: {
  messageId: string;
  threadId: string;
  errorMessage?: string;
}): Promise<typeof messageTable.$inferSelect | undefined> => {
  const [result] = await db
    .update(messageTable)
    .set({
      status: "error",
      isErrored: true,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(messageTable.id, messageId))
    .returning();

  if (result) {
    invalidateThreadCache(threadId);
  }

  return result;
};

export const getLastPendingMessage = async (
  threadId: string
): Promise<typeof messageTable.$inferSelect | null> => {
  const [message] = await db
    .select()
    .from(messageTable)
    .where(
      and(
        eq(messageTable.threadId, threadId),
        eq(messageTable.status, "streaming")
      )
    )
    .orderBy(desc(messageTable.createdAt))
    .limit(1);

  return message || null;
};

export const getLastMessage = async (
  threadId: string
): Promise<typeof messageTable.$inferSelect | null> => {
  const [message] = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.threadId, threadId))
    .orderBy(desc(messageTable.createdAt))
    .limit(1);

  return message || null;
};

export const getStopStreamMessageData = async (
  threadId: string
): Promise<{
  lastMessage: typeof messageTable.$inferSelect | null;
  pendingMessage: typeof messageTable.$inferSelect | null;
}> => {
  const [lastMessageResult, pendingMessageResult] = await Promise.all([
    // Get the last message
    db
      .select()
      .from(messageTable)
      .where(eq(messageTable.threadId, threadId))
      .orderBy(desc(messageTable.createdAt))
      .limit(1),
    // Get pending assistant message if any
    db
      .select()
      .from(messageTable)
      .where(
        and(
          eq(messageTable.threadId, threadId),
          eq(messageTable.role, "assistant"),
          eq(messageTable.status, "streaming")
        )
      )
      .orderBy(desc(messageTable.createdAt))
      .limit(1),
  ]);

  return {
    lastMessage: lastMessageResult[0] || null,
    pendingMessage: pendingMessageResult[0] || null,
  };
};
