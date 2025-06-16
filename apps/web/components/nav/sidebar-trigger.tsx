"use client";

import { Button } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export const SidebarTrigger = () => {
  const { open, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-muted-foreground hover:text-foreground",
        !open && "hover:bg-accent dark:hover:bg-accent/60 rounded-[6px]",
        open && "hover:bg-accent dark:hover:bg-accent/60"
      )}
      onClick={toggleSidebar}
      aria-label={open ? "Close sidebar" : "Open sidebar"}
    >
      {open ? (
        <PanelLeftClose className="size-4.5" />
      ) : (
        <PanelLeftOpen className="size-4.5" />
      )}
    </Button>
  );
};
