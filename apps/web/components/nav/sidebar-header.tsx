"use client";

import { useSidebar } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { SidebarNewThread } from "./sidebar-new-thread";
import { SidebarTrigger } from "./sidebar-trigger";

export const SidebarActions = () => {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "pointer-events-auto fixed top-2.5 left-2 z-50 flex flex-row gap-0.5 border border-transparent p-1 transition-all duration-200",
        {
          "rounded-md border-border/50 bg-background/95 shadow-sm backdrop-blur-sm dark:border-border/30 dark:bg-card/90 dark:shadow-md":
            !open,
        }
      )}
    >
      <SidebarTrigger />
      <SidebarNewThread />
    </div>
  );
};
