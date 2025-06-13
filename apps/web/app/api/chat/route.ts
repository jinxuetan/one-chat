import { env } from "@/env";
import { createImageGenerationTool } from "@/lib/actions/image";
import { appendStreamId, loadStreams } from "@/lib/actions/stream";
import {
  getOrCreateThread,
  loadChat,
  upsertMessage,
} from "@/lib/actions/thread";
import { webSearch } from "@/lib/actions/web-search";
import { type Model, getLanguageModel } from "@/lib/ai";
import { getModelByKey, ModelOptions } from "@/lib/ai/models";
import { auth } from "@/lib/auth/server";
import { EFFORT_MAP_FOR_ANTHROPIC } from "@/lib/constants";
import { chatRequestSchema } from "@/lib/schema";
import { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
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
    const { message, id, isRestrictedToOpenRouter } = body as {
      message: UIMessage;
      id: string;
      experimental_attachments: any[];
      isRestrictedToOpenRouter: boolean;
    };

    // modelIdentifier, reasoningEffort
    const { selectedModel, effort, searchStrategy } =
      chatRequestSchema.parse(body);

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
        attachments: message.experimental_attachments,
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

    const modelOptions: ModelOptions = {
      enableSearch: searchStrategy === "native",
      onlyOpenRouter: isRestrictedToOpenRouter,
    };

    const model = getLanguageModel(selectedModel as Model, modelOptions);
    const modelConfig = getModelByKey(selectedModel as Model);

    const stream = createDataStream({
      execute: (dataStream) => {
        dataStream.writeMessageAnnotation({
          type: "model",
          model: selectedModel,
        });

        const result = streamText({
          model:
            selectedModel === "openai:gpt-imagegen"
              ? getLanguageModel("openai:gpt-4.1-nano")
              : model,
          system:
            selectedModel === "openai:gpt-imagegen"
              ? "You are a helpful assistant that can generate images. You will be given a prompt and you will need to generate an image based on the prompt."
              : searchStrategy === "tool"
              ? "You are a helpful assistant that can answer questions and help with tasks. You can use the webSearch tool to search the web for up-to-date information. Answer based on the sources provided."
              : "You are a helpful assistant that can answer questions and help with tasks.",
          maxSteps: 10,
          messages: allMessages,
          ...(selectedModel === "openai:gpt-imagegen"
            ? {
                tools: {
                  generateImage: createImageGenerationTool(
                    session.user.id,
                    env.OPENAI_API_KEY
                  ),
                },
              }
            : {}),
          ...(searchStrategy === "tool" && {
            tools: {
              webSearch: webSearch,
            },
          }),
          // temperature: 0.6,
          // topP: 0.9,
          providerOptions: {
            ...(modelConfig?.provider === "openai" &&
              !modelConfig.apiProvider &&
              modelConfig.capabilities.reasoning && {
                openai: {
                  reasoningEffort: effort,
                  reasoningSummary: "auto",
                },
              }),
            ...(modelConfig?.provider === "google" &&
              !modelConfig.apiProvider && {
                google: {
                  thinkingConfig: {
                    includeThoughts: true,
                  },
                } satisfies GoogleGenerativeAIProviderOptions,
              }),
            ...(modelConfig?.provider === "anthropic" &&
              !modelConfig.apiProvider &&
              modelConfig.capabilities.reasoning && {
                anthropic: {
                  thinking: {
                    type: "enabled",
                    budgetTokens: EFFORT_MAP_FOR_ANTHROPIC[effort],
                  },
                } satisfies AnthropicProviderOptions,
              }),
          },
          onFinish: async ({ response, sources, files }) => {
            let newMessage = appendResponseMessages({
              messages: allMessages,
              responseMessages: response.messages,
            }).at(-1)!;

            if (searchStrategy === "native") {
              newMessage = {
                ...newMessage,
                parts: [
                  ...(newMessage.parts ?? []),
                  ...sources.map((source) => ({
                    type: "source" as const,
                    source,
                  })),
                ],
              } satisfies UIMessage;
              console.log("newMessage", newMessage);
            }

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
