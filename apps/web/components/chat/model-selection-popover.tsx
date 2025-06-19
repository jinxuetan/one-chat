"use client";

import { useApiKeys } from "@/hooks/use-api-keys";
import { useDefaultModel } from "@/hooks/use-default-model";
import type { Model, ModelConfig, Provider } from "@/lib/ai/config";
import { getAvailableModels, getRecommendedModels } from "@/lib/ai/models";
import { setRoutingCookie } from "@/lib/utils/cookie";
import {
  Anthropic,
  DeepSeek,
  Google,
  Meta,
  OpenAI,
  OpenRouter,
  Qwen,
} from "@lobehub/icons";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Code,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Globe,
  Globe2,
  Grid3X3,
  Image,
  Layers,
  List,
  Lock,
  Package,
  Search,
  Settings2,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Drawer from "vaul";

type ViewMode = "grid" | "list";
type CapabilityFilter = Exclude<keyof typeof CAPABILITY_ICONS, "tools">;

interface ModelSelectionPopoverProps {
  onSelect: (model: Model) => void;
  selectedModel?: Model;
  className?: string;
  isRestrictedToOpenRouter: boolean;
  onIsRestrictedToOpenRouterChange: (isRestrictedToOpenRouter: boolean) => void;
  disabled?: boolean;
}

interface ModelComponentProps {
  model: ModelConfig;
  modelKey: Model;
  isSelected: boolean;
  onSelect: (model: Model) => void;
  isRestrictedToOpenRouter?: boolean;
}

interface ProviderToggleProps {
  isRestrictedToOpenRouter: boolean;
  onRoutingChange: (newRoutingValue: boolean) => void;
}

interface ModelSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface FilterControlsProps {
  selectedCapabilities: CapabilityFilter[];
  onCapabilitiesChange: (capabilities: CapabilityFilter[]) => void;
  availableCapabilities: CapabilityFilter[];
}

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

interface ModelListProps {
  models: ModelConfig[];
  selectedModel?: Model;
  onModelSelect: (model: Model) => void;
  viewMode: ViewMode;
  title?: string;
  showIcon?: boolean;
  isRestrictedToOpenRouter?: boolean;
}

const CAPABILITY_ICONS = {
  streaming: <Zap className="size-4" />,
  vision: <Eye className="size-4" />,
  tools: <Wrench className="size-4" />,
  search: <Globe className="size-4" />,
  pdf: <FileText className="size-4" />,
  reasoning: <Brain className="size-4" />,
  effort: <Settings2 className="size-4" />,
  coding: <Code className="size-4" />,
  multimodal: <Layers className="size-4" />,
  image: <Image className="size-4" />,
  nativeSearch: <Globe2 className="size-4" />,
} as const;

const PROVIDER_ICONS = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  deepseek: DeepSeek,
  meta: Meta,
  openrouter: OpenRouter,
  qwen: Qwen,
} as const;

const TIER_CONFIG = {
  premium: {
    color:
      "border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
    icon: <Sparkles className="size-2.5" />,
  },
  standard: {
    color:
      "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300",
    icon: <Star className="size-2.5" />,
  },
  budget: {
    color:
      "border-neutral-200/80 bg-transparent text-neutral-600 dark:border-neutral-800/50 dark:text-neutral-400",
    icon: <DollarSign className="size-2.5" />,
  },
} as const;

const ALL_MODELS = getAvailableModels();
const RECOMMENDED_MODEL_IDS = new Set(getRecommendedModels().map((m) => m.id));

const getModelKey = (model: ModelConfig): Model => {
  return (
    model.apiProvider
      ? `${model.apiProvider}:${model.id}`
      : `${model.provider}:${model.id}`
  ) as Model;
};

const getModelCapabilities = (model: ModelConfig): string[] => {
  return Object.entries(model.capabilities)
    .filter(([, value]) => value === true)
    .filter(([key]) => key !== "effort")
    .map(([key]) => key);
};

const shouldAutoExpandModels = (
  searchQuery: string,
  selectedCapabilities: CapabilityFilter[]
): boolean => {
  return searchQuery.length > 0 || selectedCapabilities.length > 0;
};

