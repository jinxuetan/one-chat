import { type Model, getLanguageModel } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { chatRequestSchema } from "@/lib/schema";
import { streamText } from "ai";
import type { NextRequest } from "next/server";

export const maxDuration = 30;

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { messages, attachments } = body;
  const { selectedModel, effort, enableSearch } = chatRequestSchema.parse(body);

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  if (!selectedModel)
    return new Response("Model not specified", { status: 400 });

  const model = getLanguageModel(selectedModel as Model);

  const response = streamText({
    model,
    system: `
    You are a helpful assistant.
    `,
    messages,
  });

  return response.toDataStreamResponse({
    sendReasoning: true,
    getErrorMessage(error) {
      console.error(`Error while generating response: ${error}`);
      return "An error occurred while generating the response.";
    },
  });
};
