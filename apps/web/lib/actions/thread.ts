"use server";

import { auth } from "@/lib/auth/server";
import {
  createCachedThreadFunction,
  invalidateThreadCache,
  prePopulateBranchedThreadCache,
} from "@/lib/cache/thread-cache";
import {
  createCachedThreadsFunction,
  invalidateUserThreadsCache,
  type ThreadListItem,
} from "@/lib/cache/thread-list-cache";
import { db } from "@/lib/db";
import {
  attachment,
  messageAttachment,
  message as messageTable,
  thread,
} from "@/lib/db/schema/thread";
import type { JSONValue, UIMessage } from "ai";
import {
  and,
  desc,
  eq,
  gt,
  lt,
  lte,
  max,
  sql,
  inArray,
  gte,
} from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
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
  const [threadResult, messagesWithAttachments] = await Promise.all([
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
    getMessagesWithAttachments(chatId),
  ]);

  if (threadResult.length === 0) {
    return null;
  }

  return {
    thread: threadResult[0],
    messages: messagesWithAttachments,
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
      title: "",
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
  attachmentIds,
}: {
  id: string;
  threadId: string;
  message: UIMessage;
  model?: string;
  status?: "pending" | "streaming" | "done" | "error";
  attachmentIds?: string[];
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
      attachmentIds,
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
        attachmentIds: attachmentIds ?? [],
        updatedAt: new Date(),
      },
    })
    .returning();

  if (result) {
    invalidateThreadCache(threadId);
  }

  return result;
};

export const loadChat = async (
  chatId: string
): Promise<
  (typeof messageTable.$inferSelect & {
    attachments: (typeof attachment.$inferSelect)[];
  })[]
> => {
  return await getMessagesWithAttachments(chatId);
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
  const [existingThread] = await getThreadById(id);
  if (existingThread) return existingThread;

  const newThread = await createChat({ id, userId });
  if (newThread) invalidateUserThreadsCache(userId);

  return newThread;
};

type GenerateAndUpdateThreadTitlePayload = {
  id: string;
  userQuery: string;
};

export const generateAndUpdateThreadTitle = async ({
  id,
  userQuery,
}: GenerateAndUpdateThreadTitlePayload) => {
  const title = await generateThreadTitle({ userQuery: userQuery });
  await db.update(thread).set({ title }).where(eq(thread.id, id));
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

export const createAttachment = async ({
  fileKey,
  fileName,
  fileSize,
  mimeType,
  attachmentType = "file",
  attachmentUrl,
}: {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType?: string;
  attachmentUrl: string;
}): Promise<typeof attachment.$inferSelect | undefined> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [result] = await db
    .insert(attachment)
    .values({
      userId: session.user.id,
      fileKey,
      fileName,
      fileSize,
      mimeType,
      attachmentType,
      attachmentUrl,
    })
    .returning();
  return result;
};

export const createAttachmentAndLinkToMessage = async ({
  attachmentId,
  userId,
  messageId,
  fileKey,
  fileName,
  fileSize,
  mimeType,
  attachmentType = "file",
  attachmentUrl,
}: {
  attachmentId: string;
  userId: string;
  messageId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType?: string;
  attachmentUrl: string;
}): Promise<typeof attachment.$inferSelect | null> => {
  const [newAttachment] = await db
    .insert(attachment)
    .values({
      id: attachmentId,
      userId,
      fileKey,
      fileName,
      fileSize,
      mimeType,
      attachmentType,
      attachmentUrl,
    })
    .returning();

  if (!newAttachment) {
    throw new Error("Failed to create attachment");
  }

  await db.insert(messageAttachment).values({
    messageId,
    attachmentId: newAttachment.id,
  });

  return newAttachment;
};

export const linkMessageAttachment = async (
  messageId: string,
  attachmentId: string
): Promise<typeof messageAttachment.$inferSelect | undefined> => {
  const [result] = await db
    .insert(messageAttachment)
    .values({
      messageId,
      attachmentId,
    })
    .returning();
  return result;
};

export const getMessageAttachments = async (
  messageId: string
): Promise<(typeof attachment.$inferSelect)[]> => {
  return await db
    .select({
      id: attachment.id,
      userId: attachment.userId,
      fileKey: attachment.fileKey,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      attachmentType: attachment.attachmentType,
      attachmentUrl: attachment.attachmentUrl,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    })
    .from(attachment)
    .innerJoin(
      messageAttachment,
      eq(attachment.id, messageAttachment.attachmentId)
    )
    .where(eq(messageAttachment.messageId, messageId));
};

const getMessagesWithAttachments = async (threadId: string) => {
  const rows = await db
    .select({
      message: {
        id: messageTable.id,
        threadId: messageTable.threadId,
        content: messageTable.content,
        parts: messageTable.parts,
        role: messageTable.role,
        model: messageTable.model,
        status: messageTable.status,
        annotations: messageTable.annotations,
        attachmentIds: messageTable.attachmentIds,
        createdAt: messageTable.createdAt,
        updatedAt: messageTable.updatedAt,
      },
      attachment: attachment,
    })
    .from(messageTable)
    .leftJoin(
      messageAttachment,
      eq(messageTable.id, messageAttachment.messageId)
    )
    .leftJoin(attachment, eq(messageAttachment.attachmentId, attachment.id))
    .where(eq(messageTable.threadId, threadId))
    .orderBy(messageTable.createdAt);

  const messagesMap = new Map<
    string,
    typeof messageTable.$inferSelect & {
      attachments: (typeof attachment.$inferSelect)[];
    }
  >();

  for (const row of rows) {
    const messageId = row.message.id;

    if (!messagesMap.has(messageId)) {
      console.info({ annotations: row.message.annotations });
      messagesMap.set(messageId, {
        ...row.message,
        attachments: [],
        annotations: row.message.annotations ?? [],
      });
    }

    if (row.attachment) {
      messagesMap.get(messageId)!.attachments.push(row.attachment);
    }
  }

  return Array.from(messagesMap.values());
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
    attachmentIds: msg.attachmentIds,
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
  getThreadWithMessages as any
);

export const getUserThreadsCached = createCachedThreadsFunction(
  getUserThreadsUncached
);
