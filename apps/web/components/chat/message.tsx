import { useMessageLogic } from "@/hooks/use-message-logic";
import type { Model } from "@/lib/ai";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@workspace/ui/lib/utils";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SVGProps } from "react";
import { MessageAttachments } from "./message-attachments";
import { MessagePartRenderer } from "./message-part-renderer";

interface MessageComponentProps {
  threadId: string;
  message: MessageWithMetadata;
  resolvedMessageModel: Model;
  isLoading: boolean;
  // TODO: Remove this once we have a better way to handle this
  isPending: boolean;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isLastMessage: boolean;
}

export const Message = ({
  threadId,
  message,
  resolvedMessageModel,
  isLoading,
  isPending,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: MessageComponentProps) => {
  const {
    displayMode,
    setDisplayMode,
    sources,
    isBranchingThread,
    isReloading,
    handleMessageReload,
    handleThreadBranchOut,
    handleTextCopy,
  } = useMessageLogic({
    threadId,
    message,
    setMessages,
    reload,
    messageModel: resolvedMessageModel,
  });

  return (
    <AnimatePresence>
      <motion.div
        className="mx-auto w-full max-w-3xl px-4"
        initial={{ y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "group/message flex w-full gap-3 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-3xl",
            {
              "w-full": displayMode === "edit",
              "group-data-[role=user]/message:w-fit": displayMode !== "edit",
              "ml-auto": message.role === "user",
            }
          )}
        >
          <div
            className={cn("flex w-full flex-col gap-4", {
              "min-h-[24rem]":
                message.role === "assistant" &&
                requiresScrollPadding &&
                !isPending,
            })}
          >
            <MessageAttachments
              attachments={message.experimental_attachments || []}
            />

            <MessagePartRenderer
              message={message}
              model={resolvedMessageModel}
              sources={sources}
              displayMode={displayMode}
              isReadonly={isReadonly}
              isLoading={isLoading}
              onModeChange={setDisplayMode}
              onReload={handleMessageReload}
              onBranchOut={handleThreadBranchOut}
              onCopy={handleTextCopy}
              setMessages={setMessages}
              reload={reload}
              isReloading={isReloading}
              isBranching={isBranchingThread}
              threadId={threadId}
            />

            {message.isErrored && (
              <div className="flex w-fit items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">
                <AlertTriangle className="size-4" />
                <p>Error: {message.errorMessage || "Unknown error"}</p>
              </div>
            )}

            {message.isStopped && (
              <div className="flex w-fit items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">
                <AlertTriangle className="size-4" />
                <p>Stopped</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const LoadingBarsIcon = ({
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...props}
  >
    <title>Loading...</title>
    <style>{`
      .spinner-bar {
        animation: spinner-bars-animation .8s linear infinite;
        animation-delay: -.8s;
      }
      .spinner-bars-2 {
        animation-delay: -.65s;
      }
      .spinner-bars-3 {
        animation-delay: -0.5s;
      }
      @keyframes spinner-bars-animation {
        0% {
          y: 1px;
          height: 22px;
        }
        93.75% {
          y: 5px;
          height: 14px;
          opacity: 0.2;
        }
      }
    `}</style>
    <rect
      className="spinner-bar"
      x="1"
      y="1"
      width="6"
      height="22"
      fill="currentColor"
    />
    <rect
      className="spinner-bar spinner-bars-2"
      x="9"
      y="1"
      width="6"
      height="22"
      fill="currentColor"
    />
    <rect
      className="spinner-bar spinner-bars-3"
      x="17"
      y="1"
      width="6"
      height="22"
      fill="currentColor"
    />
  </svg>
);

export const ThinkingMessage = () => (
  <motion.div
    className="group/message mx-auto w-full max-w-3xl px-3"
    initial={{ y: 4, opacity: 0 }}
    animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
    data-role="assistant"
  >
    <div
      className={cn(
        "flex w-full gap-3 rounded-xl group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-3xl group-data-[role=user]/message:px-3 group-data-[role=user]/message:py-2",
        {
          "group-data-[role=user]/message:bg-muted": true,
        }
      )}
    >
      <LoadingBarsIcon size={24} />
    </div>
  </motion.div>
);
