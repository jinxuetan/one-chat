import {
  branchOutFromMessageAlt as branchOutFromMessage,
  deleteChat,
  deleteMessageAndTrailing,
  deleteTrailingMessages,
  generateAndUpdateThreadTitle,
  getUserThreadsCached,
  toggleThreadVisibility,
} from "@/lib/actions/thread";
import {
  createPartialShare,
  deletePartialShare,
  getUserPartialShares,
} from "@/lib/actions/partial-share";
import { getUserThreadsCacheKey } from "@/lib/cache/thread-list-cache";
import { redis } from "@/lib/redis";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const threadRouter = router({
  /**
   * Get all threads for the authenticated user
   * Optimized with Redis caching for sidebar performance
   */
  getUserThreads: protectedProcedure.query(async ({ ctx }) => {
    try {
      const threads = await getUserThreadsCached(ctx.user.id);
      return threads;
    } catch (error) {
      console.error("Error in getUserThreads:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch threads",
      });
    }
  }),

  /**
   * Delete a thread completely
   * Used for removing threads from sidebar
   */
  deleteThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteChat(input.threadId);
        return { success: true };
      } catch (error) {
        console.error("Error in deleteThread:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete thread",
        });
      }
    }),

  /**
   * Delete all messages after a specific message in a thread
   * Used for regenerating conversation from a specific point
   */
  deleteTrailingMessages: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const deletedMessages = await deleteTrailingMessages({
          id: input.messageId,
        });

        return {
          success: true,
          deletedCount: deletedMessages.length,
        };
      } catch (error) {
        console.error("Error in deleteTrailingMessages:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete trailing messages: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  /**
   * Delete a specific message and all messages after it in a thread
   * Used for retrying AI messages
   */
  deleteMessageAndTrailing: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const deletedMessages = await deleteMessageAndTrailing({
          id: input.messageId,
        });

        return {
          success: true,
          deletedCount: deletedMessages.length,
        };
      } catch (error) {
        console.error("Error in deleteMessageAndTrailing:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete message and trailing messages: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  generateAndUpdateThreadTitle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userQuery: z.string(),
        apiKeys: z
          .object({
            openai: z.string().optional(),
            openrouter: z.string().optional(),
          })
          .optional()
          .default({}),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const threadPromise = generateAndUpdateThreadTitle(input);
      const threadCachePromise = redis.del(getUserThreadsCacheKey(ctx.user.id));
      await Promise.all([threadPromise, threadCachePromise]);
    }),

  /**
   * Branch out from a specific message - creates a new thread with messages up to that point
   * Used when users want to explore different conversation paths
   */
  branchOut: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        originalThreadId: z.string(),
        newThreadId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const resultPromise = branchOutFromMessage({
          messageId: input.messageId,
          userId: ctx.user.id,
          originalThreadId: input.originalThreadId,
          newThreadId: input.newThreadId,
        });
        const threadCachePromise = redis.del(
          getUserThreadsCacheKey(ctx.user.id)
        );
        const [result] = await Promise.all([resultPromise, threadCachePromise]);
        return result;
      } catch (error) {
        console.error("Error in branchOut:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to branch out from message",
        });
      }
    }),

  /**
   * Toggle thread visibility between private and public
   * Used for sharing/unsharing threads
   */
  toggleVisibility: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await toggleThreadVisibility(input.threadId);
        return result;
      } catch (error) {
        console.error("Error in toggleVisibility:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to toggle thread visibility",
        });
      }
    }),

  /**
   * Create a partial share token for a thread up to a specific message
   * Used for sharing threads up to a certain point
   */
  createPartialShare: protectedProcedure
    .input(z.object({ threadId: z.string(), messageId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await createPartialShare({
          threadId: input.threadId,
          messageId: input.messageId,
        });
        return result;
      } catch (error) {
        console.error("Error in createPartialShare:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create partial share",
        });
      }
    }),

  /**
   * Get all partial shares for the authenticated user
   * Used for managing partial shares in UI
   */
  getUserPartialShares: protectedProcedure.query(async () => {
    try {
      const partialShares = await getUserPartialShares();
      return partialShares;
    } catch (error) {
      console.error("Error in getUserPartialShares:", error);

      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch partial shares",
      });
    }
  }),

  /**
   * Delete a partial share
   * Used for removing partial shares
   */
  deletePartialShare: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await deletePartialShare(input.token);
        return { success: result };
      } catch (error) {
        console.error("Error in deletePartialShare:", error);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete partial share",
        });
      }
    }),
});
