import { generateText } from "ai";
import { getLanguageModel } from "./models";
import { env } from "@/env";

export type GenerateThreadTitlePayload = {
  userQuery: string;
  apiKeys: {
    openai?: string;
    openrouter?: string;
  };
};

export const generateThreadTitle = async ({
  userQuery,
  apiKeys,
}: GenerateThreadTitlePayload) => {
  const effectiveApiKeys = {
    openai: apiKeys.openai || env.OPENAI_API_KEY,
    openrouter: apiKeys.openrouter || env.OPENROUTER_API_KEY,
  };

  const { model } = getLanguageModel("openai:gpt-4.1-nano", {
    apiKeys: effectiveApiKeys,
    forceOpenRouter: !effectiveApiKeys.openai,
  });

  const { text } = await generateText({
    model,
    prompt: `Generate a concise title for the following user query (max 60 characters). 
    Return only the title text, without any preambles or markdown formatting.
    User Query: "${userQuery}"`,
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 25,
  });

  return text.trim().replace(/"/g, "");
};
