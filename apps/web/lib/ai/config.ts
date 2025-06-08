export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "xai"
  | "deepseek"
  | "meta";

export type Model =
  | "meta:llama-4-scout"
  | "meta:llama-4-maverick"
  | "meta:llama-3.3-70b"
  | "deepseek:deepseek-v3-fireworks"
  | "deepseek:deepseek-v3-0324"
  | "deepseek:deepseek-r1-openrouter"
  | "deepseek:deepseek-r1-0528"
  | "deepseek:deepseek-r1-qwen-distilled"
  | "deepseek:deepseek-r1-llama-distilled"
  | "xai:grok-3"
  | "xai:grok-3-mini"
  | "openrouter:qwen-qwq-32b"
  | "openrouter:qwen-2.5-32b"
  | "openai:gpt-4.5"
  | "openai:o4-mini"
  | "openai:gpt-4o"
  | "openai:gpt-4o-mini"
  | "openai:gpt-4.1"
  | "openai:gpt-4.1-mini"
  | "openai:gpt-4.1-nano"
  | "openai:o3"
  | "openai:o3-mini"
  | "openai:gpt-imagegen"
  | "anthropic:claude-4-sonnet"
  | "anthropic:claude-4-sonnet-reasoning"
  | "anthropic:claude-4-opus"
  | "anthropic:claude-3.5-sonnet"
  | "anthropic:claude-3.7-sonnet"
  | "anthropic:claude-3.7-sonnet-reasoning"
  | "google:gemini-2.5-flash"
  | "google:gemini-2.5-pro"
  | "google:gemini-2.5-flash-thinking"
  | "google:gemini-2.0-flash"
  | "google:gemini-2.0-flash-lite";

export type Effort = "low" | "medium" | "high";

export type ExtractModelName<T extends string> =
  T extends `${string}:${infer Name}` ? Name : never;

export type ModelConfig = {
  id: ExtractModelName<Model>;
  name: string;
  provider: Provider;
  description: string;
  maxTokens: number;
  contextWindow: number;
  enabled: boolean;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    tools: boolean;
    search: boolean;
    pdf: boolean;
    reasoning: boolean;
    coding: boolean;
    multimodal: boolean;
    effort: boolean;
  };
  pricing?: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
  performance: {
    speed: "fast" | "medium" | "slow";
    quality: "high" | "medium" | "low";
  };
  tier: "premium" | "standard" | "budget";
};