const useProviderRouting = (onRoutingChange: (value: boolean) => void) => {
  const handleRoutingChange = useCallback(
    (newValue: boolean) => {
      onRoutingChange(newValue);
      setRoutingCookie(newValue);
    },
    [onRoutingChange]
  );

  return { handleRoutingChange };
};

const useModelFiltering = (
  searchQuery: string,
  selectedCapabilities: CapabilityFilter[]
) => {
  const filteredModels = useMemo(() => {
    let filtered = ALL_MODELS;

    if (selectedCapabilities.length > 0) {
      filtered = filtered.filter((model) =>
        selectedCapabilities.some(
          (capability) =>
            model.capabilities[
              capability as keyof typeof model.capabilities
            ] === true
        )
      );
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(searchTerm) ||
          model.description.toLowerCase().includes(searchTerm) ||
          model.provider.toLowerCase().includes(searchTerm) ||
          Object.keys(model.capabilities).some(
            (cap) =>
              model.capabilities[cap as keyof typeof model.capabilities] ===
                true && cap.toLowerCase().includes(searchTerm)
          )
      );
    }

    return filtered;
  }, [searchQuery, selectedCapabilities]);

  const recommendedModels = useMemo(
    () => filteredModels.filter((model) => RECOMMENDED_MODEL_IDS.has(model.id)),
    [filteredModels]
  );

  const additionalModels = useMemo(
    () =>
      filteredModels.filter((model) => !RECOMMENDED_MODEL_IDS.has(model.id)),
    [filteredModels]
  );

  return { recommendedModels, additionalModels };
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const useScrollDetection = (dependencies: any[]) => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight;

    setIsAtBottom(isScrolledToBottom);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    handleScroll();
    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll, ...dependencies]);

  return { scrollRef, isAtBottom };
};

const useAvailableCapabilities = () => {
  return useMemo(() => {
    const capabilities = new Set<CapabilityFilter>();
    for (const model of ALL_MODELS) {
      for (const [key, value] of Object.entries(model.capabilities)) {
        if (value === true && key !== "tools" && key in CAPABILITY_ICONS) {
          capabilities.add(key as CapabilityFilter);
        }
      }
    }
    return Array.from(capabilities);
  }, []);
};

const CapabilityIcon = memo(({ capability }: { capability: string }) => {
  return CAPABILITY_ICONS[capability as keyof typeof CAPABILITY_ICONS] ?? null;
});
CapabilityIcon.displayName = "CapabilityIcon";

const ProviderIcon = memo(
  ({ provider, className }: { provider: Provider; className?: string }) => {
    const Icon = PROVIDER_ICONS[provider];
    return Icon ? <Icon className={cn("size-5", className)} /> : null;
  }
);
ProviderIcon.displayName = "ProviderIcon";

const TierBadge = memo(({ tier }: { tier: string }) => {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  return (
    <Badge
      variant="outline"
      className={cn("px-1 py-0.5 text-xs", config.color)}
    >
      {config.icon}
      <span className="ml-1 capitalize">{tier}</span>
    </Badge>
  );
});
TierBadge.displayName = "TierBadge";

