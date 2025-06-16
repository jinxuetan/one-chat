"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { getBestAvailableDefaultModel, getModelByKey } from "@/lib/ai";
import type { ApiKeys, ApiProvider } from "@/lib/api-keys";
import {
  PROVIDER_CONFIGS,
  canUseModel,
  decryptKey,
  encryptKey,
  getAvailableProviders,
  getKeyStorageKey,
  hasOpenRouterAccess,
  validateApiKeyFormat,
} from "@/lib/api-keys";
import { useSession } from "@/lib/auth/client";
import { setModelCookie } from "@/lib/utils";
import {
  getHasKeysFromCookie,
  setHasKeysCookie,
  setRoutingCookie,
} from "@/lib/utils/cookie";
import { toast } from "@workspace/ui/components/sonner";
import { useCallback, useState } from "react";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface UseApiKeysReturn {
  keys: ApiKeys;
  hasKeys: boolean;
  availableProviders: ApiProvider[];
  hasOpenRouter: boolean;
  isValidating: boolean;
  validationStatus: Record<ApiProvider, ValidationResult | null>;

  validateKey: (
    provider: ApiProvider,
    key: string
  ) => Promise<ValidationResult>;
  saveKey: (provider: ApiProvider, key: string) => Promise<void>;
  removeKey: (provider: ApiProvider) => void;
  clearAllKeys: () => void;
  clearValidation: (provider: ApiProvider) => void;
  canUseModelWithKeys: (modelKey: string) => boolean;
}

const validateKeyWithProvider = async (
  provider: ApiProvider,
  key: string
): Promise<ValidationResult> => {
  const config = PROVIDER_CONFIGS[provider];

  if (!validateApiKeyFormat(provider, key)) {
    return {
      isValid: false,
      error: `Invalid ${config.name} key format. Must start with ${config.keyPrefix}`,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    switch (provider) {
      case "openai":
        headers.Authorization = `Bearer ${key}`;
        break;
      case "anthropic": {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
        break;
      }
      case "google":
        break;
      case "openrouter": {
        headers.Authorization = `Bearer ${key}`;
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "OneChat";
        break;
      }
      default:
        break;
    }

    const url =
      provider === "google"
        ? `${config.validationEndpoint}?key=${key}`
        : config.validationEndpoint;

    const response = await fetch(url, {
      method: config.testMethod,
      headers,
    });

    if (response.status === 401 || response.status === 400) {
      return {
        isValid: false,
        error: `Invalid ${config.name} API key. Please check your key.`,
      };
    }

    if (response.status === 403) {
      return {
        isValid: false,
        error: `${config.name} API key lacks required permissions.`,
      };
    }

    if (!response.ok) {
      return {
        isValid: false,
        error: `Failed to validate ${config.name} key. Please try again.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error(`Error validating ${provider} key:`, error);
    return {
      isValid: false,
      error: `Network error while validating ${config.name} key.`,
    };
  }
};

export const useApiKeys = (): UseApiKeysReturn => {
  const { data: session } = useSession();
  const userId = session?.user?.id || "anonymous";

  const [storedKeys, setStoredKeys, clearStoredKeys] = useLocalStorage<
    Record<string, string>
  >(getKeyStorageKey(userId), {});

  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    Record<ApiProvider, ValidationResult | null>
  >({
    openai: null,
    anthropic: null,
    google: null,
    openrouter: null,
  });

  const keys: ApiKeys = {
    openai: storedKeys.openai
      ? decryptKey(storedKeys.openai, userId)
      : undefined,
    anthropic: storedKeys.anthropic
      ? decryptKey(storedKeys.anthropic, userId)
      : undefined,
    google: storedKeys.google
      ? decryptKey(storedKeys.google, userId)
      : undefined,
    openrouter: storedKeys.openrouter
      ? decryptKey(storedKeys.openrouter, userId)
      : undefined,
  };

  // Use cookie flag to prevent flash on initial load
  const hasKeysFromCookie = getHasKeysFromCookie(userId);
  const hasKeysFromLocalStorage = Object.values(keys).some(Boolean);

  // Use cookie value if available, otherwise fallback to localStorage
  const hasKeys =
    hasKeysFromCookie !== null ? hasKeysFromCookie : hasKeysFromLocalStorage;
  const availableProviders = getAvailableProviders(keys);
  const hasOpenRouter = hasOpenRouterAccess(keys);

  const validateKey = useCallback(
    async (provider: ApiProvider, key: string): Promise<ValidationResult> => {
      setIsValidating(true);
      setValidationStatus((prev) => ({ ...prev, [provider]: null }));

      try {
        const result = await validateKeyWithProvider(provider, key);
        setValidationStatus((prev) => ({ ...prev, [provider]: result }));
        return result;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const saveKey = useCallback(
    async (provider: ApiProvider, key: string): Promise<void> => {
      const validation = await validateKey(provider, key);

      if (!validation.isValid) {
        toast.error(
          validation.error || `Invalid ${PROVIDER_CONFIGS[provider].name} key`
        );
        throw new Error(validation.error);
      }

      const encryptedKey = encryptKey(key, userId);
      setStoredKeys((prev) => ({ ...prev, [provider]: encryptedKey }));

      // Get updated keys including the new one
      const updatedKeys = {
        ...keys,
        [provider]: key,
      };

      // Get the best available model with the new keys
      const bestModel = getBestAvailableDefaultModel(updatedKeys);

      // Set the new model as the default
      setModelCookie(bestModel);

      // Update the has-keys cookie flag
      setHasKeysCookie(true, userId);

      // Get model config for display name
      const modelConfig = getModelByKey(bestModel);
      const modelName = modelConfig?.name || bestModel;

      toast.success(
        `${PROVIDER_CONFIGS[provider].name} key added successfully. Switched to ${modelName}.`
      );
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    [validateKey, setStoredKeys, userId, keys]
  );

  const removeKey = useCallback(
    (provider: ApiProvider) => {
      setStoredKeys((prev) => {
        const newKeys = { ...prev };
        delete newKeys[provider];

        // Check if there are any remaining keys
        const hasRemainingKeys = Object.keys(newKeys).length > 0;
        setHasKeysCookie(hasRemainingKeys, userId);

        return newKeys;
      });
      if (provider === "openrouter") {
        setRoutingCookie(false);
      }
      setValidationStatus((prev) => ({ ...prev, [provider]: null }));
      toast.success(`${PROVIDER_CONFIGS[provider].name} key removed`);
    },
    [setStoredKeys, userId]
  );

  const clearAllKeys = useCallback(() => {
    clearStoredKeys();
    setHasKeysCookie(false, userId);
    setValidationStatus({
      openai: null,
      anthropic: null,
      google: null,
      openrouter: null,
    });
    toast.success("All API keys cleared");
  }, [clearStoredKeys, userId]);

  const clearValidation = useCallback((provider: ApiProvider) => {
    setValidationStatus((prev) => ({ ...prev, [provider]: null }));
  }, []);

  const canUseModelWithKeys = useCallback(
    (modelKey: string) => canUseModel(modelKey, keys),
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    [keys]
  );

  return {
    keys,
    hasKeys,
    availableProviders,
    hasOpenRouter,
    isValidating,
    validationStatus,
    validateKey,
    saveKey,
    removeKey,
    clearAllKeys,
    clearValidation,
    canUseModelWithKeys,
  };
};
