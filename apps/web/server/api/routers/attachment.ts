import { env } from "@/env";
import { attachment, messageAttachment } from "@/lib/db/schema/thread";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const attachmentRouter = router({
  /**
   * Get attachments for a message
   */
  getMessageAttachments: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
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
        .where(eq(messageAttachment.messageId, input.messageId));
    }),

  /**
   * Delete attachment (removes from both Vercel Blob and database)
   */
  delete: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete from Vercel Blob
        await del(input.url, {
          token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
        });

        return { success: true };
      } catch (_error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete attachment",
        });
      }
    }),
});
