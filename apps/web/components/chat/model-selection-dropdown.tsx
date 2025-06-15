"use client";

import type { Model, ModelConfig, Provider } from "@/lib/ai/config";
import { getAvailableModels } from "@/lib/ai/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Brain, Eye, FileText, Image, Lock, Search } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useApiKeys } from "@/hooks/use-api-keys";
import { ProviderIcon } from "./model-selection-popover";

interface ModelSelectionDropdownProps {
  trigger: React.ReactNode;
  onSelect: (model?: Model) => void;
  disabled?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}

interface GroupedModels {
  [provider: string]: ModelConfig[];
}

const ModelSelectionDropdown = memo<ModelSelectionDropdownProps>(
  ({
    trigger,
    onSelect,
    disabled = false,
    side = "bottom",
    align = "start",
    className,
  }) => {
    const { canUseModelWithKeys, keys } = useApiKeys();

    const groupedModels = useMemo<GroupedModels>(() => {
      const models = getAvailableModels({
        // Show all enabled models
        capabilities: undefined,
      }).filter((model) => model.enabled);

      return models.reduce((acc, model) => {
        const provider = model.provider;
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
      }, {} as GroupedModels);
    }, []);

    const handleSelect = useCallback(
      (model?: Model) => {
        onSelect(model);
      },
      [onSelect]
    );

    const getModelKey = useCallback((model: ModelConfig): Model => {
      return (
        model.apiProvider
          ? `${model.apiProvider}:${model.id}`
          : `${model.provider}:${model.id}`
      ) as Model;
    }, []);

    const canUseModel = useCallback((model: ModelConfig): boolean => {
      const modelKey = getModelKey(model);
      
      // Special case: gpt-imagegen requires OpenAI key specifically (not available through OpenRouter)
      const requiresOpenAIDirectly = modelKey === "openai:gpt-imagegen";
      
      return requiresOpenAIDirectly 
        ? Boolean(keys.openai)
        : canUseModelWithKeys(modelKey);
    }, [keys, canUseModelWithKeys, getModelKey]);

    const providerOrder: Provider[] = [
      "openai",
      "anthropic",
      "google",
      "meta",
      "deepseek",
      "qwen",
    ];

    const sortedProviders = useMemo(() => {
      return providerOrder.filter(
        (provider) =>
          groupedModels[provider] && groupedModels[provider].length > 0
      );
    }, [groupedModels]);

    const getProviderDisplayName = useCallback((provider: Provider): string => {
      const names: Record<Provider, string> = {
        openai: "OpenAI",
        anthropic: "Anthropic",
        google: "Google",
        meta: "Meta",
        deepseek: "DeepSeek",
        qwen: "Qwen",
        openrouter: "OpenRouter",
      };
      return names[provider] || provider;
    }, []);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <div className={className}>{trigger}</div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={side}
          align={align}
          className="w-56"
          sideOffset={4}
        >
          {/* Continue without model selection */}
          <DropdownMenuItem
            onClick={() => handleSelect()}
            className="flex items-center gap-2 px-3 py-2.5"
          >
            <div className="flex size-4 items-center justify-center rounded border bg-muted">
              <div className="size-1.5 rounded-full bg-muted-foreground" />
            </div>
            <span className="font-medium text-sm">Same Model</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Provider submenus */}
          {sortedProviders.map((provider) => {
            const models = groupedModels[provider];
            if (!models || models.length === 0) return null;

            return (
              <DropdownMenuSub key={provider}>
                <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2">
                  <ProviderIcon provider={provider} className="size-4" />
                  <span className="font-medium text-sm">
                    {getProviderDisplayName(provider)}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    className="max-h-96 w-80 overflow-y-auto"
                    sideOffset={2}
                    alignOffset={-5}
                  >
                    {models.map((model) => {
                      // Get capabilities for this model
                      const capabilities = Object.entries(model.capabilities)
                        .filter(([, value]) => value === true)
                        .filter(([key]) => key !== "effort" && key !== "tools")
                        .map(([key]) => key);

                      const modelKey = getModelKey(model);
                      const canUse = canUseModel(model);

                      return (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => {
                            if (canUse) {
                              handleSelect(modelKey);
                            }
                          }}
                          disabled={!canUse}
                          className={`flex min-h-[44px] items-center justify-between gap-3 px-3 py-2 ${
                            !canUse 
                              ? "opacity-50 cursor-not-allowed" 
                              : "cursor-pointer"
                          }`}
                        >
                          {/* Model name */}
                          <div className="flex items-center gap-2 flex-1">
                            <span className="truncate font-medium text-sm">
                              {model.name}
                            </span>
                            {!canUse && (
                              <Lock className="size-3 text-muted-foreground" />
                            )}
                          </div>

                          {/* Capabilities */}
                          <div className="flex flex-shrink-0 items-center gap-1">
                            {capabilities.slice(0, 4).map((capability) => (
                              <div
                                key={capability}
                                className="flex size-5 items-center justify-center rounded-sm border border-neutral-200/80 bg-neutral-100/80 text-muted-foreground dark:border-neutral-800/50 dark:bg-neutral-900/50"
                                title={
                                  capability.charAt(0).toUpperCase() +
                                  capability.slice(1)
                                }
                              >
                                {capability === "reasoning" && (
                                  <Brain className="size-3" />
                                )}
                                {capability === "vision" && (
                                  <Eye className="size-3" />
                                )}
                                {capability === "image" && (
                                  <Image className="size-3" />
                                )}
                                {capability === "nativeSearch" && (
                                  <Search className="size-3" />
                                )}
                                {capability === "pdf" && (
                                  <FileText className="size-3" />
                                )}
                              </div>
                            ))}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

ModelSelectionDropdown.displayName = "ModelSelectionDropdown";

export { ModelSelectionDropdown };
