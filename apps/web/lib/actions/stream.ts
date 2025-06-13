import { redis } from "@/lib/redis";

/**
 * Store a stream ID associated with a chat ID
 * @param chatId - The chat ID to associate the stream with
 * @param streamId - The stream ID to store
 */
export const appendStreamId = async ({
  chatId,
  streamId,
}: {
  chatId: string;
  streamId: string;
}): Promise<void> => {
  const key = `chat:${chatId}:streams`;
  await redis.lpush(key, streamId);
  // Set expiration to 24 hours to prevent indefinite growth
  await redis.expire(key, 86400);
};

/**
 * Load all stream IDs associated with a chat ID
 * @param chatId - The chat ID to load streams for
 * @returns Array of stream IDs (most recent first)
 */
export const loadStreams = async (chatId: string): Promise<string[]> => {
  const key = `chat:${chatId}:streams`;
  const streams = await redis.lrange(key, 0, -1);
  return streams as string[];
};

/**
 * Get the most recent stream ID for a chat
 * @param chatId - The chat ID to get the latest stream for
 * @returns The most recent stream ID or null if none exists
 */
export const getLatestStreamId = async (
  chatId: string
): Promise<string | null> => {
  const streams = await loadStreams(chatId);
  return streams.length > 0 ? (streams[0] ?? null) : null;
};

/**
 * Clear all streams for a chat (useful when chat is completed or deleted)
 * @param chatId - The chat ID to clear streams for
 */
export const clearChatStreams = async (chatId: string): Promise<void> => {
  const key = `chat:${chatId}:streams`;
  await redis.del(key);
};
