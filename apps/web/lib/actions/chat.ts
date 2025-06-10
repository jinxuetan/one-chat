"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  attachment,
  messageAttachment,
  message as messageTable,
  thread,
} from "@/lib/db/schema/chat";
import type { UIMessage } from "ai";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

export const createChat = async (): Promise<string | undefined> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [result] = await db
    .insert(thread)
    .values({
      userId: session.user.id,
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
      threadId,
      content:
        typeof message.content === "string" ? message.content : undefined,
      parts: message.parts ?? [],
      role: message.role,
      model,
      status: status ?? "done",
      attachmentIds: attachmentIds ?? [],
      id,
    })
    .onConflictDoUpdate({
      target: messageTable.id,
      set: {
        content:
          typeof message.content === "string" ? message.content : undefined,
        parts: message.parts ?? [],
        threadId,
        model,
        status: status ?? "done",
        attachmentIds: attachmentIds ?? [],
      },
    })
    .returning();
  return result;
};

export const loadChat = async (
  chatId: string
): Promise<(typeof messageTable.$inferSelect)[]> => {
  const messagesResult = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.threadId, chatId))
    .orderBy(messageTable.createdAt);
  return messagesResult;
};

export const getThread = async (): Promise<(typeof thread.$inferSelect)[]> => {
  const c = await db.select().from(thread);
  return c;
};

export const deleteChat = async (chatId: string): Promise<void> => {
  await db.delete(thread).where(eq(thread.id, chatId));
};

export const deleteMessage = async (
  messageId: string
): Promise<(typeof messageTable.$inferSelect)[] | false> => {
  return await db.transaction(async (tx) => {
    const message = await tx
      .select()
      .from(messageTable)
      .where(eq(messageTable.id, messageId))
      .limit(1);

    if (message.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: Add non-null assertion since we checked length > 0
      const targetMessage = message.at(0)!;

      const removed = await tx
        .delete(messageTable)
        .where(
          and(
            eq(messageTable.threadId, targetMessage.threadId),
            gt(messageTable.createdAt, targetMessage.createdAt)
          )
        )
        .returning();

      await tx.delete(messageTable).where(eq(messageTable.id, messageId));

      return removed;
    }
    return false;
  });
};

// Attachment management functions
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
  const result = await db
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
      eq(messageAttachment.attachmentId, attachment.id)
    )
    .where(eq(messageAttachment.messageId, messageId));

  return result;
};
