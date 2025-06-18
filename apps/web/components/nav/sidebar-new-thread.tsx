"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export const SidebarNewThread = () => {
  const { open } = useSidebar();
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/");
    router.refresh();
  };

  if (open) return null;
  
  return (
    <button
      onClick={handleNewChat}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className:
          "!rounded-[6px] text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-accent/60",
      })}
      aria-label="Start new chat"
    >
      <Plus className="size-4" />
    </button>
  );
};
