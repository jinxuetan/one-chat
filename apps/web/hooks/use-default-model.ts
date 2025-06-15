"use client";

import { useMemo } from "react";
import { useApiKeys } from "./use-api-keys";
import { getBestAvailableDefaultModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import type { Model } from "@/lib/ai/config";

/**
 * Hook to get the best available default model based on user's API keys
 * Falls back to static default if no keys are available
 */
export const useDefaultModel = (): Model => {
  const { keys } = useApiKeys();

  return useMemo(() => {
    // If no keys are available, use static default
    if (!keys.openai && !keys.anthropic && !keys.google && !keys.openrouter) {
      return DEFAULT_CHAT_MODEL;
    }

    // Get the best available model based on keys
    return getBestAvailableDefaultModel(keys);
  }, [keys]);
};

/**
 * Get default model synchronously (for server-side or immediate use)
 * This is a pure function that doesn't depend on React hooks
 */
export const getDefaultModelSync = (keys: {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}): Model => {
  // If no keys are provided, return static default
  if (!keys.openai && !keys.anthropic && !keys.google && !keys.openrouter) {
    return DEFAULT_CHAT_MODEL;
  }

  return getBestAvailableDefaultModel(keys);
};
