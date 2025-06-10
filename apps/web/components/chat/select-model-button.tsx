"use client";

import type { Model, ModelConfig, Provider } from "@/lib/ai/config";
import { getAvailableModels, getRecommendedModels } from "@/lib/ai/models";
import {
  Anthropic,
  DeepSeek,
  Google,
  Meta,
  OpenAI,
  Qwen,
  XAI,
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
  Grid3X3,
  Layers,
  List,
  Search,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

// Types
type ViewMode = "grid" | "list";
type FilterType = "all" | Provider;

interface SelectModelButtonProps {
  onSelect: (model: Model) => void;
  selectedModel?: Model;
  className?: string;
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
  coding: <Code className="size-4" />,
  multimodal: <Layers className="size-4" />,
} as const;

const PROVIDER_ICONS: Record<Provider, React.ReactNode> = {
  openai: <OpenAI className="size-5" />,
  anthropic: <Anthropic className="size-5" />,
  google: <Google className="size-5" />,
  xai: <XAI className="size-5" />,
  deepseek: <DeepSeek className="size-5" />,
  meta: <Meta className="size-5" />,
  openrouter: <Qwen className="size-5" />,
};

const TIER_CONFIG = {
  premium: {
    color:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <Sparkles className="size-2.5" />,
  },
  standard: {
    color:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Star className="size-2.5" />,
  },
  budget: {
    color:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-300",
    icon: <DollarSign className="size-2.5" />,
  },
} as const;

const CapabilityIcon = ({ capability }: { capability: string }) =>
  CAPABILITY_ICONS[capability as keyof typeof CAPABILITY_ICONS] || null;

const ProviderIcon = ({ provider }: { provider: Provider }) =>
  PROVIDER_ICONS[provider] || null;

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
          "group relative flex h-full cursor-pointer flex-col rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isSelected
            ? "border-ring bg-accent text-accent-foreground"
            : "border-border bg-card text-card-foreground hover:border-ring/50 hover:bg-accent/50"
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

        <div className="mt-auto flex flex-col gap-2">
          <TierBadge tier={model.tier} />
          <div className="flex items-center justify-start gap-1">
            {capabilities.slice(0, 4).map((capability) => (
              <Tooltip key={capability}>
                <TooltipTrigger asChild>
                  <div className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
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

        <div className="pt-2">
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
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isSelected
            ? "border-ring bg-accent text-accent-foreground"
            : "border-border bg-card text-card-foreground hover:border-ring/50 hover:bg-accent/50"
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
                <div className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
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
}: SelectModelButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [isShowingAllModels, setIsShowingAllModels] = useState(false);

  const filteredModels = useMemo(() => {
    let filteredModelList = allModels;

    if (selectedFilter !== "all") {
      filteredModelList = filteredModelList.filter(
        (model) => model.provider === selectedFilter
      );
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filteredModelList = filteredModelList.filter(
        (model) =>
          model.name.toLowerCase().includes(searchTerm) ||
          model.description.toLowerCase().includes(searchTerm) ||
          model.provider.toLowerCase().includes(searchTerm)
      );
    }

    return filteredModelList;
  }, [selectedFilter, searchQuery]);

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

  // Auto-expand if search query or filter would hide results
  const shouldAutoExpandAllModels = useMemo(() => {
    return searchQuery.length > 0 || selectedFilter !== "all";
  }, [searchQuery, selectedFilter]);

  const selectedModelConfig = useMemo(
    () =>
      selectedModel
        ? allModels.find(
            (model) => `${model.provider}:${model.id}` === selectedModel
          )
        : null,
    [selectedModel]
  );

  const handleSelect = useCallback(
    (model: Model) => {
      onSelect(model);
      setIsPopoverOpen(false);
      setSearchQuery("");
      setSelectedFilter("all");
      setIsShowingAllModels(false);
    },
    [onSelect]
  );

  const availableProviders: FilterType[] = useMemo(
    () =>
      [
        "all",
        ...Array.from(new Set(allModels.map((model) => model.provider))),
      ] as FilterType[],
    []
  );

  const getModelKey = (model: ModelConfig): Model => {
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
        >
          <span className="truncate">
            {selectedModelConfig?.name ? (
              <div className="flex items-center gap-2">
                <ProviderIcon provider={selectedModelConfig.provider} />
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
        className="w-[640px] rounded-lg p-0"
        align="start"
        sideOffset={8}
      >
        <div className="flex gap-2 border-border border-b p-4">
          <div className="relative w-full">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 transform text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] rounded-md pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-[38px] rounded-md"
                >
                  <Filter className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[200px] rounded-md p-1"
                align="start"
              >
                <div className="space-y-1">
                  {availableProviders.map((provider) => (
                    <Button
                      key={provider}
                      variant={
                        selectedFilter === provider ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="h-auto w-full justify-start rounded-sm px-2 py-1.5 text-xs"
                      onClick={() => setSelectedFilter(provider)}
                    >
                      <div className="flex items-center gap-2">
                        {provider === "all" ? (
                          <Layers className="size-4" />
                        ) : (
                          <ProviderIcon provider={provider} />
                        )}
                        <span>
                          {provider === "all"
                            ? "All Providers"
                            : provider.charAt(0).toUpperCase() +
                              provider.slice(1)}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
              <Button
                variant={viewMode === "grid" ? "outline" : "ghost"}
                size="icon"
                className="size-7 rounded-sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "outline" : "ghost"}
                size="icon"
                className="size-7 rounded-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredRecommendedModels.length > 0 && (
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Star className="size-4 text-yellow-500" />
                <h3 className="font-medium text-foreground text-sm">
                  Recommended
                </h3>
              </div>
              <div
                className={cn(
                  viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"
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
              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full border-border border-dashed font-medium text-muted-foreground text-sm transition-colors hover:border-ring/50 hover:bg-accent/50"
                  onClick={handleToggleAllModelsVisibility}
                >
                  <Layers className="mr-2 size-4" />
                  Show All Models ({additionalModels.length})
                </Button>
              </div>
            )}

          {additionalModels.length > 0 &&
            (isShowingAllModels || shouldAutoExpandAllModels) && (
              <>
                {filteredRecommendedModels.length > 0 && <Separator />}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-foreground text-sm">
                      All Models
                    </h3>
                    {!shouldAutoExpandAllModels && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
                        onClick={handleToggleAllModelsVisibility}
                      >
                        Hide
                      </Button>
                    )}
                  </div>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-2 gap-2"
                        : "space-y-2"
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