const ModelCard = memo(
  ({
    model,
    modelKey,
    isSelected,
    onSelect,
    isRestrictedToOpenRouter,
  }: ModelComponentProps) => {
    const { canUseModelWithKeys, keys } = useApiKeys();
    const capabilities = getModelCapabilities(model);

    // Special case: gpt-imagegen requires OpenAI key specifically (not available through OpenRouter)
    const requiresOpenAIDirectly = modelKey === "openai:gpt-imagegen";
    const canUse = requiresOpenAIDirectly
      ? Boolean(keys.openai) && !isRestrictedToOpenRouter
      : isRestrictedToOpenRouter
      ? canUseModelWithKeys(modelKey)
      : Boolean(keys[model.provider as keyof typeof keys]);

    const handleClick = useCallback(() => {
      if (canUse) {
        onSelect(modelKey);
      }
    }, [modelKey, onSelect, canUse]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && canUse) {
          e.preventDefault();
          onSelect(modelKey);
        }
      },
      [modelKey, onSelect, canUse]
    );

    return (
      <button
        type="button"
        className={cn(
          "group relative flex h-full cursor-pointer flex-col rounded-md border p-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-400",
          !canUse && "cursor-not-allowed border-dashed opacity-50",
          isSelected
            ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            : "border-neutral-200 bg-transparent hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
        )}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        disabled={!canUse}
        aria-label={`${canUse ? "Select" : "Unavailable"} model ${model.name}`}
      >
        <div className="flex items-start justify-between gap-2 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex-shrink-0">
              <ProviderIcon provider={model.provider} />
            </div>
            <h4 className="flex-1 truncate font-semibold text-foreground text-sm">
              {model.name}
            </h4>
            {!canUse && <Lock className="mr-1 size-3 text-muted-foreground" />}
          </div>
          {isSelected && (
            <div className="size-4 flex-shrink-0">
              <CheckCircle2 className="size-full text-ring" />
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          <TierBadge tier={model.tier} />
          <div className="flex items-center justify-start gap-1">
            {capabilities.slice(0, 5).map((capability) => (
              <Tooltip key={capability}>
                <TooltipTrigger asChild>
                  <div className="flex size-5 items-center justify-center rounded-sm border border-neutral-200/80 bg-neutral-100/80 text-muted-foreground dark:border-neutral-800/50 dark:bg-neutral-900/50">
                    <CapabilityIcon capability={capability} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{capability}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="pt-1.5">
          <p className="truncate text-muted-foreground text-xs capitalize">
            {model.performance.speed} speed · {model.performance.quality}{" "}
            quality
          </p>
        </div>
      </button>
    );
  }
);
ModelCard.displayName = "ModelCard";

const ModelListItem = memo(
  ({
    model,
    modelKey,
    isSelected,
    onSelect,
    isRestrictedToOpenRouter,
  }: ModelComponentProps) => {
    const { canUseModelWithKeys, keys } = useApiKeys();
    const capabilities = getModelCapabilities(model);

    // Special case: gpt-imagegen requires OpenAI key specifically (not available through OpenRouter)
    const requiresOpenAIDirectly = modelKey === "openai:gpt-imagegen";
    const canUse = requiresOpenAIDirectly
      ? Boolean(keys.openai) && !isRestrictedToOpenRouter
      : isRestrictedToOpenRouter
      ? canUseModelWithKeys(modelKey)
      : Boolean(keys[model.provider as keyof typeof keys]);

    const handleClick = useCallback(() => {
      if (canUse) {
        onSelect(modelKey);
      }
    }, [modelKey, onSelect, canUse]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && canUse) {
          e.preventDefault();
          onSelect(modelKey);
        }
      },
      [modelKey, onSelect, canUse]
    );

    return (
      <button
        type="button"
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-md border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-400",
          !canUse && "cursor-not-allowed border-dashed opacity-50",
          isSelected
            ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            : "border-neutral-200 bg-transparent hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
        )}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        disabled={!canUse}
        aria-label={`${canUse ? "Select" : "Unavailable"} model ${model.name}`}
      >
        <div className="flex-shrink-0">
          <ProviderIcon provider={model.provider} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate font-semibold text-foreground text-sm">
              {model.name}
            </h4>
            <TierBadge tier={model.tier} />
            {!canUse && <Lock className="size-3 text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground text-xs capitalize">
            {model.performance.speed} speed · {model.performance.quality}{" "}
            quality
          </p>
        </div>

        <div className="mr-1 flex items-center gap-1">
          {capabilities.slice(0, 4).map((capability) => (
            <Tooltip key={capability}>
              <TooltipTrigger asChild>
                <div className="flex size-5 items-center justify-center rounded-sm border border-neutral-200/80 bg-neutral-100/80 text-muted-foreground dark:border-neutral-800/50 dark:bg-neutral-900/50">
                  <CapabilityIcon capability={capability} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{capability}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {isSelected && (
          <div className="ml-1 flex-shrink-0">
            <CheckCircle2 className="size-4 text-ring" />
          </div>
        )}
      </button>
    );
  }
);
ModelListItem.displayName = "ModelListItem";

const ModelSearch = memo(
  ({ searchQuery, onSearchChange }: ModelSearchProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
      },
      [onSearchChange]
    );

    return (
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 transform text-muted-foreground" />
        <Input
          placeholder="Search models and capabilities..."
          value={searchQuery}
          onChange={handleChange}
          className="h-10 rounded-lg border-border bg-muted/50 pl-10 transition-all duration-150 ease-out focus:bg-background"
        />
      </div>
    );
  }
);
ModelSearch.displayName = "ModelSearch";

const ProviderToggle = memo(
  ({ isRestrictedToOpenRouter, onRoutingChange }: ProviderToggleProps) => {
    const { hasOpenRouter, keys } = useApiKeys();

    // Check if user has any native provider keys
    const hasNativeKeys = Boolean(keys.openai || keys.anthropic || keys.google);
    const onlyHasOpenRouter = hasOpenRouter && !hasNativeKeys;

    const handleAutoClick = useCallback(() => {
      if (hasNativeKeys) {
        onRoutingChange(false);
      }
    }, [onRoutingChange, hasNativeKeys]);

    const handleOpenRouterClick = useCallback(() => {
      if (hasOpenRouter) {
        onRoutingChange(true);
      }
    }, [onRoutingChange, hasOpenRouter]);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Package className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground text-sm">Provider</span>
        </div>
        <div className="flex w-full items-center gap-1 rounded-lg border bg-muted/20 p-1">
          <button
            type="button"
            disabled={!hasNativeKeys}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-2 font-medium text-xs transition-all duration-200 ease-out",
              !hasNativeKeys && "cursor-not-allowed border-dashed opacity-50",
              !isRestrictedToOpenRouter && hasNativeKeys
                ? "border border-neutral-200 bg-neutral-200/50 text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
            onClick={handleAutoClick}
          >
            <Globe className="size-3.5" />
            <span>Auto (Native)</span>
            {!hasNativeKeys && <Lock className="size-3" />}
          </button>
          <button
            type="button"
            disabled={!hasOpenRouter}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-2 font-medium text-xs transition-all duration-200 ease-out",
              !hasOpenRouter && "cursor-not-allowed border-dashed opacity-50",
              isRestrictedToOpenRouter && hasOpenRouter
                ? "border border-neutral-200 bg-neutral-200/50 text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
            onClick={handleOpenRouterClick}
          >
            <Globe2 className="size-3.5" />
            <span>OpenRouter</span>
            {!hasOpenRouter && <Lock className="size-3" />}
          </button>
        </div>
        <div className="mt-1">
          <p className="text-muted-foreground text-xs">
            {isRestrictedToOpenRouter
              ? "Routing all models through OpenRouter API"
              : onlyHasOpenRouter
              ? "Only OpenRouter key available - native routing disabled"
              : hasNativeKeys
              ? hasOpenRouter
                ? "Using native provider APIs automatically"
                : "OpenRouter API key required to use OpenRouter routing"
              : "Native provider API keys required for auto routing"}
          </p>
        </div>
      </div>
    );
  }
);
ProviderToggle.displayName = "ProviderToggle";

