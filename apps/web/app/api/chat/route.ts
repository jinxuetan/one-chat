import { env } from "@/env";
import { appendStreamId, loadStreams } from "@/lib/actions/stream";
import {
  getLastPendingMessage,
  getMostRecentModel,
  getOrCreateThread,
  loadChat,
  markMessageAsErrored,
  upsertMessage,
} from "@/lib/actions/thread";
import { getLanguageModel } from "@/lib/ai";
import type { ModelOptions } from "@/lib/ai/models";
import { getSystemPrompt } from "@/lib/ai/prompt";
import { auth } from "@/lib/auth/server";
import {
  DEFAULT_CHAT_MODEL,
  FALLBACK_MODEL,
  IMAGE_GENERATION_MODEL,
  MAX_STEPS,
} from "@/lib/constants";
import { OneChatSDKError } from "@/lib/errors";
import { chatRequestSchema } from "@/lib/schema";
import {
  createProviderOptions,
  createStreamAbortController,
  createToolsConfig,
  getStreamingModel,
  stopChatStream,
} from "@/lib/utils/chat";
import {
  type UIMessage,
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  generateId,
  smoothStream,
  streamText,
} from "ai";
import { Redis } from "ioredis";
import { type NextRequest, after } from "next/server";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { ZodError } from "zod";

const redisPublisher = new Redis(env.UPSTASH_REDIS_URL);
const redisSubscriber = new Redis(env.UPSTASH_REDIS_URL);

const resumableStreamContext = createResumableStreamContext({
  waitUntil: after,
  publisher: redisPublisher,
  subscriber: redisSubscriber,
});

export const maxDuration = 150;

const createEmptyDataStream = () =>
  createDataStream({
    execute: () => {},
  });

