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
      const [existingAttachment] = await ctx.db
        .select()
        .from(attachment)
        .where(eq(attachment.attachmentUrl, input.url))
        .limit(1);

      if (!existingAttachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      if (existingAttachment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own attachments",
        });
      }

      try {
        // Delete from Vercel Blob
        await del(existingAttachment.attachmentUrl, {
          token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
        });

        // Delete from database
        await ctx.db
          .delete(attachment)
          .where(eq(attachment.id, existingAttachment.id));

        return { success: true };
      } catch (_error) {
        // If blob deletion fails, still clean up database
        await ctx.db
          .delete(attachment)
          .where(eq(attachment.id, existingAttachment.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete attachment",
        });
      }
    }),
});