const FilterControls = memo(
  ({
    selectedCapabilities,
    onCapabilitiesChange,
    availableCapabilities,
  }: FilterControlsProps) => {
    const handleCapabilityToggle = useCallback(
      (capability: CapabilityFilter) => {
        onCapabilitiesChange(
          selectedCapabilities.includes(capability)
            ? selectedCapabilities.filter((c) => c !== capability)
            : [...selectedCapabilities, capability]
        );
      },
      [selectedCapabilities, onCapabilitiesChange]
    );

    const handleClearFilters = useCallback(() => {
      onCapabilitiesChange([]);
    }, [onCapabilitiesChange]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex size-10 items-center justify-center rounded-lg border border-border/80 backdrop-blur-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selectedCapabilities.length > 0
                ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                : "bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground dark:bg-card dark:hover:bg-accent/80"
            )}
          >
            <Filter className="size-4" />
            {selectedCapabilities.length > 0 && (
              <div className="-top-1 -right-1 absolute flex size-5 items-center justify-center rounded-full border border-background bg-primary font-medium text-primary-foreground text-xs shadow-sm dark:border-card">
                {selectedCapabilities.length}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]" align="end" side="top">
          <DropdownMenuLabel>Filter by Capabilities</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {availableCapabilities.map((capability) => {
            const isSelected = selectedCapabilities.includes(capability);
            const label =
              capability.charAt(0).toUpperCase() + capability.slice(1);
            return (
              <DropdownMenuItem
                key={capability}
                onClick={() => handleCapabilityToggle(capability)}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2",
                  isSelected && "bg-neutral-100 dark:bg-neutral-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <CapabilityIcon capability={capability} />
                  <span className="text-sm">
                    {label === "NativeSearch" ? "Native Search" : label}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="size-4 text-neutral-600 dark:text-neutral-400" />
                )}
              </DropdownMenuItem>
            );
          })}

          {selectedCapabilities.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClearFilters}
                className="text-muted-foreground"
              >
                Clear All Filters ({selectedCapabilities.length})
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
FilterControls.displayName = "FilterControls";

