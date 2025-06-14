import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getModelByKey, Model } from "@/lib/ai";
import { useSession } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { generateUUID, resolveModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PencilIcon,
  RotateCcwIcon,
  Split,
  VideoIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AIResponse } from "./ai-response";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { MessageSources } from "./message-sources";
import { ProviderIcon } from "./select-model-button";

interface MessageComponentProps {
  threadId: string;
  message: MessageWithMetadata;
  isLoading: boolean;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isLastMessage: boolean;
}

export const Message = ({
  threadId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: MessageComponentProps) => {
  const router = useRouter();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [displayMode, setDisplayMode] = useState<"view" | "edit">("view");
  const [isBranchingThread, setIsBranchingThread] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const trpcUtils = trpc.useUtils();
  const deleteMessageAndTrailingMutation =
    trpc.thread.deleteMessageAndTrailing.useMutation();
  const branchOutMutation = trpc.thread.branchOut.useMutation({
    onMutate: async ({ originalThreadId, newThreadId }) => {
      setIsBranchingThread(true);
      await trpcUtils.thread.getUserThreads.cancel();
      const previousThreads = trpcUtils.thread.getUserThreads.getData();
      if (!session?.user?.id) return { previousThreads };
      // Optimistically add the new thread
      trpcUtils.thread.getUserThreads.setData(undefined, (old) => {
        if (!old) return old;
        const optimisticThread = {
          id: newThreadId,
          title: "Cloning...",
          userId: session.user.id,
          originThreadId: originalThreadId ?? null,
          visibility: "private" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString() as string | null,
        };
        return [optimisticThread, ...old];
      });
      return { previousThreads };
    },
    onSuccess: (data) => router.push(`/thread/${data.newThreadId}`),
    onError: (error, _vars, context) => {
      if (context?.previousThreads) {
        trpcUtils.thread.getUserThreads.setData(
          undefined,
          context.previousThreads
        );
      }
      console.error("Failed to branch out:", error);
      const errorMessage = error.message.includes("Unauthorized")
        ? "You don't have permission to branch this thread"
        : error.message.includes("not found")
        ? "Message or thread not found"
        : "Failed to branch out. Please try again.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsBranchingThread(false);
      queryClient.invalidateQueries({ queryKey: ["thread-list"] });
      trpcUtils.thread.getUserThreads.invalidate();
    },
  });

  const resolvedModel = resolveModel(message);

  const messageModelConfig = useMemo(
    () =>
      message.role === "assistant" &&
      resolvedModel &&
      getModelByKey(resolvedModel),
    [message.annotations]
  );

  const handleMessageReload = useCallback(async () => {
    try {
      setMessages((messages) => {
        const currentIndex = messages.findIndex((m) => m.id === message.id);
        if (currentIndex === -1) return messages;

        // For user messages: delete from next message, for assistant: delete from current
        const deleteFromIndex =
          message.role === "user" ? currentIndex + 1 : currentIndex;
        const targetMessage = messages[deleteFromIndex];

        if (!targetMessage) return messages;

        // Delete from database
        deleteMessageAndTrailingMutation.mutate({
          messageId: targetMessage.id,
        });

        // Update local state
        return messages.slice(0, deleteFromIndex);
      });
      await reload();
    } catch (error) {
      console.error("Failed to reload from message:", error);
    }
  }, [deleteMessageAndTrailingMutation, message.id, message.role, setMessages]);

  const handleThreadBranchOut = useCallback(async () => {
    const newThreadId = generateUUID();
    branchOutMutation.mutate({
      messageId: message.id,
      originalThreadId: threadId,
      newThreadId,
    });
    // Optimistically navigate immediately
    router.push(`/thread/${newThreadId}?branch=true`);
  }, [branchOutMutation, message.id, threadId, router]);

  const toggleEditMode = useCallback(() => {
    setDisplayMode((currentMode) => (currentMode === "view" ? "edit" : "view"));
  }, []);

  const handleTextCopy = useCallback(
    async (textContent: string) => {
      await copyToClipboard(textContent);
    },
    [copyToClipboard]
  );

  useEffect(() => {
    return () => {
      if (isBranchingThread) setIsBranchingThread(false);
    };
  }, [isBranchingThread]);

  // Extract sources from message parts
  const sources = useMemo(() => {
    return (
      message.parts
        ?.filter((part) => part.type === "source")
        ?.map((part: any) => part.source) || []
    );
  }, [message.parts]);

  return (
    <AnimatePresence>
      <motion.div
        className="mx-auto w-full max-w-3xl px-3"
        initial={{ y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "group/message flex w-fit gap-3 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-3xl",
            {
              "w-full": displayMode === "edit",
              "group-data-[role=user]/message:w-fit": displayMode !== "edit",
              "ml-auto": message.role === "user",
              "mr-auto": message.role === "assistant",
            }
          )}
        >
          <div
            className={cn("flex w-full flex-col gap-4", {
              "min-h-[24rem]":
                message.role === "assistant" && requiresScrollPadding,
            })}
          >
            <div className="flex flex-col gap-2 justify-center items-end">
              {message.experimental_attachments?.map((attachment) => {
                const isImage = attachment.contentType?.startsWith("image/");
                const isVideo = attachment.contentType?.startsWith("video/");
                const isText = attachment.contentType?.startsWith("text/");

                const Icon = isImage
                  ? ImageIcon
                  : isVideo
                  ? VideoIcon
                  : isText
                  ? FileTextIcon
                  : FileIcon;

                const fileName =
                  (attachment.name?.split(".").at(0) ?? "File").substring(
                    0,
                    20
                  ) + "...";
                const fileExtension =
                  attachment.name?.split(".").at(1) ?? "txt";

                return (
                  <div
                    key={attachment.url}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/50 px-2 py-1 text-sm hover:bg-muted transition-colors"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <Link
                      href={attachment.url}
                      className="font-medium hover:underline truncate"
                      target="_blank"
                    >
                      {fileName}.{fileExtension}
                    </Link>
                  </div>
                );
              })}
            </div>

            {message.parts?.map((messagePart, partIndex) => {
              const partKey = `message-${message.id}-part-${partIndex}`;

              if (messagePart.type === "reasoning") {
                return (
                  <MessageReasoning
                    key={partKey}
                    isLoading={isLoading}
                    reasoning={messagePart.reasoning}
                  />
                );
              }

              if (messagePart.type === "source") {
                // Sources are handled separately, skip individual source parts
                return null;
              }

              if (messagePart.type === "text") {
                return (
                  <div
                    key={partKey}
                    className={cn("group relative mb-12 gap-2 w-fit", {
                      "ml-auto": message.role === "user",
                      "mr-auto": message.role === "assistant",
                    })}
                  >
                    <div className="flex w-full flex-col gap-3">
                      {displayMode === "view" ? (
                        <div
                          className={cn("flex w-full flex-col gap-3", {
                            "rounded-xl bg-primary px-3 py-2":
                              message.role === "user",
                          })}
                        >
                          <AIResponse
                            className={cn({
                              "text-primary-foreground":
                                message.role === "user",
                            })}
                          >
                            {messagePart.text}
                          </AIResponse>
                        </div>
                      ) : (
                        <MessageEditor
                          key={message.id}
                          message={message}
                          setMode={setDisplayMode}
                          setMessages={setMessages}
                          reload={reload}
                        />
                      )}

                      {sources.length > 0 && (
                        <MessageSources sources={sources} />
                      )}
                    </div>

                    {!isReadonly && (
                      <div
                        className={cn(
                          "absolute mt-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100",
                          {
                            "right-0": message.role === "user",
                            "left-0": message.role === "assistant",
                          }
                        )}
                      >
                        {messageModelConfig && (
                          <div className="mr-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 flex items-center">
                            <ProviderIcon
                              provider={messageModelConfig.provider}
                              className="size-3"
                            />
                            <span className="ml-1">
                              {messageModelConfig.name}
                            </span>
                          </div>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="group/edit"
                              onClick={handleMessageReload}
                              disabled={
                                deleteMessageAndTrailingMutation.isPending
                              }
                            >
                              <RotateCcwIcon
                                size={14}
                                className="text-muted-foreground group-hover/edit:text-foreground"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Regenerate from here
                          </TooltipContent>
                        </Tooltip>

                        {message.role === "user" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="group/edit"
                                onClick={toggleEditMode}
                              >
                                <PencilIcon
                                  size={14}
                                  className="text-muted-foreground group-hover/edit:text-foreground"
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Edit message
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {message.role !== "user" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="group/edit"
                                onClick={handleThreadBranchOut}
                                disabled={
                                  isBranchingThread ||
                                  branchOutMutation.isPending
                                }
                              >
                                <Split
                                  size={14}
                                  className={cn(
                                    "text-muted-foreground group-hover/edit:text-foreground",
                                    {
                                      "animate-pulse":
                                        isBranchingThread ||
                                        branchOutMutation.isPending,
                                    }
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {isBranchingThread || branchOutMutation.isPending
                                ? "Branching..."
                                : "Branch Out"}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CopyButton
                              onCopy={() => handleTextCopy(messagePart.text)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Copy message
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                );
              }

              if (messagePart.type === "tool-invocation") {
                const { toolInvocation } = messagePart;
                const { toolName, state } = toolInvocation;

                if (state === "call") {
                  if (toolName === "generateImage") {
                    return (
                      <div key={partKey}>
                        <p>Generating image...</p>
                      </div>
                    );
                  }
                }

                if (state === "result") {
                  if (toolName === "generateImage") {
                    if (toolInvocation.result.error) {
                      return (
                        <div key={partKey}>
                          <p>{toolInvocation.result.error}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={partKey}>
                        <Image
                          src={toolInvocation.result.downloadUrl}
                          alt="Generated image"
                          width={256}
                          height={256}
                        />
                      </div>
                    );
                  }
                }
              }
            })}
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
    className="group/message mx-auto min-h-[24rem] w-full max-w-3xl px-3"
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
