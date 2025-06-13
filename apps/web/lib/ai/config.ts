export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "deepseek"
  | "meta";

export type Model =
  | "openrouter:meta-llama/llama-4-scout:free"
  | "openrouter:meta-llama/llama-4-maverick:free"
  | "openrouter:deepseek/deepseek-r1-0528:free"
  | "openrouter:qwen/qwen3-30b-a3b:free"
  | "openai:o4-mini"
  | "openai:gpt-4o"
  | "openai:gpt-4o-mini"
  | "openai:gpt-4.1"
  | "openai:gpt-4.1-mini"
  | "openai:gpt-4.1-nano"
  | "openai:o3"
  | "openai:o3-mini"
  | "openai:gpt-imagegen"
  | "anthropic:claude-sonnet-4-0"
  | "anthropic:claude-sonnet-4-0-reasoning"
  | "anthropic:claude-3-7-sonnet-latest"
  | "anthropic:claude-3-7-sonnet-latest-reasoning"
  | "google:gemini-2.5-pro-preview-06-05"
  | "google:gemini-2.5-flash-preview-05-20"
  | "google:gemini-2.0-flash"
  | "google:gemini-2.0-flash-lite";

export type Effort = "low" | "medium" | "high";

export type ExtractModelName<T extends string> =
  T extends `${string}:${infer Name}` ? Name : never;

