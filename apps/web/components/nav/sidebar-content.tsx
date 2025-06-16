"use client";

import { Input } from "@workspace/ui/components/input";
import { SidebarContent as SidebarContentComponent } from "@workspace/ui/components/sidebar";
import { Search } from "lucide-react";
import { useState } from "react";
import { ThreadList } from "../thread/thread-list";

export const SidebarContent = () => {
  const [input, setInput] = useState("");

  return (
    <SidebarContentComponent className="px-3 py-1 bg-background/50 dark:bg-card/20">
      <div className="sticky top-0 z-10 bg-background/95 dark:bg-card/80 backdrop-blur-sm border-border/30 dark:border-border/20 border-b pb-3">
        <Input
          placeholder="Search your threads..."
          icon={Search}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-background dark:bg-card/50 border-border dark:border-border/60 focus-visible:border-border/80 dark:focus-visible:border-border/80 text-foreground placeholder:text-muted-foreground transition-all duration-200"
        />
      </div>
      <ThreadList search={input} />
    </SidebarContentComponent>
  );
};
