"use client";

import type { Effort, Model } from "@/lib/ai/config";
import { getModelByKey } from "@/lib/ai/models";
import { trpc } from "@/lib/trpc/client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import type { Attachment } from "ai";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
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
  onStop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}

const StopButton = ({ onStop, setMessages }: StopButtonProps) => (
  <Button
    className="rounded-full border dark:border-zinc-600"
    size="icon"
    onClick={(event) => {
      event.preventDefault();
      onStop();
      setMessages((messages) => messages);
    }}
  >
    <div className="size-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900" />
  </Button>
);

interface ChatInputProps {
  threadId: string;
  initialChatModel: Model;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (data: {
    input: string;
    selectedModel: Model;
    effort: Effort;
    isSearchActive: boolean;
    attachments?: Attachment[];
  }) => void;
  status: UseChatHelpers["status"];
  onStop: () => void;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

const convertToAttachment = (file: SelectedFile): Attachment => ({
  name: file.fileName,
  contentType: file.fileType,
  url: file.fileUrl,
});

export const ChatInput = memo(
  ({
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
  }: ChatInputProps) => {
    const [effort, setEffort] = useState<Effort>("high");
    const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
    const [selectedModel, setSelectedModel] = useState<Model>(initialChatModel);
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
        };
      }

      return {
        supportsEffort: modelConfig.capabilities.effort,
        supportsSearch: modelConfig.capabilities.search,
        supportsFiles: modelConfig.supportedFileTypes.length > 0,
      };
    }, [selectedModel]);

    const handleFileChange = useCallback(
      (file: SelectedFile) => setSelectedFiles((prev) => [...prev, file]),
      []
    );

    const handleUploadStateChange = useCallback((uploading: boolean) => {
      setIsUploading(uploading);
    }, []);

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

      if (!input?.trim() && selectedFiles.length === 0) {
        return;
      }

      const attachments: Attachment[] | undefined =
        selectedFiles.length > 0
          ? selectedFiles.map(convertToAttachment)
          : undefined;

      onSubmit({
        input,
        selectedModel,
        effort,
        isSearchActive,
        attachments,
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
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
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
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-red-800 text-sm">Something went wrong</p>
                {reload && (
                  <Button
                    onClick={async () => await reload()}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600"
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
              onChange={onInputChange}
              disabled={isProcessing}
              style={{
                minHeight: "42px",
                maxHeight: "384px",
              }}
              spellCheck={false}
              className="w-full flex-1 resize-none overflow-auto bg-transparent p-3 pb-1.5 text-sm outline-none ring-0 placeholder:text-gray-500 disabled:opacity-50"
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
                />
                {modelCapabilities.supportsEffort && (
                  <EffortButton effort={effort} onEffortChange={setEffort} />
                )}
                {modelCapabilities.supportsSearch && (
                  <SearchButton
                    isSearchActive={isSearchActive}
                    onSearchActiveChange={setIsSearchActive}
                  />
                )}
                {modelCapabilities.supportsFiles && (
                  <FileButton
                    selectedModel={selectedModel}
                    onFileChange={handleFileChange}
                    onUploadStateChange={handleUploadStateChange}
                    disabled={isProcessing}
                  />
                )}
              </div>
              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                {status === "submitted" ? (
                  <StopButton onStop={onStop} setMessages={setMessages} />
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-lg transition-all duration-300 ease-in-out"
                    disabled={cannotSubmit}
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