const ViewModeToggle = memo(
  ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
    const handleGridClick = useCallback(() => {
      onViewModeChange("grid");
    }, [onViewModeChange]);

    const handleListClick = useCallback(() => {
      onViewModeChange("list");
    }, [onViewModeChange]);

    return (
      <div className="flex items-center overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm backdrop-blur-sm dark:bg-card">
        <button
          type="button"
          className={cn(
            "flex size-10 items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/60"
          )}
          onClick={handleGridClick}
        >
          <Grid3X3 className="size-4" />
        </button>
        <button
          type="button"
          className={cn(
            "flex size-10 items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            viewMode === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/60"
          )}
          onClick={handleListClick}
        >
          <List className="size-4" />
        </button>
      </div>
    );
  }
);
ViewModeToggle.displayName = "ViewModeToggle";

const ModelList = memo(
  ({
    models,
    selectedModel,
    onModelSelect,
    viewMode,
    title,
    showIcon = false,
    isRestrictedToOpenRouter,
  }: ModelListProps) => {
    if (models.length === 0) return null;

    return (
      <div className="p-4">
        {title && (
          <div className="mb-3 flex items-center gap-2">
            {showIcon && <Star className="size-3.5 text-yellow-400" />}
            <h3 className="font-medium text-foreground text-sm">{title}</h3>
          </div>
        )}
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "space-y-2"
          )}
        >
          {models.map((model) => {
            const modelKey = getModelKey(model);
            const Component = viewMode === "grid" ? ModelCard : ModelListItem;
            return (
              <Component
                key={modelKey}
                model={model}
                modelKey={modelKey}
                isSelected={selectedModel === modelKey}
                onSelect={onModelSelect}
                isRestrictedToOpenRouter={isRestrictedToOpenRouter}
              />
            );
          })}
        </div>
      </div>
    );
  }
);
ModelList.displayName = "ModelList";

const EmptyState = memo(() => (
  <div className="flex h-full items-center justify-center p-8">
    <div className="text-center">
      <div className="mb-2 text-muted-foreground text-sm">No models found</div>
      <div className="text-muted-foreground text-xs">
        Try adjusting your search or filters
      </div>
    </div>
  </div>
));
EmptyState.displayName = "EmptyState";

const GradientOverlay = memo(({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 isolate h-64 w-full bg-gradient-to-t from-10% from-background via-50% via-background/50 to-transparent dark:from-card dark:via-card/50" />
  );
});
GradientOverlay.displayName = "GradientOverlay";

