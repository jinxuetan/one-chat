import { env } from "@/env";
import {
  getOrCreateThread,
  loadChat,
  upsertMessage,
} from "@/lib/actions/thread";
import { appendStreamId, loadStreams } from "@/lib/actions/stream";
import { type Model, getLanguageModel } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { chatRequestSchema } from "@/lib/schema";
import {
  type UIMessage,
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  generateId,
  streamText,
} from "ai";
import { Redis } from "ioredis";
import { type NextRequest, after } from "next/server";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { handleImageGeneration } from "@/lib/actions/image";

const publisher = new Redis(env.UPSTASH_REDIS_URL);
const subscriber = new Redis(env.UPSTASH_REDIS_URL);

const streamContext = createResumableStreamContext({
  waitUntil: after,
  publisher,
  subscriber,
});

export const maxDuration = 150;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { messages, message, id } = body as {
      messages: UIMessage[];
      message: UIMessage;
      id: string;
    };
    const { selectedModel } = chatRequestSchema.parse(body);

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    if (!selectedModel)
      return new Response("Model not specified", { status: 400 });

    const streamId = generateId();

    await getOrCreateThread({
      id,
      userId: session.user.id,
    });

    await Promise.all([
      upsertMessage({
        threadId: id,
        id: message.id,
        message,
        model: selectedModel,
      }),
      appendStreamId({ chatId: id, streamId }),
    ]);

    const previousMessages = await loadChat(id);
    const allMessages = appendClientMessage({
      messages: previousMessages.map(
        (m) =>
          ({
            ...m,
            content: "",
          } as UIMessage)
      ),
      message,
    });

    const model = getLanguageModel(selectedModel as Model);

    if (selectedModel === "openai:gpt-imagegen") {
      return await handleImageGeneration({
        userId: session.user.id,
        thread: {
          id,
          prompt: message.content,
          selectedModel,
        },
        stream: {
          id: streamId,
          context: streamContext,
        },
      });
    }

    const stream = createDataStream({
      execute: (dataStream) => {
        dataStream.writeMessageAnnotation({
          type: "model",
          model: selectedModel,
        });

        const result = streamText({
          model,
          messages: allMessages,
          onFinish: async ({ response }) => {
            const newMessage = appendResponseMessages({
              messages: allMessages,
              responseMessages: response.messages,
            }).at(-1)!;

            await upsertMessage({
              id: newMessage.id,
              threadId: id,
              message: newMessage as UIMessage,
              model: selectedModel,
              status: "done",
            });
          },
          onError: (error) => {
            console.error("Error in streamText", error);
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
          sendSources: true,
        });
      },
    });

    return new Response(
      await streamContext.resumableStream(streamId, () => stream)
    );
  } catch (error) {
    console.error("Error in /api/chat", error);
    return new Response("Internal server error", { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("id is required", { status: 400 });
  }

  const streamIds = await loadStreams(chatId);

  if (!streamIds.length) {
    const emptyDataStream = createDataStream({
      execute: () => {},
    });
    return new Response(emptyDataStream, { status: 200 });
  }

  const recentStreamId = streamIds[0];

  if (!recentStreamId) {
    const emptyDataStream = createDataStream({
      execute: () => {},
    });
    return new Response(emptyDataStream, { status: 200 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {
      // do nothing
    },
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream
  );

  if (stream) {
    return new Response(stream, { status: 200 });
  }

  // If no active stream, check for completed messages
  const messages = await loadChat(chatId);
  const mostRecentMessage = messages.at(-1);

  if (!mostRecentMessage || mostRecentMessage.role !== "assistant") {
    return new Response(emptyDataStream, { status: 200 });
  }

  const streamWithMessage = createDataStream({
    execute: (buffer) => {
      buffer.writeData({
        type: "append-message",
        message: JSON.stringify(mostRecentMessage),
      });

      // Also send model annotation for the completed message
      buffer.writeMessageAnnotation({
        model: mostRecentMessage.model || "unknown",
        status: "completed",
      });
    },
  });

  return new Response(streamWithMessage, { status: 200 });
};
