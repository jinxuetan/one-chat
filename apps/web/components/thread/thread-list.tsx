import { ThreadItem } from "./thread-item";

interface ThreadListProps {
  search: string;
}

export const ThreadList = ({ search }: ThreadListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {[
        {
          id: "1",
          title: "Thread 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ].map((thread) => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
};
