import type { Model } from "@/lib/ai/config";
import type { Effort } from "./ai/config";

// Static fallback for server-side usage or when no API keys are available
export const DEFAULT_CHAT_MODEL: Model = "openai:gpt-4.1-nano";
export const IMAGE_GENERATION_MODEL: Model = "openai:gpt-imagegen";
export const FALLBACK_MODEL: Model = "openai:gpt-4.1-nano";
export const MAX_STEPS = 10;

// Inspired by https://openrouter.ai/docs/use-cases/reasoning-tokens#reasoning-effort-level
export const EFFORT_PERCENTAGE_MAP: Record<Effort, number> = {
  low: 0.2, // 20% of max_tokens
  medium: 0.5, // 50% of max_tokens
  high: 0.8, // 80% of max_tokens
};
