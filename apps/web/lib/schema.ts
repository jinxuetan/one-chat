import { z } from "zod";

export const chatRequestSchema = z.object({
  selectedModel: z.string(),
  effort: z.enum(["low", "medium", "high"]),
  enableSearch: z.boolean(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
