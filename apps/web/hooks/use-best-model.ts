"use client";

import type { Model } from "@/lib/ai/config";
import { getBestAvailableDefaultModel } from "@/lib/ai/models";
import { setModelCookie } from "@/lib/utils";
import { useCallback } from "react";
import { useApiKeys } from "./use-api-keys";

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
  const { onModelChange } = options;
  const { keys } = useApiKeys();

  const getBestModel = useCallback(() => {
    return getBestAvailableDefaultModel(keys);
  }, [keys]);

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
