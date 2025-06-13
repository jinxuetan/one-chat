"use client";

import { Loader, Pin, PinOff, Split, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { usePinnedThreads } from "@/hooks/use-pinned-threads";
import type { ThreadListItem } from "@/lib/cache/thread-list-cache";
import { trpc } from "@/lib/trpc/client";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";

interface ThreadItemProps {
  thread: ThreadListItem;
  isActive?: boolean;
}

export const ThreadItem = ({ thread, isActive = false }: ThreadItemProps) => {
  const router = useRouter();
  const { isPinned, togglePin } = usePinnedThreads();
  const [isDeleting, setIsDeleting] = useState(false);

  const trpcUtils = trpc.useUtils();
  const pinned = isPinned(thread.id);

  const deleteThreadMutation = trpc.thread.deleteThread.useMutation({
    onMutate: async ({ threadId }) => {
      setIsDeleting(true);

      await trpcUtils.thread.getUserThreads.cancel();

      const previousThreads = trpcUtils.thread.getUserThreads.getData();

      trpcUtils.thread.getUserThreads.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter((t) => t.id !== threadId);
      });

      return { previousThreads };
    },
    onError: (error, _variables, context) => {
      if (context?.previousThreads) {
        trpcUtils.thread.getUserThreads.setData(
          undefined,
          context.previousThreads
        );
      }
      toast.error(error.message || "Failed to delete thread");
      setIsDeleting(false);
    },
    onSuccess: () => {
      if (isActive) {
        router.push("/");
      }
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;

    deleteThreadMutation.mutate({ threadId: thread.id });
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    togglePin(thread.id);
  };

  const isCloningOrGenerating =
    thread.title === "Generating Title..." || thread.title === "Cloning...";

  return (
    <div className="group/item relative">
      <Link
        href={`/thread/${thread.id}`}
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "group-hover/item:bg-accent group-hover/item:text-accent-foreground dark:group-hover/item:bg-accent/50 rounded-lg",
          }),
          "border border-transparent w-full justify-start gap-2 px-2 py-1.5 h-auto min-h-8",
          isActive && "bg-secondary text-secondary-foreground border-secondary",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {pinned && <Pin className="size-3 text-muted-foreground shrink-0" />}
        {thread.originThreadId && (
          <Split className="size-3 text-muted-foreground shrink-0" />
        )}
        <span className="truncate text-left flex-1 text-ellipsis">
          {thread.title}
        </span>
        {isCloningOrGenerating && (
          <div className="ml-auto flex items-center justify-center">
            <Loader className="size-3 text-muted-foreground shrink-0 animate-spin" />
          </div>
        )}
      </Link>

      {!isCloningOrGenerating && (
        <div className="absolute right-1 bg-neutral-100 top-1/2  -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-6 flex items-center justify-center rounded-md shrink-0 group/pin hover:bg-accent"
            onClick={handleTogglePin}
            title={pinned ? "Unpin thread" : "Pin thread"}
          >
            {pinned ? (
              <PinOff className="size-3 group-hover/pin:scale-110 transition-transform" />
            ) : (
              <Pin className="size-3 group-hover/pin:scale-110 transition-transform" />
            )}
            <span className="sr-only">
              {pinned ? "Unpin thread" : "Pin thread"}
            </span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="size-6 flex items-center justify-center rounded-md shrink-0 text-destructive hover:text-destructive group/delete hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete thread"
          >
            <Trash2 className="size-3 group-hover/delete:scale-110 transition-transform" />
            <span className="sr-only">Delete thread</span>
          </Button>
        </div>
      )}
    </div>
  );
};
