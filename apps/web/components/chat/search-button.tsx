import { Toggle } from "@workspace/ui/components/toggle";
import { ChevronRight, Globe2 } from "lucide-react";

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

  return (
    <Toggle
      variant="outline"
      size="sm"
      type="button"
      className="w-fit gap-2 bg-white dark:bg-neutral-900"
      pressed={searchMode !== "off"}
      onClick={handleClick}
      disabled={disabled}
    >
      <Globe2 className="size-4" />
      <span>{getDisplayText()}</span>
      {supportsNativeSearch && <ChevronRight className="size-3" />}
    </Toggle>
  );
};
