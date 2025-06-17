"use client";

import { useCommandPalette } from "@/hooks/use-command-palette";
import { useEventListener } from "@/hooks/use-event-listener";
import { useRouter } from "next/navigation";
import { ThreadCommandDialog } from "./command-dialog";

export const CommandPalette = () => {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPalette();

  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      toggle();
      return;
    }

    if (!isOpen) return;

    if (event.key === "Escape") {
      close();
    } else if (
      event.key === "n" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const target = event.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
        router.push("/");
        close();
      }
    }
  });

  return (
    <ThreadCommandDialog open={isOpen} onOpenChange={toggle} onClose={close} />
  );
};
