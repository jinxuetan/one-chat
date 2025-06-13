import type { Model } from "@/lib/ai";
import { Effort } from "./ai/config";

export const DEFAULT_CHAT_MODEL: Model = "openai:gpt-4.1-nano";
export const EFFORT_MAP_FOR_ANTHROPIC: Record<Effort, number> = {
  low: 1024,
  medium: 2560,
  high: 5120,
};
