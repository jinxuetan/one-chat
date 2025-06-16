import { useApiKeys } from "@/hooks/use-api-keys";
import { getRoutingFromCookie } from "@/lib/utils/cookie";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Globe2, OctagonAlert, Search } from "lucide-react";
import { useState } from "react";

export type SearchMode = "off" | "native" | "tool";

interface SearchButtonProps {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  supportsNativeSearch?: boolean;
  disabled?: boolean;
}

const SEARCH_CONFIG = {
  off: {
    label: "Search Off",
    description: "No search enabled",
    icon: Search,
  },
  native: {
    label: "Native Search",
    description: "Model's built-in search",
    icon: Globe2,
  },
  tool: {
    label: "Web Search",
    description: "External web search",
    icon: Globe2,
  },
} as const;

export const SearchButton = ({
  searchMode,
  onSearchModeChange,
  supportsNativeSearch = false,
  disabled = false,
}: SearchButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { keys } = useApiKeys();
  
  // Check if native search requirements are met
  const hasGoogleKey = Boolean(keys.google);
  const isAutoRouting = getRoutingFromCookie() !== true; // true means OpenRouter only, false/null means Auto
  const canUseNativeSearch = hasGoogleKey && isAutoRouting;

  const handleSearchModeSelect = (newMode: SearchMode) => {
    // Prevent selecting native search if requirements aren't met
    if (newMode === "native" && !canUseNativeSearch) {
      return;
    }
    
    // If currently on native search and requirements are no longer met, switch to off
    if (searchMode === "native" && !canUseNativeSearch) {
      onSearchModeChange("off");
      setIsPopoverOpen(false);
      return;
    }
    
    onSearchModeChange(newMode);
    setIsPopoverOpen(false);
  };

  const availableModes = supportsNativeSearch 
    ? (["off", "native", "tool"] as const)
    : (["off", "tool"] as const);

  const currentConfig = SEARCH_CONFIG[searchMode];
  const CurrentIcon = currentConfig.icon;

  const getNativeSearchTooltip = () => {
    if (!hasGoogleKey && !isAutoRouting) {
      return "Native search requires Google API Key configured and routing set to Auto Mode";
    }
    if (!hasGoogleKey) {
      return "Native search requires Google API Key configured";
    }
    if (!isAutoRouting) {
      return "Native search requires routing set to Auto Mode";
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 px-2.5"
            disabled={disabled}
          >
            <CurrentIcon className="size-3.5 text-foreground" />
            <span className="font-medium text-foreground">
              {searchMode === "off" ? "Search" : currentConfig.label}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 p-1" align="start" sideOffset={6}>
          <div className="space-y-px">
            {availableModes.map((mode) => {
              const config = SEARCH_CONFIG[mode];
              const IconComponent = config.icon;
              const isNativeMode = mode === "native";
              const isDisabled = isNativeMode && !canUseNativeSearch;
              const tooltipContent = isNativeMode ? getNativeSearchTooltip() : null;

              const buttonContent = (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isDisabled && searchMode === mode
                      ? "bg-accent text-accent-foreground"
                      : !isDisabled && "text-foreground hover:bg-accent/60 hover:text-accent-foreground"
                  )}
                  onClick={() => handleSearchModeSelect(mode)}
                  disabled={disabled || isDisabled}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <IconComponent className="size-3.5 shrink-0 text-current" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                  </div>
                  {isDisabled && (
                    <OctagonAlert className="size-3.5 shrink-0 text-yellow-500" />
                  )}
                </button>
              );

              if (tooltipContent) {
                return (
                  <Tooltip key={mode}>
                    <TooltipTrigger asChild>
                      {buttonContent}
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      {tooltipContent}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
