import { Toggle } from "@workspace/ui/components/toggle";
import { Globe2 } from "lucide-react";

interface SearchButtonProps {
  isSearchActive: boolean;
  onSearchActiveChange: (isSearchActive: boolean) => void;
}

export const SearchButton = ({
  isSearchActive,
  onSearchActiveChange,
}: SearchButtonProps) => (
  <Toggle
    variant="outline"
    size="sm"
    type="button"
    className="w-fit bg-white dark:bg-neutral-900"
    pressed={isSearchActive}
    onClick={() => onSearchActiveChange(!isSearchActive)}
  >
    <Globe2 className="size-4" />
    <span>Search</span>
  </Toggle>
);
