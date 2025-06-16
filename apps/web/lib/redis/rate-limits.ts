import { Ratelimit } from "@upstash/ratelimit";
import { redis } from ".";

export const voiceRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour
  analytics: true,
  prefix: "voice_transcription",
});
