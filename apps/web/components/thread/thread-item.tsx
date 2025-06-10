import { buttonVariants } from "@workspace/ui/components/button";
import Link from "next/link";

interface ThreadItemProps {
  thread: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const ThreadItem = ({ thread }: ThreadItemProps) => {
  return (
    <Link
      href={`/thread/${thread.id}`}
      className={buttonVariants({
        variant: "ghost",
        className: "flex items-center justify-start",
        size: "sm",
      })}
    >
      {thread.title}
    </Link>
  );
};
