"use client";

import { useCallback, useEffect, useRef } from "react";
import { useApiKeys } from "./use-api-keys";
import { getBestAvailableDefaultModel } from "@/lib/ai/models";
import { setModelCookie } from "@/lib/utils";
import type { Model } from "@/lib/ai/config";

interface UseBestModelOptions {
  /**
   * Callback to update the current selected model
   */
  onModelChange?: (model: Model) => void;

  /**
   * Whether to automatically switch to the best model when keys change
   * @default true
   */
  autoSwitch?: boolean;
}

/**
 * Hook that provides the best available model and automatically switches
 * to it when API keys are added or removed
 */
export const useBestModel = (options: UseBestModelOptions = {}) => {
  const { onModelChange, autoSwitch = true } = options;
  const { keys } = useApiKeys();
  const previousKeysRef = useRef(keys);

  const getBestModel = useCallback(() => {
    return getBestAvailableDefaultModel(keys);
  }, [keys]);

  // Check if keys have changed in a meaningful way
  const haveKeysChanged = useCallback(
    (prevKeys: typeof keys, currentKeys: typeof keys) => {
      return (
        Boolean(prevKeys.openai) !== Boolean(currentKeys.openai) ||
        Boolean(prevKeys.anthropic) !== Boolean(currentKeys.anthropic) ||
        Boolean(prevKeys.google) !== Boolean(currentKeys.google) ||
        Boolean(prevKeys.openrouter) !== Boolean(currentKeys.openrouter)
      );
    },
    []
  );

  return {
    /**
     * Get the current best available model
     */
    getBestModel,

    /**
     * Manually switch to the best available model
     */
    switchToBestModel: useCallback(() => {
      const bestModel = getBestModel();
      setModelCookie(bestModel);
      onModelChange?.(bestModel);
      return bestModel;
    }, [getBestModel, onModelChange]),
  };
};