export type UserModelPreferences = {
  defaultModel: Model;
  favoriteModels: Model[];
  modelSettings: Record<
    Model,
    {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  >;
};

export type ModelFilters = {
  provider?: Provider[];
  capabilities?: {
    vision?: boolean;
    tools?: boolean;
    search?: boolean;
    pdf?: boolean;
    reasoning?: boolean;
    coding?: boolean;
    multimodal?: boolean;
  };
  maxPricing?: {
    input: number;
    output: number;
  };
  minContextWindow?: number;
  tier?: ("premium" | "standard" | "budget")[];
  performance?: {
    speed?: ("fast" | "medium" | "slow")[];
    quality?: ("high" | "medium" | "low")[];
  };
};

export const AVAILABLE_MODELS: Record<Model, ModelConfig> = {
  "meta:llama-4-scout": {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    provider: "meta",
    description: "17B active parameters, 16 experts, 10M token context",
    maxTokens: 100000,
    contextWindow: 10000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.19, output: 0.49 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "meta:llama-4-maverick": {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "meta",
    description: "17B active parameters, 128 experts, 1M token context",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.19, output: 0.49 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "meta:llama-3.3-70b": {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "meta",
    description: "Large language model with 70B parameters",
    maxTokens: 100000,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.5, output: 0.8 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "deepseek:deepseek-v3-fireworks": {
    id: "deepseek-v3-fireworks",
    name: "DeepSeek v3 (Fireworks)",
    provider: "deepseek",
    description: "DeepSeek Chat V3 via Fireworks provider",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.07, output: 1.1 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "deepseek:deepseek-v3-0324": {
    id: "deepseek-v3-0324",
    name: "DeepSeek v3 (0324)",
    provider: "deepseek",
    description: "DeepSeek Chat V3 March 2024 version",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.07, output: 1.1 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "deepseek:deepseek-r1-openrouter": {
    id: "deepseek-r1-openrouter",
    name: "DeepSeek R1 (OpenRouter)",
    provider: "deepseek",
    description: "DeepSeek Reasoner R1 via OpenRouter",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.14, output: 2.19 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "deepseek:deepseek-r1-0528": {
    id: "deepseek-r1-0528",
    name: "DeepSeek R1 (0528)",
    provider: "deepseek",
    description: "DeepSeek Reasoner R1 May 2024 version",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.14, output: 2.19 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "deepseek:deepseek-r1-qwen-distilled": {
    id: "deepseek-r1-qwen-distilled",
    name: "DeepSeek R1 (Qwen Distilled)",
    provider: "deepseek",
    description: "DeepSeek R1 distilled by Qwen team",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.14, output: 2.19 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "deepseek:deepseek-r1-llama-distilled": {
    id: "deepseek-r1-llama-distilled",
    name: "DeepSeek R1 (Llama Distilled)",
    provider: "deepseek",
    description: "DeepSeek R1 distilled for Llama compatibility",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.14, output: 2.19 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "xai:grok-3": {
    id: "grok-3",
    name: "Grok 3",
    provider: "xai",
    description: "Latest Grok model with 131K context window",
    maxTokens: 100000,
    contextWindow: 131072,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "xai:grok-3-mini": {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    provider: "xai",
    description: "Efficient version of Grok 3 with lower cost",
    maxTokens: 100000,
    contextWindow: 131072,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.3, output: 0.5 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "openrouter:qwen-qwq-32b": {
    id: "qwen-qwq-32b",
    name: "Qwen QWQ-32B",
    provider: "openrouter",
    description: "Qwen QWQ model with 32B parameters",
    maxTokens: 100000,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.4, output: 0.8 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "openrouter:qwen-2.5-32b": {
    id: "qwen-2.5-32b",
    name: "Qwen 2.5 32B",
    provider: "openrouter",
    description: "Qwen 2.5 model with 32B parameters",
    maxTokens: 100000,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.4, output: 0.8 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "openai:gpt-4.5": {
    id: "gpt-4.5",
    name: "GPT-4.5",
    provider: "openai",
    description:
      "Advanced model with enhanced reasoning and multimodal capabilities",
    maxTokens: 100000,
    contextWindow: 256000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 5, output: 20 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "openai:o4-mini": {
    id: "o4-mini",
    name: "o4 mini",
    provider: "openai",
    description: "Next-generation reasoning model with enhanced capabilities",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: true,
    },
    pricing: { input: 1.1, output: 4.4 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "openai:gpt-4o": {
    id: "gpt-4o",
    name: "GPT 4o",
    provider: "openai",
    description: "Multimodal GPT-4 with vision and audio capabilities",
    maxTokens: 16384,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 2.5, output: 10 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "openai:gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT 4o-mini",
    provider: "openai",
    description: "Efficient version of GPT-4o with lower cost",
    maxTokens: 16384,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.15, output: 0.6 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "openai:gpt-4.1": {
    id: "gpt-4.1",
    name: "GPT 4.1",
    provider: "openai",
    description: "Latest GPT model with 1M token context window",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 2, output: 8 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "openai:gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    name: "GPT 4.1 Mini",
    provider: "openai",
    description: "Efficient version of GPT-4.1 with balanced performance",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.4, output: 1.6 },
    performance: { speed: "fast", quality: "high" },
    tier: "standard",
  },
  "openai:gpt-4.1-nano": {
    id: "gpt-4.1-nano",
    name: "GPT 4.1 Nano",
    provider: "openai",
    description: "Ultra-fast, cost-effective model for high-volume tasks",
    maxTokens: 50000,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: false,
      reasoning: false,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 0.1, output: 0.4 },
    performance: { speed: "fast", quality: "medium" },
    tier: "budget",
  },
  "openai:o3": {
    id: "o3",
    name: "o3",
    provider: "openai",
    description: "Most capable reasoning model for complex tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 10, output: 40 },
    performance: { speed: "slow", quality: "high" },
    tier: "premium",
  },
  "openai:o3-mini": {
    id: "o3-mini",
    name: "o3 mini",
    provider: "openai",
    description: "Efficient reasoning model at o1-mini cost and latency",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: false,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: false,
      effort: false,
    },
    pricing: { input: 1.1, output: 4.4 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "openai:gpt-imagegen": {
    id: "gpt-imagegen",
    name: "GPT ImageGen",
    provider: "openai",
    description: "Specialized model for image generation tasks",
    maxTokens: 4096,
    contextWindow: 8000,
    enabled: true,
    capabilities: {
      streaming: false,
      vision: true,
      tools: false,
      search: false,
      pdf: false,
      reasoning: false,
      coding: false,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 1, output: 2 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "google:gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast, efficient Gemini model with multimodal capabilities",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.15, output: 0.6 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "google:gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Advanced Gemini model with enhanced reasoning",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: true,
    },
    pricing: { input: 1.25, output: 10 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "google:gemini-2.5-flash-thinking": {
    id: "gemini-2.5-flash-thinking",
    name: "Gemini 2.5 Flash (Thinking)",
    provider: "google",
    description: "Gemini 2.5 Flash with thinking mode enabled",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.15, output: 3.5 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "google:gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Next-generation fast Gemini model",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.1, output: 0.4 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "google:gemini-2.0-flash-lite": {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    description: "Lightweight version of Gemini 2.0 Flash",
    maxTokens: 50000,
    contextWindow: 500000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: false,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 0.05, output: 0.2 },
    performance: { speed: "fast", quality: "medium" },
    tier: "budget",
  },
  "anthropic:claude-4-sonnet": {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    description: "Latest Claude model with enhanced capabilities",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-4-sonnet-reasoning": {
    id: "claude-4-sonnet-reasoning",
    name: "Claude 4 Sonnet (Reasoning)",
    provider: "anthropic",
    description: "Claude 4 Sonnet optimized for reasoning tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: true,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "slow", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-4-opus": {
    id: "claude-4-opus",
    name: "Claude 4 Opus",
    provider: "anthropic",
    description: "Most capable Claude model for complex tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 15, output: 75 },
    performance: { speed: "slow", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Balanced Claude model with good performance",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "anthropic:claude-3.7-sonnet": {
    id: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    description: "Enhanced Claude 3.5 with improved capabilities",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: true,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-3.7-sonnet-reasoning": {
    id: "claude-3.7-sonnet-reasoning",
    name: "Claude 3.7 Sonnet (Reasoning)",
    provider: "anthropic",
    description: "Claude 3.7 Sonnet optimized for reasoning tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      streaming: true,
      vision: true,
      tools: true,
      search: false,
      pdf: true,
      reasoning: true,
      coding: true,
      multimodal: true,
      effort: false,
    },
    pricing: { input: 3, output: 15 },
    performance: { speed: "slow", quality: "high" },
    tier: "premium",
  },
};

// Default model configuration
export const DEFAULT_MODEL: Model = "openai:gpt-4.1-mini";
export const DEFAULT_MODEL_CONFIG: ModelConfig =
  AVAILABLE_MODELS[DEFAULT_MODEL];

export type AvailableModel = (typeof AVAILABLE_MODELS)[Model];
