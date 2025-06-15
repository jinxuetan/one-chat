"use client";

import { Input } from "@workspace/ui/components/input";
import { SidebarContent as SidebarContentComponent } from "@workspace/ui/components/sidebar";
import { Search } from "lucide-react";
import { useState } from "react";
import { ThreadList } from "../thread/thread-list";

export const SidebarContent = () => {
  const [input, setInput] = useState("");

  return (
    <SidebarContentComponent className="px-3 py-1">
      <div className="sticky top-0 z-10 bg-background">
        <Input
          placeholder="Search your threads..."
          icon={Search}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <ThreadList search={input} />
    </SidebarContentComponent>
  );
};
