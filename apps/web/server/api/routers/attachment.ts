import { env } from "@/env";
import { attachment } from "@/lib/db/schema/chat";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const attachmentRouter = router({
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
        await del(existingAttachment.attachmentUrl, {
          token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
        });

        await ctx.db.delete(attachment).where(eq(attachment.id, input.url));

        return {
          success: true,
          deletedAttachment: existingAttachment,
        };
      } catch (error) {
        console.error("❌ Error deleting attachment:", error);

        if (error instanceof Error && error.message.includes("blob")) {
          console.warn("⚠️ Blob deletion failed, cleaning up database record");
          await ctx.db.delete(attachment).where(eq(attachment.id, input.url));
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete attachment completely",
        });
      }
    }),

  /**
   * Get attachment statistics for user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const attachments = await ctx.db
      .select({
        attachmentType: attachment.attachmentType,
        fileSize: attachment.fileSize,
      })
      .from(attachment)
      .where(eq(attachment.userId, ctx.user.id));

    const stats = attachments.reduce(
      (acc, curr) => {
        acc.totalFiles += 1;
        acc.totalSize += curr.fileSize;

        if (curr.attachmentType === "image") {
          acc.imageCount += 1;
        } else {
          acc.fileCount += 1;
        }

        return acc;
      },
      {
        totalFiles: 0,
        totalSize: 0,
        imageCount: 0,
        fileCount: 0,
      }
    );

    return stats;
  }),
});
