import { env } from "@/env";
import { generateText } from "ai";
import { getLanguageModel } from "./models";

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
  const { model } = getLanguageModel("openai:gpt-4.1-nano", {
    apiKeys: {
      openai: apiKeys.openai || env.OPENAI_API_KEY,
    },
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
