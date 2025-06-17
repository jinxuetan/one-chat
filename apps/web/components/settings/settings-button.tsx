"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Bolt } from "lucide-react";
import { useState } from "react";
import { UserSettingsDialog } from "./user-settings-dialog";

export const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="rounded-[6px] text-muted-foreground transition-all duration-200 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-neutral-700"
            aria-label="Open settings"
          >
            <Bolt className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <UserSettingsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
