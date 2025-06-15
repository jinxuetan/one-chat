"use client";

import type { Effort, Model } from "@/lib/ai/config";
import { getModelByKey } from "@/lib/ai/models";
import { trpc } from "@/lib/trpc/client";
import { setModelCookie } from "@/lib/utils";
import type { ChatSubmitData, SearchMode } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import type { Attachment } from "ai";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EffortButton } from "./effort-button";
import { FileButton } from "./file-button";
import { FilePreview } from "./file-preview";
import { SearchButton } from "./search-button";
import { SelectModelButton } from "./select-model-button";

interface SelectedFile {
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  fileName: string;
}

interface StopButtonProps {
  threadId: string;
  onStop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}

const StopButton = ({ threadId, onStop, setMessages }: StopButtonProps) => {
  const [isStopping, setIsStopping] = useState(false);

  const handleStop = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (isStopping) return;

    setIsStopping(true);

    try {
      // Update messages state to mark as stopped
      setMessages((messages) => {
        // Find the last message in the array
        const lastMessage = messages.at(-1);
        if (!lastMessage) return messages;

        if (lastMessage.role === "assistant") {
          // If the last message is assistant, add `isStopped: true` to it
          return [
            ...messages.slice(0, -1),
            {
              ...lastMessage,
              isStopped: true,
            },
          ];
        } else if (lastMessage.role === "user") {
          // If the last message is user, add a new empty assistant message with `isStopped: true`
          return [
            ...messages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: "",
              isStopped: true,
            },
          ];
        }

        return messages;
      });

      // Call the original onStop function
      onStop();

      await fetch(`/api/chat?chatId=${threadId}`, {
        method: "DELETE",
      });

      toast.success("Stream stopped successfully");
    } catch (error) {
      console.error("Failed to stop stream:", error);
      toast.error("Failed to stop stream. Please try again.");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <Button
      className="rounded-full border dark:border-zinc-600"
      size="icon"
      onClick={handleStop}
      disabled={isStopping}
      title={isStopping ? "Stopping..." : "Stop generation"}
    >
      <div className="size-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900" />
    </Button>
  );
};

interface ChatInputProps {
  threadId: string;
  initialChatModel: Model;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (data: ChatSubmitData) => void;
  status: UseChatHelpers["status"];
  onStop: () => void;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isAtBottom: boolean;
  scrollToBottom: () => void;
  disabled?: boolean;
}

const convertToAttachment = (file: SelectedFile): Attachment => ({
  name: file.fileName,
  contentType: file.fileType,
  url: file.fileUrl,
});

