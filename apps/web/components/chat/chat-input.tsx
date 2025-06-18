"use client";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useBestModel } from "@/hooks/use-best-model";
import { useFileHandler } from "@/hooks/use-file-handler";
import type { Effort, Model } from "@/lib/ai/config";
import { getModelByKey } from "@/lib/ai/models";
import { trpc } from "@/lib/trpc/client";
import { setModelCookie } from "@/lib/utils";
import { getRoutingFromCookie, setRoutingCookie } from "@/lib/utils/cookie";
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
import { ModelSelectionPopover } from "./model-selection-popover";
import { SearchButton } from "./search-button";
import { VoiceButton, type VoiceButtonRef } from "./voice-button";

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
        }
        if (lastMessage.role === "user") {
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
      className="rounded-full border border-border bg-background transition-colors duration-200 hover:bg-accent dark:border-border/60 dark:bg-card dark:hover:bg-accent/80"
      size="icon"
      onClick={handleStop}
      disabled={isStopping}
      title={isStopping ? "Stopping..." : "Stop generation"}
    >
      <div className="size-3.5 rounded-xs bg-foreground dark:bg-foreground/90" />
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
  isStreamInterrupted: boolean;
  disabled?: boolean;
  onExternalFileDrop?: (
    handleFiles: (files: FileList) => Promise<void>
  ) => void;
  error?: Error;
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
    setInput,
    initialChatModel,
    onInputChange,
    onSubmit,
    status,
    onStop,
    setMessages,
    reload,
    isAtBottom,
    scrollToBottom,
    isStreamInterrupted,
    disabled = false,
    onExternalFileDrop,
    error,
  }: ChatInputProps) => {
    const [reasoningEffort, setReasoningEffort] = useState<Effort>("medium");
    const [searchStrategy, setSearchStrategy] = useState<SearchMode>("off");
    const [selectedModel, setSelectedModel] = useState<Model>(initialChatModel);
    const [isRestrictedToOpenRouter, setIsRestrictedToOpenRouter] =
      useState<boolean>(getRoutingFromCookie() ?? false);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showStreamInterrupted, setShowStreamInterrupted] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const voiceButtonRef = useRef<VoiceButtonRef>(null);
    const deleteAttachment = trpc.attachment.delete.useMutation();
    const { keys, hasOpenRouter } = useApiKeys();

    useEffect(() => {
      if (!isStreamInterrupted) {
        setShowStreamInterrupted(false);
        return;
      }
      const timeoutId = setTimeout(() => setShowStreamInterrupted(true), 1000);
      return () => clearTimeout(timeoutId);
    }, [isStreamInterrupted]);

    useEffect(() => {
      const hasNativeKeys = Boolean(
        keys.openai || keys.anthropic || keys.google
      );
      const onlyHasOpenRouter = hasOpenRouter && !hasNativeKeys;
      const cookieRouting = getRoutingFromCookie();

      // Don't set any routing preference if user has no keys at all
      const hasAnyKeys = hasNativeKeys || hasOpenRouter;
      if (!hasAnyKeys) {
        return;
      }

      // If user only has OpenRouter, force OpenRouter routing regardless of cookie
      if (onlyHasOpenRouter) {
        setIsRestrictedToOpenRouter(true);
        setRoutingCookie(true);
        return;
      }

      // If user has native keys, respect cookie preference or default to native
      if (hasNativeKeys) {
        const shouldUseNative = cookieRouting === null ? true : !cookieRouting;
        setIsRestrictedToOpenRouter(!shouldUseNative);
        if (cookieRouting === null) {
          setRoutingCookie(false); // Default to native routing
        }
        return;
      }
    }, [keys, hasOpenRouter]);

    // Auto-switch to best model when API keys change
    useBestModel({
      onModelChange: setSelectedModel,
      autoSwitch: true,
    });

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

    const handleVoiceTranscript = useCallback(
      (transcript: string) => {
        // Append the transcript to the current input
        setInput((prevInput: string) => {
          const newInput = prevInput
            ? `${prevInput} ${transcript}`
            : transcript;
          return newInput.trim();
        });
      },
      [setInput]
    );

    // Set up shared file handler for drag and drop
    const dragDropFileHandler = useFileHandler({
      selectedModel,
      onFileChange: handleFileChange,
      onUploadStateChange: handleUploadStateChange,
    });

    // Expose file handling to parent via callback
    useEffect(() => {
      if (onExternalFileDrop) {
        onExternalFileDrop(dragDropFileHandler.handleFiles);
      }
    }, [onExternalFileDrop, dragDropFileHandler.handleFiles]);

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

      // Stop voice transcription when submitting
      voiceButtonRef.current?.stop();

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
      <div className="sticky inset-x-0 bottom-0 z-10 mx-auto flex w-full gap-2 border-border/20 bg-background/60 px-2 pb-2 backdrop-blur-sm sm:px-4 sm:pb-4 md:max-w-3xl md:pb-6">
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
                    className="rounded-full border border-border bg-background transition-colors duration-200 hover:bg-accent dark:border-border/60 dark:bg-card dark:hover:bg-accent/80"
                    size="icon"
                    variant="outline"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToBottom();
                    }}
                  >
                    <ArrowDown className="size-4 text-foreground dark:text-foreground/90" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Error Display */}
          {status === "error" && (
            <div className="mx-auto w-[95%] rounded-lg rounded-b-none border border-destructive/30 border-b-0 bg-destructive/10 p-2 dark:border-destructive/20 dark:bg-destructive/5">
              <div className="flex items-center justify-between">
                <p className="text-destructive text-sm sm:text-base dark:text-destructive/90">
                  {error?.message}
                </p>
                {reload && (
                  <Button
                    onClick={async () =>
                      await reload({
                        body: {
                          selectedModel,
                        },
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="h-6 rounded-sm border-destructive/30 bg-destructive/10 text-destructive transition-colors duration-200 hover:bg-destructive/20 dark:border-destructive/20 dark:bg-destructive/5 dark:text-destructive/90 dark:hover:bg-destructive/10"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Interrupted Stream Display */}
          {status !== "error" && showStreamInterrupted && (
            <div className="mx-auto w-[95%] rounded-lg rounded-b-none border border-amber-300/30 border-b-0 bg-amber-50/80 p-2 pl-3 dark:border-amber-400/20 dark:bg-amber-900/20">
              <div className="flex items-center justify-between">
                <p className="text-amber-700 text-sm sm:text-base dark:text-amber-300">
                  Stream was interrupted or stopped
                </p>
                {reload && (
                  <Button
                    onClick={async () =>
                      await reload({
                        body: {
                          selectedModel,
                        },
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="h-6 rounded-sm border-amber-300/30 bg-amber-50/80 text-amber-700 transition-colors duration-200 hover:bg-amber-100/80 dark:border-amber-400/20 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-800/30"
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
            className="relative w-full rounded-xl border border-border bg-muted/30 shadow-xs backdrop-blur-sm transition-all duration-200 focus-within:border-border/80 focus-within:shadow-md dark:border-border/60 dark:bg-card/50 dark:shadow-none dark:focus-within:border-border/80 dark:focus-within:shadow-lg"
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
              className="w-full flex-1 resize-none overflow-auto bg-transparent p-2 pb-1.5 text-foreground outline-none ring-0 transition-colors duration-200 placeholder:text-muted-foreground disabled:opacity-50 sm:p-3"
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
              <div className="border-border/30 border-t px-2 pt-2 sm:px-3 dark:border-border/20">
                <div className="flex flex-wrap gap-2 overflow-x-auto">
                  {selectedFiles.map((file) => (
                    <FilePreview
                      key={file.fileKey}
                      fileName={file.fileName}
                      fileType={file.fileType}
                      fileSize={file.fileSize}
                      onRemove={async () => await handleRemoveFile(file)}
                      fileUrl={file.fileUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-3">
              <div className="flex items-end gap-0.5 sm:gap-1">
                <ModelSelectionPopover
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
                <VoiceButton
                  ref={voiceButtonRef}
                  onTranscript={handleVoiceTranscript}
                  disabled={isProcessing || disabled}
                />
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
                    className="rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
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