export type ModelConfig = {
  id: ExtractModelName<Model>;
  name: string;
  provider: Provider;
  apiProvider?: Provider;
  description: string;
  maxTokens: number;
  contextWindow: number;
  enabled: boolean;
  capabilities: {
    tools: true,
    vision: boolean;
    nativeSearch: boolean;
    pdf: boolean;
    reasoning: boolean;
    tools: boolean;
    effort: boolean;
    image: boolean;
  };
  supportedFileTypes: string[];
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
      effort: false;
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

export const SUPPORTS_IMAGE_TYPES = ["png", "jpeg", "gif", "webp", "heic"];
export const SUPPORTS_PDF_TYPES = ["pdf"];
export const SUPPORTS_TEXT_TYPES = ["txt"];

export const AVAILABLE_MODELS: Record<Model, ModelConfig> = {
  "openrouter:meta-llama/llama-4-scout:free": {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout",
    provider: "meta",
    apiProvider: "openrouter",
    description: "17B active parameters, 16 experts, 10M token context",
    maxTokens: 100000,
    contextWindow: 10000000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: false,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
    pricing: { input: 0.19, output: 0.49 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "openrouter:meta-llama/llama-4-maverick:free": {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    provider: "meta",
    apiProvider: "openrouter",
    description: "17B active parameters, 128 experts, 1M token context",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: false,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
    pricing: { input: 0.19, output: 0.49 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "openrouter:deepseek/deepseek-r1-0528:free": {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1",
    provider: "deepseek",
    apiProvider: "openrouter",
    description: "DeepSeek Reasoner R1 May 2024 version",
    maxTokens: 100000,
    contextWindow: 64000,
    enabled: true,
    capabilities: {
      tools: false,
      vision: false,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES],
    pricing: { input: 0.14, output: 2.19 },
    performance: { speed: "slow", quality: "high" },
    tier: "standard",
  },
  "openrouter:qwen/qwen3-30b-a3b:free": {
    id: "qwen/qwen3-30b-a3b:free",
    name: "Qwen 3 30B",
    provider: "openrouter",
    apiProvider: "openrouter",
    description: "Qwen 3.3 model with 30B parameters",
    maxTokens: 100000,
    contextWindow: 128000,
    enabled: true,
    capabilities: {
      tools: false,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
    pricing: { input: 0.4, output: 0.8 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: false,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: false,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: false,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
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
      tools: true,
      vision: false,
      nativeSearch: false,
      pdf: false,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: false,
      reasoning: false,
      effort: false,
      image: true,
    },
    supportedFileTypes: [...SUPPORTS_TEXT_TYPES, ...SUPPORTS_IMAGE_TYPES],
    pricing: { input: 1, output: 2 },
    performance: { speed: "medium", quality: "high" },
    tier: "standard",
  },
  "google:gemini-2.5-flash-preview-05-20": {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast, efficient Gemini model with multimodal capabilities",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: true,
      pdf: true,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 0.15, output: 0.6 },
    performance: { speed: "fast", quality: "high" },
    tier: "budget",
  },
  "google:gemini-2.5-pro-preview-06-05": {
    id: "gemini-2.5-pro-preview-06-05",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Advanced Gemini model with enhanced reasoning",
    maxTokens: 100000,
    contextWindow: 1000000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: true,
      pdf: true,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 1.25, output: 10 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
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
      tools: true,
      vision: true,
      nativeSearch: true,
      pdf: true,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
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
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 0.05, output: 0.2 },
    performance: { speed: "fast", quality: "medium" },
    tier: "budget",
  },
  "anthropic:claude-sonnet-4-0": {
    id: "claude-sonnet-4-0",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    description: "Latest Claude model with enhanced capabilities",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-sonnet-4-0-reasoning": {
    id: "claude-sonnet-4-0-reasoning",
    name: "Claude 4 Sonnet (Reasoning)",
    provider: "anthropic",
    description: "Claude 4 Sonnet optimized for reasoning tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 3, output: 15 },
    performance: { speed: "slow", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-3-7-sonnet-latest": {
    id: "claude-3-7-sonnet-latest",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    description: "Enhanced Claude 3.5 with improved capabilities",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: false,
      effort: false,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
    pricing: { input: 3, output: 15 },
    performance: { speed: "medium", quality: "high" },
    tier: "premium",
  },
  "anthropic:claude-3-7-sonnet-latest-reasoning": {
    id: "claude-3-7-sonnet-latest-reasoning",
    name: "Claude 3.7 Sonnet (Reasoning)",
    provider: "anthropic",
    description: "Claude 3.7 Sonnet optimized for reasoning tasks",
    maxTokens: 100000,
    contextWindow: 200000,
    enabled: true,
    capabilities: {
      tools: true,
      vision: true,
      nativeSearch: false,
      pdf: true,
      reasoning: true,
      effort: true,
      image: false,
    },
    supportedFileTypes: [
      ...SUPPORTS_TEXT_TYPES,
      ...SUPPORTS_IMAGE_TYPES,
      ...SUPPORTS_PDF_TYPES,
    ],
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

/**
 * Convert file extensions to MIME types for use in HTML accept attribute
 */
export const extensionToMimeTypeMap: Record<string, string[]> = {
  // Images
  png: ["image/png"],
  jpeg: ["image/jpeg"],
  jpg: ["image/jpeg"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  heic: ["image/heic"],
  // Documents
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  md: ["text/markdown"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  // Spreadsheets
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["text/csv"],
  // Archives
  zip: ["application/zip"],
  rar: ["application/x-rar-compressed"],
  tar: ["application/x-tar"],
  gz: ["application/gzip"],
};

/**
 * Get MIME types for a model's supported file types
 */
export const getModelAcceptTypes = (modelKey: Model): string[] => {
  const model = AVAILABLE_MODELS[modelKey];
  if (!model) return [];

  const mimeTypes = new Set<string>();

  for (const extension of model.supportedFileTypes) {
    const mimeTypesForExtension = extensionToMimeTypeMap[extension];
    if (mimeTypesForExtension) {
      for (const mimeType of mimeTypesForExtension) {
        mimeTypes.add(mimeType);
      }
    }
  }

  return Array.from(mimeTypes);
};

/**
 * Check if a model supports a specific file type
 */
export const modelSupportsFileType = (
  modelKey: Model,
  mimeType: string
): boolean => {
  const acceptedTypes = getModelAcceptTypes(modelKey);
  return acceptedTypes.includes(mimeType);
};

/**
 * Get the API provider for a model (used for routing API calls)
 * Falls back to the main provider if no apiProvider is specified
 */
export const getApiProvider = (modelKey: Model): Provider => {
  const model = AVAILABLE_MODELS[modelKey];
  return model?.apiProvider ?? model?.provider ?? "openai";
};

/**
 * Get the display provider for a model (used in UI)
 */
export const getDisplayProvider = (modelKey: Model): Provider => {
  const model = AVAILABLE_MODELS[modelKey];
  return model?.provider ?? "openai";
};
