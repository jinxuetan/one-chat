import { Toggle } from "@workspace/ui/components/toggle";
import { ChevronRight, Globe2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export type SearchMode = "off" | "native" | "tool";

interface SearchButtonProps {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  supportsNativeSearch?: boolean;
  disabled?: boolean;
}

export const SearchButton = ({
  searchMode,
  onSearchModeChange,
  supportsNativeSearch = false,
  disabled = false,
}: SearchButtonProps) => {
  const handleClick = () => {
    if (disabled) return;
    if (supportsNativeSearch) {
      // Cycle through: off -> native -> tool -> off
      switch (searchMode) {
        case "off":
          onSearchModeChange("native");
          break;
        case "native":
          onSearchModeChange("tool");
          break;
        case "tool":
          onSearchModeChange("off");
          break;
      }
    } else {
      // Cycle through: off -> tool -> off
      switch (searchMode) {
        case "off":
          onSearchModeChange("tool");
          break;
        case "tool":
          onSearchModeChange("off");
          break;
        default:
          onSearchModeChange("off");
          break;
      }
    }
  };

  const getDisplayText = () => {
    switch (searchMode) {
      case "native":
        return "Native Search";
      case "tool":
        return "Search";
      default:
        return "Search";
    }
  };

  const getSearchModeInfo = () => {
    switch (searchMode) {
      case "native":
        return {
          variant: "default" as const,
          className: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900"
        };
      case "tool":
        return {
          variant: "default" as const,
          className: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900"
        };
      default:
        return {
          variant: "outline" as const,
          className: "bg-background dark:bg-card hover:bg-accent dark:hover:bg-accent/80 border-border dark:border-border/60"
        };
    }
  };

  const modeInfo = getSearchModeInfo();

  return (
    <Toggle
      variant={modeInfo.variant}
      size="sm"
      type="button"
      className={cn(
        "w-fit gap-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        modeInfo.className
      )}
      pressed={searchMode !== "off"}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Toggle ${getDisplayText()}`}
    >
      <Globe2 className="size-4" />
      <span>{getDisplayText()}</span>
      {supportsNativeSearch && (
        <ChevronRight className={cn(
          "size-3 transition-transform duration-200",
          searchMode !== "off" && "rotate-90"
        )} />
      )}
    </Toggle>
  );
};
