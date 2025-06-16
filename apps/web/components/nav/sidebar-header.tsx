"use client";

import { useSidebar } from "@workspace/ui/components/sidebar";
import { SidebarNewThread } from "./sidebar-new-thread";
import { SidebarTrigger } from "./sidebar-trigger";
import { cn } from "@workspace/ui/lib/utils";

export const SidebarActions = () => {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "pointer-events-auto fixed left-2 top-2.5 z-50 flex flex-row gap-0.5 p-1 border border-transparent transition-all duration-200",
        {
          "bg-background/95 dark:bg-card/90 backdrop-blur-sm border-border/50 dark:border-border/30 rounded-md shadow-sm dark:shadow-md": !open,
        }
      )}
    >
      <SidebarTrigger />
      <SidebarNewThread />
    </div>
  );
};