export const ChatInput = memo(
  ({
    threadId,
    input,
    initialChatModel,
    onInputChange,
    onSubmit,
    status,
    onStop,
    setMessages,
    reload,
    isAtBottom,
    scrollToBottom,
    disabled = false,
  }: ChatInputProps) => {
    const [reasoningEffort, setReasoningEffort] = useState<Effort>("medium");
    const [searchStrategy, setSearchStrategy] = useState<SearchMode>("off");
    const [selectedModel, setSelectedModel] = useState<Model>(initialChatModel);
    const [isRestrictedToOpenRouter, setIsRestrictedToOpenRouter] =
      useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const deleteAttachment = trpc.attachment.delete.useMutation();

    const modelCapabilities = useMemo(() => {
      const modelConfig = getModelByKey(selectedModel);
      if (!modelConfig) {
        return {
          supportsEffort: false,
          supportsSearch: false,
          supportsFiles: false,
          supportsTools: false,
        };
      }

      return {
        supportsEffort: modelConfig.capabilities.effort,
        supportsSearch: modelConfig.capabilities.nativeSearch,
        supportsFiles: modelConfig.supportedFileTypes.length > 0,
        supportsTools: modelConfig.capabilities.tools,
      };
    }, [selectedModel]);

    const handleFileChange = useCallback(
      (file: SelectedFile) => setSelectedFiles((prev) => [...prev, file]),
      []
    );

    const handleUploadStateChange = useCallback((uploading: boolean) => {
      setIsUploading(uploading);
    }, []);

    useEffect(() => {
      // Set cookie when model changes
      setModelCookie(selectedModel);
    }, [selectedModel]);

    const handleRemoveFile = async (file: SelectedFile) => {
      setSelectedFiles((prev) =>
        prev.filter((f) => f.fileKey !== file.fileKey)
      );
      try {
        await deleteAttachment.mutateAsync({ url: file.fileUrl });
      } catch (error) {
        // Rollback
        setSelectedFiles((prev) => {
          const exists = prev.find((f) => f.fileKey === file.fileKey);
          if (!exists) return [...prev, file];
          return prev;
        });
        console.error("Failed to delete file:", error);
        toast.error("Failed to delete file. Please try again.");
      }
    };

    const handleSubmit = (
      e: React.FormEvent<HTMLTextAreaElement> | React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if ((!input?.trim() && selectedFiles.length === 0) || disabled) {
        return;
      }

      const attachments: Attachment[] | undefined =
        selectedFiles.length > 0
          ? selectedFiles.map(convertToAttachment)
          : undefined;

      onSubmit({
        input,
        selectedModel,
        reasoningEffort,
        searchStrategy,
        attachments,
        forceOpenRouter: isRestrictedToOpenRouter,
      });

      setSelectedFiles([]);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: The input is used to determine the height of the textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [input]);

    // Determine if we can submit
    const canSubmit = input?.trim();
    const isProcessing = status === "streaming";
    const cannotSubmit = !canSubmit || isProcessing || isUploading;

    return (
      <div className="sticky inset-x-0 bottom-0 z-10 mx-auto flex w-full gap-2 bg-background px-4 pb-4 md:max-w-3xl md:pb-6">
        <div className="relative flex w-full flex-col">
          <div className="-top-12 -translate-x-1/2 absolute left-1/2">
            <AnimatePresence>
              {!isAtBottom && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button
                    className="rounded-full"
                    size="icon"
                    variant="outline"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToBottom();
                    }}
                  >
                    <ArrowDown />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Error Display */}
          {status === "error" && (
            <div className="rounded-lg border border-b-0 border-rose-200 bg-rose-50 rounded-b-none w-[95%] mx-auto p-2">
              <div className="flex items-center justify-between">
                <p className="text-rose-900  text-sm">Something went wrong</p>
                {reload && (
                  <Button
                    onClick={async () => await reload()}
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-900 bg-rose-50 border-rose-300 h-6 rounded-sm hover:bg-rose-100"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="relative w-full rounded-xl border border-alpha-400 bg-neutral-50 shadow-[0_2px_2px_rgba(0,0,0,0.04),0_8px_8px_-8px_rgba(0,0,0,0.04)] transition-shadow"
          >
            <textarea
              ref={textareaRef}
              value={input}
              disabled={disabled}
              onChange={onInputChange}
              style={{
                minHeight: "42px",
                maxHeight: "384px",
              }}
              spellCheck={false}
              className="w-full flex-1 resize-none overflow-auto bg-transparent p-3 pb-1.5 outline-none ring-0 placeholder:text-neutral-500 disabled:opacity-50"
              placeholder={
                isProcessing
                  ? "AI is responding..."
                  : isUploading
                  ? "Uploading files..."
                  : "Ask me anything..."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!cannotSubmit) {
                    handleSubmit(e);
                  }
                }
              }}
            />

            {/* File previews */}
            {selectedFiles.length > 0 && (
              <div className="border-alpha-200 border-t px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file) => (
                    <FilePreview
                      key={file.fileKey}
                      fileName={file.fileName}
                      fileType={file.fileType}
                      fileSize={file.fileSize}
                      onRemove={async () => await handleRemoveFile(file)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 p-3">
              <div className="flex items-end gap-0.5 sm:gap-1">
                <SelectModelButton
                  selectedModel={selectedModel}
                  onSelect={setSelectedModel}
                  isRestrictedToOpenRouter={isRestrictedToOpenRouter}
                  onIsRestrictedToOpenRouterChange={setIsRestrictedToOpenRouter}
                  disabled={disabled}
                />
                {modelCapabilities.supportsEffort && (
                  <EffortButton
                    effort={reasoningEffort}
                    onEffortChange={setReasoningEffort}
                    disabled={disabled}
                  />
                )}
                {(modelCapabilities.supportsTools ||
                  modelCapabilities.supportsSearch) && (
                  <SearchButton
                    searchMode={searchStrategy}
                    onSearchModeChange={setSearchStrategy}
                    supportsNativeSearch={modelCapabilities.supportsSearch}
                    disabled={disabled}
                  />
                )}
                {modelCapabilities.supportsFiles && (
                  <FileButton
                    selectedModel={selectedModel}
                    onFileChange={handleFileChange}
                    onUploadStateChange={handleUploadStateChange}
                    disabled={isProcessing || disabled}
                  />
                )}
              </div>
              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                {status === "submitted" || status === "streaming" ? (
                  <StopButton
                    threadId={threadId}
                    onStop={onStop}
                    setMessages={setMessages}
                  />
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-lg transition-all duration-300 ease-in-out"
                    disabled={cannotSubmit || disabled}
                    title={
                      isUploading
                        ? "Files are uploading..."
                        : isProcessing
                        ? "AI is responding..."
                        : canSubmit
                        ? "Send message"
                        : "Enter a message"
                    }
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
);
