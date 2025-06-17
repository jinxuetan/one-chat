"use client";

import { useCommandPalette } from "@/hooks/use-command-palette";
import { Input } from "@workspace/ui/components/input";
import { SidebarContent as SidebarContentComponent } from "@workspace/ui/components/sidebar";
import { Search } from "lucide-react";
import { useState } from "react";
import { ThreadList } from "../thread/thread-list";
import { CommandPaletteButton } from "./command-palette-button";

export const SidebarContent = () => {
  const [filterQuery, setFilterQuery] = useState("");
  const { open } = useCommandPalette();

  return (
    <SidebarContentComponent className="bg-background/50 px-3 py-1 dark:bg-card/20">
      <div className="sticky top-0 z-10 space-y-3 border-border/30 border-b bg-background/95 pb-3 backdrop-blur-sm dark:border-border/20 dark:bg-card/80">
        <CommandPaletteButton onClick={open} />
        <Input
          placeholder="Filter current threads..."
          icon={Search}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="border-border bg-background text-foreground transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-border/80 dark:border-border/60 dark:bg-card/50 dark:focus-visible:border-border/80"
        />
      </div>
      <ThreadList search={filterQuery} />
    </SidebarContentComponent>
  );
};
