import { z } from "zod";
import { AVAILABLE_MODELS, type Model } from "./ai";

const modelKeys = Object.keys(AVAILABLE_MODELS) as [Model, ...Model[]];

export const chatRequestSchema = z.object({
  id: z.string(),
  selectedModel: z.enum(modelKeys).optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).default("medium"),
  searchStrategy: z.enum(["off", "native", "tool"]).default("off"),
  forceOpenRouter: z.boolean().default(false),

  // User-provided API keys
  userApiKeys: z
    .object({
      openai: z.string().optional(),
      anthropic: z.string().optional(),
      google: z.string().optional(),
      openrouter: z.string().optional(),
    })
    .optional(),

  // Loose types for AI SDK
  message: z.any(),
  experimental_attachments: z.any(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
