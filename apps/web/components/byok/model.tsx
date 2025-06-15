"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Key } from "lucide-react";
import { BYOK } from "./index";

export const BYOKModel = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="size-4" />
          Connect Models
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <BYOK />
      </DialogContent>
    </Dialog>
  );
};
