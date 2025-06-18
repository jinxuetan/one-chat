import { env } from "@/env";

export type ApiProvider = "openai" | "anthropic" | "google" | "openrouter";

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}

export interface ProviderConfig {
  name: string;
  keyPrefix: string;
  keyPattern: RegExp;
  description: string;
  validationEndpoint: string;
  testMethod: string;
  requiresVerification?: boolean;
  verificationNote?: string;
  verificationUrl?: string;
}

export const PROVIDER_CONFIGS: Record<ApiProvider, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "o4-mini, GPT-4o, GPT-4.1, o3, and ImageGen",
    validationEndpoint: "https://api.openai.com/v1/models",
    testMethod: "GET",
    requiresVerification: true,
    verificationNote:
      "Organization verification required for reasoning (o3, o1) and image models",
    verificationUrl:
      "https://platform.openai.com/settings/organization/general",
  },
  anthropic: {
    name: "Anthropic",
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "Claude 4 Sonnet and Claude 3.7 Sonnet",
    validationEndpoint: `${env.NEXT_PUBLIC_APP_URL}/api/validate?provider=anthropic`,
    testMethod: "GET",
  },
  google: {
    name: "Google AI",
    keyPrefix: "AIza",
    keyPattern: /^AIza[A-Za-z0-9_-]{35,}$/,
    description: "Gemini 2.5 Pro, 2.5 Flash, and 2.0 Flash",
    validationEndpoint:
      "https://generativelanguage.googleapis.com/v1beta/models",
    testMethod: "GET",
  },
  openrouter: {
    name: "OpenRouter",
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "Access all the models with one key",
    validationEndpoint: "https://openrouter.ai/api/v1/credits",
    testMethod: "GET",
  },
};

export const validateApiKeyFormat = (
  provider: ApiProvider,
  key: string
): boolean => {
  const config = PROVIDER_CONFIGS[provider];
  return config.keyPattern.test(key);
};

export const getProvidersByKey = (keys: ApiKeys): ApiProvider[] => {
  return Object.entries(keys)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key as ApiProvider);
};

export const getAvailableProviders = (keys: ApiKeys): ApiProvider[] => {
  const providers = getProvidersByKey(keys);
  return providers.length > 0 ? providers : [];
};

export const hasOpenRouterAccess = (keys: ApiKeys): boolean => {
  return Boolean(keys.openrouter);
};

export const getRequiredProvidersForModel = (
  modelKey: string
): ApiProvider[] => {
  if (modelKey.startsWith("openai:")) return ["openai"];
  if (modelKey.startsWith("anthropic:")) return ["anthropic"];
  if (modelKey.startsWith("google:")) return ["google"];
  if (modelKey.startsWith("openrouter:")) return ["openrouter"];
  return [];
};

export const canUseModel = (modelKey: string, keys: ApiKeys): boolean => {
  if (hasOpenRouterAccess(keys)) return true;

  const requiredProviders = getRequiredProvidersForModel(modelKey);
  return requiredProviders.every((provider) => Boolean(keys[provider]));
};

export const getKeyStorageKey = (userId: string): string => {
  return `onechat-api-keys-${userId}`;
};

export const obfuscateKey = (key: string): string => {
  if (key.length <= 8) return key;
  const visibleStart = key.substring(0, 6);
  const visibleEnd = key.substring(key.length - 4);
  const hiddenCount = key.length - 10;
  return `${visibleStart}${"*".repeat(Math.min(hiddenCount, 20))}${visibleEnd}`;
};

export const encryptKey = (key: string, userId: string): string => {
  const keyArray = key.split("");
  const userIdArray = userId.split("");

  return keyArray
    .map((char, index) => {
      const userChar =
        userIdArray[index % userIdArray.length] || userId[0] || "x";
      return String.fromCharCode(char.charCodeAt(0) ^ userChar.charCodeAt(0));
    })
    .join("");
};

export const decryptKey = (encryptedKey: string, userId: string): string => {
  return encryptKey(encryptedKey, userId);
};
