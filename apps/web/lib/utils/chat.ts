import { env } from "@/env";
import { createImageGenerationTool } from "@/lib/actions/image";
import { loadStreams } from "@/lib/actions/stream";
import { webSearch } from "@/lib/actions/web-search";
import type { Model, ModelConfig } from "@/lib/ai";
import { EFFORT_PERCENTAGE_MAP, IMAGE_GENERATION_MODEL } from "@/lib/constants";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenRouterLanguageModel } from "@openrouter/ai-sdk-provider";
import type { LanguageModelV1 } from "ai";
import { Redis } from "ioredis";

/**
 * Creates provider-specific options for AI models
 */
export const createProviderOptions = (
  modelConfig: ModelConfig | null,
  reasoningEffort: "low" | "medium" | "high"
): Record<string, any> => ({
  ...(modelConfig?.provider === "openai" &&
    !modelConfig.apiProvider &&
    modelConfig.capabilities.reasoning && {
      openai: {
        reasoningEffort,
        reasoningSummary: "auto" as const,
      },
    }),
  ...(modelConfig?.provider === "google" &&
    !modelConfig.apiProvider &&
    modelConfig.capabilities.reasoning && {
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
          type: "enabled" as const,
          budgetTokens: Math.floor(
            modelConfig.maxTokens * EFFORT_PERCENTAGE_MAP[reasoningEffort]
          ),
        },
      } satisfies AnthropicProviderOptions,
    }),
});

/**
 * Determines the appropriate model for streaming based on selected model type
 */
export const getStreamingModel = (
  selectedModel: Model,
  selectedLanguageModel: LanguageModelV1 | OpenRouterLanguageModel,
  baseLanguageModel: LanguageModelV1 | OpenRouterLanguageModel
): LanguageModelV1 | OpenRouterLanguageModel => {
  return selectedModel === IMAGE_GENERATION_MODEL
    ? baseLanguageModel
    : selectedLanguageModel;
};

/**
 * Creates tools configuration based on selected model and search strategy
 */
export const createToolsConfig = (
  selectedModel: Model,
  searchStrategy: "off" | "native" | "tool",
  userId: string,
  apiKeys?: { openai?: string }
): { tools?: Record<string, any> } => {
  const tools: Record<string, any> = {};

  if (selectedModel === IMAGE_GENERATION_MODEL) {
    tools.generateImage = createImageGenerationTool(
      userId,
      apiKeys?.openai || env.OPENAI_API_KEY
    );
  }

  if (searchStrategy === "tool") {
    tools.webSearch = webSearch;
  }

  return Object.keys(tools).length > 0 ? { tools } : {};
};

/**
 * Stops an active chat stream efficiently by handling message state properly:
 * - If last message is assistant: mark it as stopped
 * - If last message is user: create new empty stopped assistant message
 */
export const stopChatStream = async (chatId: string): Promise<void> => {
  const activeStreamIds = await loadStreams(chatId);

  if (activeStreamIds.length === 0) {
    return;
  }

  const latestStreamId = activeStreamIds[0];
  if (!latestStreamId) {
    return;
  }

  // Publish abort signal to Redis
  const redisPublisher = new Redis(env.UPSTASH_REDIS_URL);
  try {
    const cancellationChannel = `stop-stream:${latestStreamId}`;
    await redisPublisher.publish(cancellationChannel, "abort");
  } finally {
    await redisPublisher.quit();
  }
};

/**
 * Creates an abort controller with Redis subscription for stream cancellation
 */
export const createStreamAbortController = (
  streamId: string
): {
  abortController: AbortController;
  cleanup: () => void;
} => {
  const abortController = new AbortController();
  const cancellationChannel = `stop-stream:${streamId}`;
  const redisSub = new Redis(env.UPSTASH_REDIS_URL);

  const cleanup = () => {
    redisSub.unsubscribe(cancellationChannel).catch(console.error);
    redisSub.quit().catch(console.error);
  };

  redisSub.subscribe(cancellationChannel, (err) => {
    if (err) {
      console.error(
        `Failed to subscribe to cancellation channel ${cancellationChannel}`,
        err
      );
      return;
    }
  });

  redisSub.on("message", (channel, message) => {
    if (channel === cancellationChannel && message === "abort") {
      abortController.abort();
      cleanup();
    }
  });

  return { abortController, cleanup };
};
