import { Bug, Clock, Code, Globe } from "lucide-react";

const messages = [
  {
    text: "Why do I have 47 browser tabs open but can't find the one I need?",
    icon: Globe,
  },
  {
    text: "Is it just me or does everyone become a philosopher at 2 AM?",
    icon: Clock,
  },
  {
    text: "How do I look busy when my code is compiling?",
    icon: Code,
  },
  {
    text: "Why does my code work on my machine but nowhere else?",
    icon: Bug,
  },
];

interface EmptyMessageProps {
  username: string;
  onMessageClick: (message: string) => void;
}

export const EmptyMessage = ({
  username,
  onMessageClick,
}: EmptyMessageProps) => {
  return (
    <div className="flex h-full flex-col items-start justify-center px-4">
      {/* Header Section */}
      <div className="mb-6 md:mb-16 text-center">
        {/* Simplified Logo */}
        <div className="mb-6 flex justify-start">
          <div className="mb-4 grid size-16 place-items-center rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-xs dark:border-neutral-800/40 dark:from-neutral-800 dark:to-neutral-900">
            <div className="grid size-10 place-items-center rounded-full border-2 border-neutral-500 dark:border-neutral-100">
              <div className="size-7 rounded-full border-3 border-neutral-500 dark:border-neutral-100" />
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-left font-light text-4xl text-foreground tracking-tight">
          What's on your mind, {username}?
        </h1>
        <p className="mr-auto max-w-md text-lg text-start text-muted-foreground leading-relaxed">
          Start a conversation with our multi-modal AI assistant
        </p>
      </div>

      {/* Message Cards */}
      <div className="w-full max-w-2xl space-y-4">
        {messages.map((message, index: number) => {
          const IconComponent = message.icon;
          return (
            <button
              type="button"
              key={index}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 backdrop-blur-sm dark:border-neutral-800/40 dark:bg-neutral-900/20 w-full"
              onClick={() => onMessageClick(message.text)}
            >
              <IconComponent
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="text-md text-muted-foreground leading-relaxed">
                {message.text}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
