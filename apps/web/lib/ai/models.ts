import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  type LanguageModelV1,
  type OpenRouterLanguageModel,
  createOpenRouter,
} from "@openrouter/ai-sdk-provider";
import { OneChatSDKError } from "../errors";
import { getOpenRouterModel } from "../utils";
import {
  AVAILABLE_MODELS,
  type Model,
  type ModelConfig,
  type ModelFilters,
  type Provider,
  DEFAULT_MODEL,
  DEFAULT_MODEL_PRIORITY,
} from "./config";

// Core Functions

export const getAvailableModels = (filters?: ModelFilters): ModelConfig[] => {
  const models = Object.values(AVAILABLE_MODELS);

  if (!filters) return models;

  return models.filter((model) => {
    // Provider filter
    if (filters.provider && !filters.provider.includes(model.provider)) {
      return false;
    }

    // Capabilities filters - simplified using Object.entries
    if (filters.capabilities) {
      const capabilityMatches = Object.entries(filters.capabilities).every(
        ([key, expectedValue]) => {
          if (expectedValue === undefined) return true;
          return (
            model.capabilities[key as keyof typeof model.capabilities] ===
            expectedValue
          );
        }
      );
      if (!capabilityMatches) return false;
    }

    // Pricing filter
    if (
      filters.maxPricing &&
      model.pricing &&
      (model.pricing.input > filters.maxPricing.input ||
        model.pricing.output > filters.maxPricing.output)
    ) {
      return false;
    }

    // Context window filter
    if (
      filters.minContextWindow &&
      model.contextWindow < filters.minContextWindow
    ) {
      return false;
    }

    // Tier filter
    if (filters.tier && !filters.tier.includes(model.tier)) {
      return false;
    }

    // Performance filters - simplified using Object.entries
    if (filters.performance) {
      const performanceMatches = Object.entries(filters.performance).every(
        ([key, allowedValues]) => {
          if (!allowedValues) return true;
          const performanceKey = key as keyof typeof model.performance;
          return (allowedValues as string[]).includes(
            model.performance[performanceKey]
          );
        }
      );
      if (!performanceMatches) return false;
    }

    return true;
  });
};

export const getModelByKey = (modelKey: Model): ModelConfig | null =>
  AVAILABLE_MODELS[modelKey] || null;

export interface ModelOptions {
  search?: boolean;
  effort?: "low" | "medium" | "high";
  forceOpenRouter?: boolean;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
    openrouter?: string;
  };
}

export const getLanguageModel = (
  modelKey: Model,
  options: ModelOptions
): {
  model: LanguageModelV1 | OpenRouterLanguageModel;
  config: ModelConfig;
} => {
  const modelConfig = getModelByKey(modelKey);

  if (!modelConfig) {
    throw new OneChatSDKError(
      "model_not_found:models",
      `Model "${modelKey}" is not available or supported`
    );
  }

  const provider: Provider = options.forceOpenRouter
    ? "openrouter"
    : modelConfig.apiProvider || modelConfig.provider;

  const clients = {
    openai: () => {
      if (!options.apiKeys.openai) {
        throw new OneChatSDKError(
          "api_key_missing:models",
          "OpenAI API key is required to use this model"
        );
      }
      const client = createOpenAI({ apiKey: options.apiKeys.openai });
      return modelConfig.capabilities.reasoning
        ? client.responses(modelConfig.id)
        : client(modelConfig.id);
    },

    anthropic: () => {
      if (!options.apiKeys.anthropic) {
        throw new OneChatSDKError(
          "api_key_missing:models",
          "Anthropic API key is required to use this model"
        );
      }
      const client = createAnthropic({ apiKey: options.apiKeys.anthropic });
      const modelId = modelConfig.id.replace("-reasoning", "");
      return client(modelId);
    },

    google: () => {
      if (!options.apiKeys.google) {
        throw new OneChatSDKError(
          "api_key_missing:models",
          "Google AI API key is required to use this model"
        );
      }
      const client = createGoogleGenerativeAI({
        apiKey: options.apiKeys.google,
      });
      const modelId = modelConfig.id.replace("-thinking", "");
      return client(modelId, {
        useSearchGrounding: options.search,
      });
    },

    openrouter: () => {
      if (!options.apiKeys.openrouter) {
        throw new OneChatSDKError(
          "api_key_missing:models",
          "OpenRouter API key is required to use this model"
        );
      }
      const client = createOpenRouter({ apiKey: options.apiKeys.openrouter });
      const modelId = getOpenRouterModel(modelConfig);
      return client(modelId, {
        reasoning: modelConfig.capabilities.reasoning
          ? { effort: options.effort || "medium" }
          : undefined,
      });
    },
  };

  const clientFactory = clients[provider as keyof typeof clients];
  if (!clientFactory) {
    throw new OneChatSDKError(
      "model_not_found:models",
      `Provider "${provider}" is not supported or configured`
    );
  }

  return {
    model: clientFactory(),
    config: modelConfig,
  };
};

export const getRecommendedModels = (): ModelConfig[] => {
  const recommendedModels: Model[] = [
    "google:gemini-2.5-flash-preview-05-20",
    "google:gemini-2.5-pro-preview-06-05",
    "openai:gpt-imagegen",
    "openai:o4-mini",
    "anthropic:claude-sonnet-4-0",
    "anthropic:claude-3-7-sonnet-latest",
    "openrouter:deepseek/deepseek-r1-0528:free",
  ];
  return recommendedModels.map((model) => AVAILABLE_MODELS[model]);
};

export const getModelsByCapability = (
  capability: keyof ModelConfig["capabilities"]
): ModelConfig[] =>
  Object.values(AVAILABLE_MODELS).filter(
    (model) => model.capabilities[capability]
  );

/**
 * Get the best available default model based on API keys
 * Falls back through priority list until finding an available model
 */
export const getBestAvailableDefaultModel = (keys: {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}): Model => {
  // Helper function to check if model can be used
  const canUseModel = (modelKey: string): boolean => {
    // If user has OpenRouter, they can use any model
    if (keys.openrouter) return true;

    // Check specific provider requirements
    if (modelKey.startsWith("openai:")) return Boolean(keys.openai);
    if (modelKey.startsWith("anthropic:")) return Boolean(keys.anthropic);
    if (modelKey.startsWith("google:")) return Boolean(keys.google);
    if (modelKey.startsWith("openrouter:")) return Boolean(keys.openrouter);
    
    return false;
  };

  // Find first available model from priority list
  for (const model of DEFAULT_MODEL_PRIORITY) {
    if (canUseModel(model)) {
      return model;
    }
  }

  // Ultimate fallback to the static default (should not happen in normal usage)
  return DEFAULT_MODEL;
};

/**
 * Get the default model configuration for a user based on their API keys
 */
export const getDefaultModelConfig = (keys: {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}): ModelConfig => {
  const model = getBestAvailableDefaultModel(keys);
  return AVAILABLE_MODELS[model];
};
