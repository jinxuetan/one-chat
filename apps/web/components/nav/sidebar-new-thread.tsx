"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";

export const SidebarNewThread = () => {
  const { open } = useSidebar();
  if (open) return null;
  return (
    <Link
      href="/"
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent/60 !rounded-[6px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      })}
      aria-label="Start new chat"
    >
      <Plus className="size-4" />
    </Link>
  );
};
