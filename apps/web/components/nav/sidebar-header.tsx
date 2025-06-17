"use client";

import { useCommandPalette } from "@/hooks/use-command-palette";
import { Button } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Search } from "lucide-react";
import { SidebarNewThread } from "./sidebar-new-thread";
import { SidebarTrigger } from "./sidebar-trigger";

export const SidebarActions = () => {
  const { open: sidebarOpen } = useSidebar();
  const { open } = useCommandPalette();

  return (
    <div
      className={cn(
        "pointer-events-auto fixed top-2.5 left-2 z-50 flex flex-row gap-0.5 border border-transparent p-1 transition-all duration-200",
        {
          "rounded-md border-border/50 bg-background/95 shadow-sm backdrop-blur-sm dark:border-border/30 dark:bg-card/90 dark:shadow-md":
            !sidebarOpen,
        }
      )}
    >
      <SidebarTrigger />
      <SidebarNewThread />
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={open}
          className="!rounded-[6px] text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-accent/60"
          aria-label="Search threads"
        >
          <Search className="size-4" />
        </Button>
      )}
    </div>
  );
};
