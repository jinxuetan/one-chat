"use client";

import { Loader, Pin, PinOff, Split, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { usePinnedThreads } from "@/hooks/use-pinned-threads";
import type { ThreadListItem } from "@/lib/cache/thread-list-cache";
import { trpc } from "@/lib/trpc/client";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";

interface ThreadItemProps {
  thread: ThreadListItem;
}

export const ThreadItem = ({ thread }: ThreadItemProps) => {
  const router = useRouter();
  const params = useParams();
  const { isPinned, togglePin } = usePinnedThreads();
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = params.id === thread.id;

  const trpcUtils = trpc.useUtils();
  const pinned = isPinned(thread.id);

  const deleteThreadMutation = trpc.thread.deleteThread.useMutation({
    onMutate: async ({ threadId }) => {
      setIsDeleting(true);
      if (isActive) router.push("/");

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
              "rounded-lg transition-all duration-200 group-hover/item:bg-accent group-hover/item:text-accent-foreground dark:group-hover/item:bg-accent/60",
          }),
          "h-auto min-h-8 w-full justify-start gap-2 border border-transparent px-2 py-1.5 text-foreground",
          isActive &&
            "inset-shadow-xs border-border/60 bg-accent/50 text-accent-foreground dark:border-border/40 dark:bg-accent/30",
          isDeleting && "pointer-events-none opacity-50"
        )}
      >
        {pinned && <Pin className="size-3 shrink-0 text-muted-foreground" />}
        {thread.originThreadId && (
          <Split className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-ellipsis text-left">
          {thread.title}
        </span>
        {isCloningOrGenerating && (
          <div className="ml-auto flex items-center justify-center">
            <Loader className="size-3 shrink-0 animate-spin text-muted-foreground" />
          </div>
        )}
      </Link>

      {!isCloningOrGenerating && (
        <div className="-translate-y-1/2 absolute top-1/2 right-1 flex gap-1 rounded-md bg-accent opacity-0 transition-opacity group-hover/item:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="group/pin flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground dark:hover:bg-accent/60"
            onClick={handleTogglePin}
            title={pinned ? "Unpin thread" : "Pin thread"}
          >
            {pinned ? (
              <PinOff className="mt-[1.5px] size-3 transition-transform group-hover/pin:scale-110" />
            ) : (
              <Pin className="mt-[1.5px] size-3 transition-transform group-hover/pin:scale-110" />
            )}
            <span className="sr-only">
              {pinned ? "Unpin thread" : "Pin thread"}
            </span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="group/delete flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/5"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete thread"
          >
            <Trash2 className="size-3 transition-transform group-hover/delete:scale-110" />
            <span className="sr-only">Delete thread</span>
          </Button>
        </div>
      )}
    </div>
  );
};