export const POST = async (request: NextRequest) => {
  try {
    const requestBody = await request.json();

    const {
      message: userMessage,
      id: threadId,
      forceOpenRouter,
      selectedModel,
      reasoningEffort,
      searchStrategy,
      userApiKeys,
    } = chatRequestSchema.parse(requestBody);

    const userSession = await auth.api.getSession({ headers: request.headers });
    if (!userSession) {
      throw new OneChatSDKError("unauthorized:chat");
    }

    const streamId = generateId();

    await getOrCreateThread({
      id: threadId,
      userId: userSession.user.id,
    });

    const model =
      selectedModel ||
      (await getMostRecentModel(threadId)) ||
      DEFAULT_CHAT_MODEL;

    await Promise.all([
      upsertMessage({
        threadId,
        id: userMessage.id,
        message: userMessage,
        attachments: userMessage.experimental_attachments,
        model,
      }),
      appendStreamId({ chatId: threadId, streamId }),
    ]);

    const previousMessages = await loadChat(threadId);
    const conversationMessages = appendClientMessage({
      messages: previousMessages.map(
        (messageItem) =>
          ({
            ...messageItem,
            content: "",
          }) as UIMessage
      ),
      message: userMessage,
    });
    const options: ModelOptions = {
      search: searchStrategy === "native",
      effort: reasoningEffort,
      forceOpenRouter,
      apiKeys: {
        openai: userApiKeys?.openai,
        anthropic: userApiKeys?.anthropic,
        google: userApiKeys?.google,
        openrouter: userApiKeys?.openrouter,
      },
    };

    const { model: primaryModel, config: modelConfig } = getLanguageModel(
      model,
      options
    );

    const { model: fallbackModel } = getLanguageModel(FALLBACK_MODEL, {
      // TODO: Remove this once we have a better way to handle this
      apiKeys: { openai: userApiKeys?.openai || "sk-proj-1234567890" },
    });

    let hasFirstChunk = false;

    const dataStream = createDataStream({
      execute: (dataStreamWriter) => {
        const { abortController, cleanup } =
          createStreamAbortController(streamId);

        dataStreamWriter.writeMessageAnnotation({
          type: "model",
          model: model,
        });

        const streamingModel = getStreamingModel(
          model,
          primaryModel,
          fallbackModel
        );

        const toolsConfig = createToolsConfig(
          model,
          searchStrategy,
          userSession.user.id,
          { openai: userApiKeys?.openai }
        );

        const providerOptions = createProviderOptions(
          modelConfig,
          reasoningEffort
        );

        const result = streamText({
          model: streamingModel,
          system: getSystemPrompt({
            selectedModel: modelConfig?.name || model,
            searchStrategy,
            isImageGeneration: selectedModel === IMAGE_GENERATION_MODEL,
          }),
          maxSteps: MAX_STEPS,
          messages: conversationMessages,
          ...toolsConfig,
          providerOptions,
          temperature: 0.6,
          topP: 0.9,
          abortSignal: abortController.signal,
          experimental_transform: smoothStream(),
          onChunk: () => {
            if (!hasFirstChunk) {
              dataStreamWriter.writeData({
                type: "first-chunk",
              });
              hasFirstChunk = true;
            }
          },
          onFinish: async ({ response, sources }) => {
            let assistantMessage = appendResponseMessages({
              messages: conversationMessages,
              responseMessages: response.messages,
            }).at(-1)!;

            if (searchStrategy === "native") {
              assistantMessage = {
                ...assistantMessage,
                parts: [
                  ...(assistantMessage.parts ?? []),
                  ...sources.map((sourceItem) => ({
                    type: "source" as const,
                    source: sourceItem,
                  })),
                ],
              } satisfies UIMessage;
            }

            // Idk, i'll just leave this here for now. Maybe we'll need it later.
            console.log("YES");

            await upsertMessage({
              id: assistantMessage.id,
              threadId,
              message: assistantMessage as UIMessage,
              model,
              status: "done",
            });
            cleanup();
          },
          onError: async (err) => {
            const error = err.error as Error;
            const isAborted = error.name === "AbortError";

            if (!isAborted) {
              console.error("Error in streamText:", error);

              // Find the current streaming message and mark it as errored
              const currentMessage = await getLastPendingMessage(threadId);
              if (currentMessage) {
                await markMessageAsErrored({
                  messageId: currentMessage.id,
                  threadId,
                  errorMessage: error.message || "An unknown error occurred",
                });
              }
            }
            cleanup();
          },
        });

        result.mergeIntoDataStream(dataStreamWriter, {
          sendReasoning: true,
          sendSources: true,
        });
      },
    });

    if (dataStream)
      return new Response(
        await resumableStreamContext.resumableStream(streamId, () => dataStream)
      );
  } catch (error) {
    console.error("Error in /api/chat:", error);

    if (error instanceof OneChatSDKError) {
      return error.toResponse();
    }

    const unknownError = new OneChatSDKError("internal_server_error:api");
    return unknownError.toResponse();
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      throw new OneChatSDKError("bad_request:api", "Chat ID is required");
    }

    const activeStreamIds = await loadStreams(chatId);

    if (!activeStreamIds.length) {
      return new Response(createEmptyDataStream(), { status: 200 });
    }

    const latestStreamId = activeStreamIds[0];
    if (!latestStreamId) {
      return new Response(createEmptyDataStream(), { status: 200 });
    }

    const fallbackStream = createEmptyDataStream();
    const resumedStream = await resumableStreamContext.resumableStream(
      latestStreamId,
      () => fallbackStream
    );

    if (resumedStream) {
      return new Response(resumedStream, { status: 200 });
    }

    const chatHistory = await loadChat(chatId);
    const lastMessage = chatHistory.at(-1);

    if (!lastMessage || lastMessage.role !== "assistant") {
      return new Response(createEmptyDataStream(), { status: 200 });
    }

    const completedStream = createDataStream({
      execute: (dataStreamWriter) => {
        dataStreamWriter.writeData({
          type: "append-message",
          message: JSON.stringify(lastMessage),
        });

        dataStreamWriter.writeMessageAnnotation({
          model: lastMessage.model || "unknown",
          status: "completed",
        });
      },
    });

    return new Response(completedStream, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/chat:", error);

    if (error instanceof OneChatSDKError) {
      return error.toResponse();
    }

    if (error instanceof ZodError) {
      const validationError = new OneChatSDKError(
        "bad_request:api",
        `Invalid request parameters: ${error.issues
          .map((issue) => `${issue.path.join(".")} ${issue.message}`)
          .join(", ")}`
      );
      return validationError.toResponse();
    }

    const unknownError = new OneChatSDKError("internal_server_error:api");
    return unknownError.toResponse();
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      throw new OneChatSDKError("bad_request:api", "Chat ID is required");
    }

    const userSession = await auth.api.getSession({ headers: request.headers });
    if (!userSession) {
      throw new OneChatSDKError("unauthorized:chat");
    }

    await stopChatStream(chatId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error in DELETE /api/chat:", error);

    if (error instanceof OneChatSDKError) {
      return error.toResponse();
    }

    const unknownError = new OneChatSDKError("internal_server_error:api");
    return unknownError.toResponse();
  }
};