const ShowAllModelsButton = memo(
  ({
    additionalModelsCount,
    isShowingAllModels,
    onToggle,
  }: {
    additionalModelsCount: number;
    isShowingAllModels: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border/80 bg-background px-4 font-medium text-muted-foreground text-sm shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card dark:hover:bg-accent/80"
      onClick={onToggle}
    >
      <Layers className="size-4" />
      {isShowingAllModels
        ? "Hide Additional Models"
        : `Show All Models (${additionalModelsCount})`}
    </button>
  )
);
ShowAllModelsButton.displayName = "ShowAllModelsButton";

export const ModelSelectionPopover = ({
  onSelect,
  selectedModel,
  className,
  isRestrictedToOpenRouter,
  onIsRestrictedToOpenRouterChange,
  disabled = false,
}: ModelSelectionPopoverProps) => {
  const defaultModel = useDefaultModel();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    CapabilityFilter[]
  >([]);
  const [isShowingAllModels, setIsShowingAllModels] = useState(false);
  const isMobile = useIsMobile();

  const { handleRoutingChange } = useProviderRouting(
    onIsRestrictedToOpenRouterChange
  );
  const { recommendedModels, additionalModels } = useModelFiltering(
    searchQuery,
    selectedCapabilities
  );
  const { scrollRef, isAtBottom } = useScrollDetection([
    recommendedModels,
    additionalModels,
    isShowingAllModels,
  ]);
  const availableCapabilities = useAvailableCapabilities();

  const shouldAutoExpand = shouldAutoExpandModels(
    searchQuery,
    selectedCapabilities
  );
  const selectedModelConfig = useMemo(
    () =>
      selectedModel || defaultModel
        ? ALL_MODELS.find((model) => getModelKey(model) === selectedModel)
        : null,
    [selectedModel, defaultModel]
  );
  const hasNoResults =
    recommendedModels.length === 0 && additionalModels.length === 0;
  const shouldShowAllModels = isShowingAllModels || shouldAutoExpand;

  const handleModelSelect = useCallback(
    (model: Model) => {
      onSelect(model);
      setIsPopoverOpen(false);
      setSearchQuery("");
      setSelectedCapabilities([]);
      setIsShowingAllModels(false);
    },
    [onSelect]
  );

  const handlePopoverOpenChange = useCallback((isOpen: boolean) => {
    setIsPopoverOpen(isOpen);
    if (!isOpen) {
      setIsShowingAllModels(false);
    }
  }, []);

  const handleToggleAllModels = useCallback(() => {
    setIsShowingAllModels((prev) => !prev);
  }, []);

  useEffect(() => {
    setViewMode(isMobile ? "list" : "grid");
  }, [isMobile]);

  const trigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn("min-w-[120px] justify-between", className)}
      disabled={disabled}
    >
      <span className="truncate">
        {selectedModelConfig?.name ? (
          <div className="flex items-center gap-2">
            <ProviderIcon
              provider={selectedModelConfig.provider}
              className="size-4"
            />
            <span className="truncate">{selectedModelConfig.name}</span>
          </div>
        ) : (
          "Select Model"
        )}
      </span>
      <ChevronDown className="size-4" />
    </Button>
  );

  const header = (
    <div className="space-y-3 border-border border-b p-4">
      <ModelSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <ProviderToggle
        isRestrictedToOpenRouter={isRestrictedToOpenRouter}
        onRoutingChange={handleRoutingChange}
      />
    </div>
  );

  const mainContent = (
    <>
      <ModelList
        models={recommendedModels}
        selectedModel={selectedModel}
        onModelSelect={handleModelSelect}
        viewMode={viewMode}
        title="Recommended"
        showIcon
        isRestrictedToOpenRouter={isRestrictedToOpenRouter}
      />

      {additionalModels.length > 0 && shouldShowAllModels && (
        <>
          {recommendedModels.length > 0 && <Separator />}
          <ModelList
            models={additionalModels}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            viewMode={viewMode}
            title="All Models"
            isRestrictedToOpenRouter={isRestrictedToOpenRouter}
          />
        </>
      )}

      {hasNoResults && <EmptyState />}
    </>
  );

  const footer = (
    <>
      {additionalModels.length > 0 && !shouldAutoExpand && (
        <ShowAllModelsButton
          additionalModelsCount={additionalModels.length}
          isShowingAllModels={isShowingAllModels}
          onToggle={handleToggleAllModels}
        />
      )}

      <div className="ml-auto flex items-center gap-2">
        <FilterControls
          selectedCapabilities={selectedCapabilities}
          onCapabilitiesChange={setSelectedCapabilities}
          availableCapabilities={availableCapabilities}
        />
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root
        shouldScaleBackground
        open={isPopoverOpen}
        onOpenChange={handlePopoverOpenChange}
      >
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-20 flex h-[85vh] flex-col rounded-t-lg bg-background">
            <div className="mx-auto my-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/20" />
            {header}
            <div className="relative flex-1">
              <div className="absolute inset-0 overflow-y-auto" ref={scrollRef}>
                {mainContent}
              </div>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              {footer}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        className="min-h-[50vh] w-[540px] overflow-hidden rounded-xl p-0 shadow-sm"
        align="start"
        sideOffset={8}
      >
        {header}
        <div className="relative h-[50vh]">
          <div
            className="absolute inset-0 overflow-y-auto overscroll-contain pb-16"
            ref={scrollRef}
          >
            {mainContent}
          </div>

          <GradientOverlay isVisible={!isAtBottom} />

          {/* Bottom Controls */}
          <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between">
            {footer}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ProviderIcon };
