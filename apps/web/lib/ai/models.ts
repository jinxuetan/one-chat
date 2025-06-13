import { env } from "@/env";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  type LanguageModelV1,
  type OpenRouterLanguageModel,
  createOpenRouter,
} from "@openrouter/ai-sdk-provider";
import {
  AVAILABLE_MODELS,
  type Model,
  type ModelConfig,
  type ModelFilters,
  type Provider,
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
  enableSearch?: boolean;
  effort?: "low" | "medium" | "high";
  onlyOpenRouter?: boolean;
}

export const getLanguageModel = (
  modelKey: Model,
  options: ModelOptions = {
    enableSearch: false,
    effort: "medium",
    onlyOpenRouter: false,
  }
): LanguageModelV1 | OpenRouterLanguageModel => {
  const modelConfig = getModelByKey(modelKey);
  if (!modelConfig) throw new Error(`Model ${modelKey} not found`);
  const providerKey = options.onlyOpenRouter
    ? "openrouter"
    : modelConfig.apiProvider || modelConfig.provider;

  switch (providerKey) {
    case "openai": {
      const openAIProvider = createOpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      if (modelConfig.capabilities.reasoning) {
        return openAIProvider.responses(modelConfig.id);
      }
      return openAIProvider(modelConfig.id);
    }
    case "anthropic": {
      const anthropicProvider = createAnthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
      return anthropicProvider(modelConfig.id.replace("-reasoning", ""));
    }
    case "google": {
      const googleProvider = createGoogleGenerativeAI({
        apiKey: env.GOOGLE_AI_API_KEY,
      });
      return googleProvider(modelConfig.id, {
        useSearchGrounding: options.enableSearch,
      });
    }
    case "openrouter": {
      const openRouterProvider = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });
      const effort = modelConfig.capabilities.effort && options.effort;
      return openRouterProvider(
        modelConfig.id,
        effort ? { reasoning: { effort } } : undefined
      );
    }
    default:
      throw new Error(`Provider ${modelConfig.provider} not supported`);
  }
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
