import { z } from "zod";
import { DEFAULT_CHAT_MODEL } from "./constants";

export const chatRequestSchema = z.object({
  id: z.string().optional(),
  selectedModel: z.string().default(DEFAULT_CHAT_MODEL),
  effort: z.enum(["low", "medium", "high"]).default("medium"),
  enableSearch: z.boolean().default(false),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
