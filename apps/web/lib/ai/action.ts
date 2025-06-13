import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export type GenerateThreadTitlePayload = {
  userQuery: string;
};

export const generateThreadTitle = async ({
  userQuery,
}: GenerateThreadTitlePayload) => {
  const { text } = await generateText({
    model: openai("gpt-4.1-nano"),
    prompt: `Generate a concise title for the following user query (max 60 characters). 
    Return only the title text, without any preambles or markdown formatting.
    User Query: "${userQuery}"`,
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 25,
  });

  return text.trim().replace(/"/g, "");
};
