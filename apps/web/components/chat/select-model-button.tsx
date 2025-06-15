"use client";

import type { Model, ModelConfig, Provider } from "@/lib/ai/config";
import { getAvailableModels, getRecommendedModels } from "@/lib/ai/models";
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
  Package,
  Search,
  Settings2,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

// Types
type ViewMode = "grid" | "list";
type CapabilityFilter = Exclude<keyof typeof CAPABILITY_ICONS, "tools">;

interface SelectModelButtonProps {
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
}

// Constants
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

const CapabilityIcon = ({ capability }: { capability: string }) => {
  return CAPABILITY_ICONS[capability as keyof typeof CAPABILITY_ICONS] ?? null;
};

export const ProviderIcon = ({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) => {
  const Icon = PROVIDER_ICONS[provider];
  return Icon ? <Icon className={cn("size-5", className)} /> : null;
};

const TierBadge = ({ tier }: { tier: string }) => {
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
};

const ModelCard = memo(
  ({ model, modelKey, isSelected, onSelect }: ModelComponentProps) => {
    const capabilities = useMemo(
      () =>
        Object.entries(model.capabilities)
          .filter(([, value]) => value === true)
          .filter(([key]) => key !== "effort")
          .map(([key]) => key),
      [model.capabilities]
    );

    return (
      <button
        type="button"
        className={cn(
          "group relative flex h-full cursor-pointer flex-col rounded-md border p-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-400",
          isSelected
            ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            : "border-neutral-200 bg-transparent hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(modelKey);
          }
        }}
        onClick={() => onSelect(modelKey)}
        aria-label={`Select model ${model.name}`}
      >
        <div className="flex items-start justify-between gap-2 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex-shrink-0">
              <ProviderIcon provider={model.provider} />
            </div>
            <h4 className="flex-1 truncate font-semibold text-foreground text-sm">
              {model.name}
            </h4>
          </div>
          <div className="size-4 flex-shrink-0">
            {isSelected && <CheckCircle2 className="size-full text-ring" />}
          </div>
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
  ({ model, modelKey, isSelected, onSelect }: ModelComponentProps) => {
    const capabilities = useMemo(
      () =>
        Object.entries(model.capabilities)
          .filter(([, value]) => value === true)
          .filter(([key]) => key !== "effort")
          .map(([key]) => key),
      [model.capabilities]
    );

    return (
      <button
        type="button"
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-md border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-400",
          isSelected
            ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            : "border-neutral-200 bg-transparent hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(modelKey);
          }
        }}
        onClick={() => onSelect(modelKey)}
        aria-label={`Select model ${model.name}`}
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

const allModels = getAvailableModels();
const recommendedModelIds = new Set(getRecommendedModels().map((m) => m.id));

export const SelectModelButton = ({
  onSelect,
  selectedModel,
  className,
  isRestrictedToOpenRouter,
  onIsRestrictedToOpenRouterChange,
  disabled = false,
}: SelectModelButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    CapabilityFilter[]
  >([]);
  const [isShowingAllModels, setIsShowingAllModels] = useState(false);

  const filteredModels = useMemo(() => {
    let filteredModelList = allModels;

    // Filter by selected capabilities (OR logic - model must have ANY of the selected capabilities)
    if (selectedCapabilities.length > 0) {
      filteredModelList = filteredModelList.filter((model) =>
        selectedCapabilities.some(
          (capability) => (model.capabilities as any)[capability] === true
        )
      );
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filteredModelList = filteredModelList.filter(
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

    return filteredModelList;
  }, [selectedCapabilities, searchQuery]);

  const { filteredRecommendedModels, additionalModels } = useMemo(() => {
    const recommendedModels = filteredModels.filter((model) =>
      recommendedModelIds.has(model.id)
    );
    const nonRecommendedModels = filteredModels.filter(
      (model) => !recommendedModelIds.has(model.id)
    );
    return {
      filteredRecommendedModels: recommendedModels,
      additionalModels: nonRecommendedModels,
    };
  }, [filteredModels]);

  // Auto-expand if search query or capabilities filter would hide results
  const shouldAutoExpandAllModels = useMemo(() => {
    return searchQuery.length > 0 || selectedCapabilities.length > 0;
  }, [searchQuery, selectedCapabilities]);

  const selectedModelConfig = useMemo(
    () =>
      selectedModel
        ? allModels.find(
            (model) =>
              `${model.apiProvider || model.provider}:${model.id}` ===
              selectedModel
          )
        : null,
    [selectedModel]
  );

  const handleSelect = useCallback(
    (model: Model) => {
      onSelect(model);
      setIsPopoverOpen(false);
      setSearchQuery("");
      setSelectedCapabilities([]);
      setIsShowingAllModels(false);
    },
    [onSelect]
  );

  const availableCapabilities: CapabilityFilter[] = useMemo(() => {
    const capabilities = new Set<CapabilityFilter>();
    allModels.forEach((model) => {
      Object.entries(model.capabilities).forEach(([key, value]) => {
        if (value === true && key !== "tools" && key in CAPABILITY_ICONS) {
          capabilities.add(key as CapabilityFilter);
        }
      });
    });
    return Array.from(capabilities);
  }, []);

  const getModelKey = (model: ModelConfig): Model => {
    if (model.apiProvider) {
      return `${model.apiProvider}:${model.id}` as Model;
    }
    return `${model.provider}:${model.id}` as Model;
  };

  const handleToggleAllModelsVisibility = useCallback(() => {
    setIsShowingAllModels((previousState: boolean) => !previousState);
  }, []);

  const handlePopoverOpenChange = useCallback((isOpen: boolean) => {
    setIsPopoverOpen(isOpen);
    if (!isOpen) {
      setIsShowingAllModels(false);
    }
  }, []);

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
        className="min-h-[50vh] w-[540px] rounded-lg p-0"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-2 border-border border-b p-3">
          <div className="flex gap-2">
            <div className="relative w-full">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 transform text-muted-foreground" />
              <Input
                placeholder="Search models and capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-md border-border bg-muted/50 pl-9 transition-all duration-150 ease-out focus:bg-background"
              />
            </div>

            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-md border border-border transition-all duration-150 ease-out",
                      selectedCapabilities.length > 0
                        ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-800"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    )}
                  >
                    <Filter className="size-4" />
                    {selectedCapabilities.length > 0 && (
                      <div className="-top-1 -right-1 absolute flex size-4 items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-800 text-xs dark:bg-neutral-800 dark:text-neutral-200">
                        {selectedCapabilities.length}
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[200px] rounded-md p-1"
                  align="start"
                >
                  <div className="space-y-0.5">
                    {selectedCapabilities.length > 0 && (
                      <button
                        type="button"
                        className="flex h-auto w-full items-center justify-center gap-2 rounded-sm bg-muted/50 px-2 py-1.5 text-muted-foreground text-xs transition-all duration-150 ease-out hover:bg-muted hover:text-foreground"
                        onClick={() => setSelectedCapabilities([])}
                      >
                        Clear Filters ({selectedCapabilities.length})
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {availableCapabilities.map((capability) => {
                      const isSelected =
                        selectedCapabilities.includes(capability);
                      const label =
                        capability.charAt(0).toUpperCase() +
                        capability.slice(1);
                      return (
                        <button
                          key={capability}
                          type="button"
                          className={cn(
                            "flex h-auto w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-all duration-150 ease-out",
                            isSelected
                              ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-800"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                          onClick={() => {
                            setSelectedCapabilities((prev) =>
                              isSelected
                                ? prev.filter((c) => c !== capability)
                                : [...prev, capability]
                            );
                          }}
                        >
                          <CapabilityIcon capability={capability} />
                          <span className="flex-1 text-left">
                            {label === "NativeSearch" ? "Native Search" : label}
                          </span>
                          <div
                            className={cn(
                              "flex size-4 items-center justify-center rounded-sm border transition-all duration-150",
                              isSelected
                                ? "border-transparent bg-transparent"
                                : "border-current"
                            )}
                          >
                            {isSelected && (
                              <CheckCircle2 className="size-3.5 text-current" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex items-center overflow-hidden rounded-md border border-border bg-muted/50">
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center p-2 transition-all duration-150 ease-out",
                    viewMode === "grid"
                      ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-800"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center p-2 transition-all duration-150 ease-out",
                    viewMode === "list"
                      ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-800"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Provider Mode Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Package className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm">
                Provider
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-full items-center overflow-hidden rounded-md border border-border bg-muted/30">
                  <button
                    type="button"
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-3 py-1.5 font-medium text-xs transition-all duration-150 ease-out",
                      isRestrictedToOpenRouter
                        ? "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                        : "bg-background text-foreground shadow-sm"
                    )}
                    onClick={() => onIsRestrictedToOpenRouterChange(false)}
                  >
                    <Globe className="size-3.5" />
                    <span>Auto (Native)</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-3 py-1.5 font-medium text-xs transition-all duration-150 ease-out",
                      isRestrictedToOpenRouter
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    )}
                    onClick={() => onIsRestrictedToOpenRouterChange(true)}
                  >
                    <Globe2 className="size-3.5" />
                    <span>OpenRouter</span>
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {isRestrictedToOpenRouter
                    ? "Route all models through OpenRouter API"
                    : "Automatically route to native provider APIs"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
          {filteredRecommendedModels.length > 0 && (
            <div className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Star className="size-3.5 text-yellow-400" />
                <h3 className="font-medium text-foreground text-sm">
                  Recommended
                </h3>
              </div>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-1.5"
                    : "space-y-1.5"
                )}
              >
                {filteredRecommendedModels.map((model) => {
                  const modelKey = getModelKey(model);
                  const Component =
                    viewMode === "grid" ? ModelCard : ModelListItem;
                  return (
                    <Component
                      key={modelKey}
                      model={model}
                      modelKey={modelKey}
                      isSelected={selectedModel === modelKey}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {additionalModels.length > 0 &&
            !isShowingAllModels &&
            !shouldAutoExpandAllModels && (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border border-dashed bg-muted/30 font-medium text-muted-foreground text-sm transition-all duration-150 ease-out hover:border-border/80 hover:bg-muted/50 hover:text-foreground"
                  onClick={handleToggleAllModelsVisibility}
                >
                  <Layers className="size-4" />
                  Show All Models ({additionalModels.length})
                </button>
              </div>
            )}

          {additionalModels.length > 0 &&
            (isShowingAllModels || shouldAutoExpandAllModels) && (
              <>
                {filteredRecommendedModels.length > 0 && <Separator />}
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-foreground text-sm">
                      All Models
                    </h3>
                    {!shouldAutoExpandAllModels && (
                      <button
                        type="button"
                        className="h-6 px-2 text-muted-foreground text-xs transition-all duration-150 ease-out hover:text-foreground"
                        onClick={handleToggleAllModelsVisibility}
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-2 gap-1.5"
                        : "space-y-1.5"
                    )}
                  >
                    {additionalModels.map((model) => {
                      const modelKey = getModelKey(model);
                      const Component =
                        viewMode === "grid" ? ModelCard : ModelListItem;
                      return (
                        <Component
                          key={modelKey}
                          model={model}
                          modelKey={modelKey}
                          isSelected={selectedModel === modelKey}
                          onSelect={handleSelect}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
