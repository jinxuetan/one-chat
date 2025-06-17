"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Search } from "lucide-react";

interface CommandPaletteButtonProps {
  onClick: () => void;
}

export const CommandPaletteButton = ({ onClick }: CommandPaletteButtonProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          size="sm"
          className="flex h-8 w-full items-center justify-between gap-2 border border-border/40 bg-muted/30 px-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-foreground dark:border-border/20 dark:bg-muted/10 dark:hover:bg-muted/20"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span className="text-sm">Search threads...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Open command palette</p>
      </TooltipContent>
    </Tooltip>
  );
}; 