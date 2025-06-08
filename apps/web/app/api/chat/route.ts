import { type Model, getLanguageModel } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { streamText } from "ai";
import type { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const { model, messages } = await req.json();

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  const response = streamText({
    model: getLanguageModel(model as Model),
    messages,
  });

  return response.toDataStreamResponse({
    sendReasoning: true,
  });
};
