import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "./constants";

export const chatRequestSchema = z.object({
  id: z.string().optional(),
  selectedModel: z.string().default(DEFAULT_CHAT_MODEL),
  effort: z.enum(["low", "medium", "high"]).default("medium"),
  searchMode: z.enum(["off", "native", "tool"]).default("off"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
