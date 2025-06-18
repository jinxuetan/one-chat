"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Box } from "lucide-react";
import { BYOK } from "./index";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";

export const BYOKModel = () => {
  const { open } = useSidebar();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Box className="size-4" />
          Manage Models
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-2xl overflow-y-auto",
          open && "left-[calc(50%+8rem)]"
        )}
      >
        <BYOK />
      </DialogContent>
    </Dialog>
  );
};
