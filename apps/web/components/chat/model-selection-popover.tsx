"use client";

import type { Model, ModelConfig, Provider } from "@/lib/ai/config";
import { getAvailableModels, getRecommendedModels } from "@/lib/ai/models";
import { getRoutingFromCookie, setRoutingCookie } from "@/lib/utils/cookie";
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
import { useApiKeys } from "@/hooks/use-api-keys";

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

const PROVIDER_ICONS: Record<Provider, React.ComponentType<any>> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  deepseek: DeepSeek,
  meta: Meta,
  openrouter: OpenRouter,
  qwen: Qwen,
};

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

const useProviderRouting = (
  initialValue: boolean,
  onRoutingChange: (value: boolean) => void
) => {
  useEffect(() => {
    const cookieRouting = getRoutingFromCookie();
    if (cookieRouting !== null && cookieRouting !== initialValue) {
      onRoutingChange(cookieRouting);
    }
  }, [initialValue, onRoutingChange]);

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
          (capability) => (model.capabilities as any)[capability] === true
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
              (model.capabilities as any)[cap] === true &&
              cap.toLowerCase().includes(searchTerm)
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
    ALL_MODELS.forEach((model) => {
      Object.entries(model.capabilities).forEach(([key, value]) => {
        if (value === true && key !== "tools" && key in CAPABILITY_ICONS) {
          capabilities.add(key as CapabilityFilter);
        }
      });
    });
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
    const { canUseModelWithKeys } = useApiKeys();
    const capabilities = getModelCapabilities(model);
    const canUse = isRestrictedToOpenRouter || canUseModelWithKeys(modelKey);

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
          !canUse && "opacity-50 cursor-not-allowed border-dashed",
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
            {!canUse && <Lock className="size-3 text-muted-foreground mr-1" />}
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
    const { canUseModelWithKeys } = useApiKeys();
    const capabilities = getModelCapabilities(model);
    const canUse = isRestrictedToOpenRouter || canUseModelWithKeys(modelKey);

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
          !canUse && "opacity-50 cursor-not-allowed border-dashed",
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
        <div className="flex w-full items-center rounded-lg border bg-muted/20 p-1 gap-1">
          <button
            type="button"
            disabled={!hasNativeKeys}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 py-2 font-medium text-xs rounded-md transition-all duration-200 ease-out border border-transparent",
              !hasNativeKeys && "opacity-50 cursor-not-allowed border-dashed",
              !isRestrictedToOpenRouter && hasNativeKeys
                ? "bg-neutral-200/50 text-neutral-900 border border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900"
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
              "flex flex-1 items-center justify-center gap-2 px-3 py-2 font-medium text-xs rounded-md transition-all duration-200 ease-out border border-transparent",
              !hasOpenRouter && "opacity-50 cursor-not-allowed border-dashed",
              isRestrictedToOpenRouter && hasOpenRouter
                ? "bg-neutral-200/50 text-neutral-900 border border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900"
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
              : !hasNativeKeys
              ? "Native provider API keys required for auto routing"
              : !hasOpenRouter
              ? "OpenRouter API key required to use OpenRouter routing"
              : "Using native provider APIs automatically"}
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
              "relative flex size-10 items-center justify-center rounded-lg border border-border/80 backdrop-blur-xs transition-all duration-150 ease-out",
              selectedCapabilities.length > 0
                ? "bg-neutral-900/90 text-neutral-100 shadow-lg dark:bg-neutral-100/90 dark:text-neutral-900"
                : "bg-white/90 text-neutral-600 shadow-xs hover:bg-neutral-50/90 hover:text-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-400 dark:hover:bg-neutral-800/90 dark:hover:text-neutral-200"
            )}
          >
            <Filter className="size-4" />
            {selectedCapabilities.length > 0 && (
              <div className="-top-1 -right-1 absolute flex size-5 items-center justify-center rounded-full bg-neutral-900 font-medium text-neutral-100 text-xs shadow-sm dark:bg-neutral-100 dark:text-neutral-900">
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
                  "flex items-center justify-between gap-2 py-2 px-3",
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
      <div className="flex items-center overflow-hidden rounded-lg border border-border/80 bg-white/90 shadow-xs backdrop-blur-sm dark:bg-neutral-900/90">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center size-10 transition-all duration-150 ease-out",
            viewMode === "grid"
              ? "bg-neutral-700 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-700"
              : "text-muted-foreground hover:bg-neutral-50/60 hover:text-foreground dark:hover:bg-neutral-800/60"
          )}
          onClick={handleGridClick}
        >
          <Grid3X3 className="size-4" />
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center size-10 transition-all duration-150 ease-out",
            viewMode === "list"
              ? "bg-neutral-700 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-700"
              : "text-muted-foreground hover:bg-neutral-50/60 hover:text-foreground dark:hover:bg-neutral-800/60"
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
            viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"
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
    <div className="absolute bottom-0 w-full left-0 h-64 bg-gradient-to-t from-[#fefefe] from-10% via-50% via-[#fefefe]/50 to-transparent pointer-events-none isolate" />
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
      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border/80 bg-white/90 px-4 font-medium text-muted-foreground text-sm shadow-sm backdrop-blur-sm transition-all duration-150 ease-out hover:bg-neutral-50/90 hover:text-foreground dark:bg-neutral-900/90 dark:hover:bg-neutral-800/90"
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
  const { keys, hasOpenRouter } = useApiKeys();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    CapabilityFilter[]
  >([]);
  const [isShowingAllModels, setIsShowingAllModels] = useState(false);

  const { handleRoutingChange } = useProviderRouting(
    isRestrictedToOpenRouter,
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
      selectedModel
        ? ALL_MODELS.find((model) => getModelKey(model) === selectedModel)
        : null,
    [selectedModel]
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

  // Auto-switch to OpenRouter if user only has OpenRouter key
  useEffect(() => {
    const hasNativeKeys = Boolean(keys.openai || keys.anthropic || keys.google);
    const onlyHasOpenRouter = hasOpenRouter && !hasNativeKeys;

    if (onlyHasOpenRouter && !isRestrictedToOpenRouter) {
      handleRoutingChange(true);
    }
  }, [keys, hasOpenRouter, isRestrictedToOpenRouter, handleRoutingChange]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>

      <PopoverContent
        className="min-h-[50vh] w-[540px] rounded-xl p-0 overflow-hidden shadow-sm"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="space-y-3 border-border border-b p-4">
          <ModelSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <ProviderToggle
            isRestrictedToOpenRouter={isRestrictedToOpenRouter}
            onRoutingChange={handleRoutingChange}
          />
        </div>

        {/* Content */}
        <div className="relative h-[50vh]">
          <div
            className="absolute inset-0 overflow-y-auto overscroll-contain pb-16"
            ref={scrollRef}
          >
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
          </div>

          <GradientOverlay isVisible={!isAtBottom} />

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {additionalModels.length > 0 && !shouldAutoExpand && (
              <ShowAllModelsButton
                additionalModelsCount={additionalModels.length}
                isShowingAllModels={isShowingAllModels}
                onToggle={handleToggleAllModels}
              />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <FilterControls
                selectedCapabilities={selectedCapabilities}
                onCapabilitiesChange={setSelectedCapabilities}
                availableCapabilities={availableCapabilities}
              />
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ProviderIcon };
