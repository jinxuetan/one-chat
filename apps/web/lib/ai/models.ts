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

export const getLanguageModel = (
  modelKey: Model
): LanguageModelV1 | OpenRouterLanguageModel => {
  const modelConfig = getModelByKey(modelKey);
  if (!modelConfig) {
    throw new Error(`Model ${modelKey} not found`);
  }

  switch (modelConfig.provider) {
    case "openai": {
      const openAIProvider = createOpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      return openAIProvider(modelConfig.id);
    }
    case "anthropic": {
      const anthropicProvider = createAnthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
      return anthropicProvider(modelConfig.id);
    }
    case "google": {
      const googleProvider = createGoogleGenerativeAI({
        apiKey: env.GOOGLE_AI_API_KEY,
      });
      return googleProvider(modelConfig.id);
    }
    case "openrouter": {
      const openRouterProvider = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });
      return openRouterProvider(modelConfig.id);
    }
    default:
      throw new Error(`Provider ${modelConfig.provider} not supported`);
  }
};

export const getModelsByProvider = (provider: Provider): ModelConfig[] =>
  Object.values(AVAILABLE_MODELS).filter(
    (model) => model.provider === provider
  );

export const getRecommendedModels = (): ModelConfig[] => {
  const recommendedModels: Model[] = [
    "google:gemini-2.5-flash",
    "google:gemini-2.5-pro",
    "openai:gpt-imagegen",
    "openai:o4-mini",
    "anthropic:claude-4-sonnet",
    "anthropic:claude-4-sonnet-reasoning",
    "deepseek:deepseek-r1-llama-distilled",
  ];
  return recommendedModels.map((model) => AVAILABLE_MODELS[model]);
};

// Capability-based filtering functions

export const getModelsByCapability = (
  capability: keyof ModelConfig["capabilities"]
): ModelConfig[] =>
  Object.values(AVAILABLE_MODELS).filter(
    (model) => model.capabilities[capability]
  );

export const getModelsByTier = (tier: ModelConfig["tier"]): ModelConfig[] =>
  Object.values(AVAILABLE_MODELS).filter((model) => model.tier === tier);

export const getModelsByPerformance = (
  speed?: ModelConfig["performance"]["speed"],
  quality?: ModelConfig["performance"]["quality"]
): ModelConfig[] =>
  Object.values(AVAILABLE_MODELS).filter((model) => {
    if (speed && model.performance.speed !== speed) return false;
    if (quality && model.performance.quality !== quality) return false;
    return true;
  });

// Utility functions for model management

export const calculateTokenCost = (
  modelKey: Model,
  inputTokens: number,
  outputTokens: number
): number | null => {
  const model = getModelByKey(modelKey);
  if (!model?.pricing) return null;

  const inputCost = (inputTokens / 1000) * model.pricing.input;
  const outputCost = (outputTokens / 1000) * model.pricing.output;

  return inputCost + outputCost;
};

export const isModelAvailable = (modelKey: Model): boolean =>
  modelKey in AVAILABLE_MODELS;

export const getProviderStatus = (provider: Provider): boolean => {
  // This could be extended to check API health/status
  const requiredEnvVars = {
    openai: env.OPENAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    google: env.GOOGLE_AI_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
    meta: env.META_API_KEY,
    deepseek: env.DEEPSEEK_API_KEY,
    xai: env.XAI_API_KEY,
  };

  return Boolean(requiredEnvVars[provider]);
};

export const getCapabilitySummary = (modelKey: Model): string[] => {
  const model = getModelByKey(modelKey);
  if (!model) return [];

  const capabilities: string[] = [];
  const caps = model.capabilities;

  if (caps.streaming) capabilities.push("Streaming");
  if (caps.vision) capabilities.push("Vision");
  if (caps.tools) capabilities.push("Tools");
  if (caps.search) capabilities.push("Web Search");
  if (caps.pdf) capabilities.push("PDF Processing");
  if (caps.reasoning) capabilities.push("Advanced Reasoning");
  if (caps.coding) capabilities.push("Code Generation");
  if (caps.multimodal) capabilities.push("Multimodal");

  return capabilities;
};
