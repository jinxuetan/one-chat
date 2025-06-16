import { env } from "@/env";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { z } from "zod";

export const attachmentRouter = router({
  /**
  /**
   * Delete attachment (removes from both Vercel Blob and database)
   */
  delete: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
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
