import { AVAILABLE_MODELS, type Model, getModelAcceptTypes } from "@/lib/ai/config";
import { useSession } from "@/lib/auth/client";
import { upload } from "@vercel/blob/client";
import { toast } from "@workspace/ui/components/sonner";
import { useCallback, useState } from "react";

interface SelectedFile {
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  fileName: string;
}

interface UseFileHandlerOptions {
  selectedModel?: Model;
  onFileChange: (file: SelectedFile) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  maxFileSize?: number;
  maxFiles?: number;
}

const DEFAULT_MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const DEFAULT_MAX_FILES = 10;

export const useFileHandler = ({
  selectedModel,
  onFileChange,
  onUploadStateChange,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
}: UseFileHandlerOptions) => {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);

  const getAllowedFileTypes = useCallback(() => {
    return selectedModel ? getModelAcceptTypes(selectedModel) : ["text/plain"];
  }, [selectedModel]);

  const getSupportedFileExtensions = useCallback(() => {
    if (!selectedModel) return ["txt"];
    const model = AVAILABLE_MODELS[selectedModel];
    return model?.supportedFileTypes || ["txt"];
  }, [selectedModel]);

  const validateFile = useCallback(
    (file: File): string | null => {
      const allowedTypes = getAllowedFileTypes();

      if (!allowedTypes.includes(file.type)) {
        const modelName = selectedModel?.split(":")[1] || "selected model";
        return `File "${file.name}" is not supported by ${modelName}`;
      }

      if (file.size > maxFileSize) {
        return `File "${file.name}" is too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`;
      }

      return null;
    },
    [getAllowedFileTypes, selectedModel, maxFileSize]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<SelectedFile> => {
      const blob = await upload(
        `${session?.user?.id}/attachments/${file.name}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/files/upload",
        }
      );

      return {
        fileKey: blob.pathname,
        fileUrl: blob.url,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      };
    },
    [session?.user?.id]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (fileArray.length === 0) return;

      if (fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate all files first
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      // Show validation errors
      if (errors.length > 0) {
        for (const error of errors) {
          toast.error(error);
        }
        if (validFiles.length === 0) return;
      }

      setIsUploading(true);
      onUploadStateChange?.(true);

      try {
        // Upload all valid files
        const results = await Promise.allSettled(validFiles.map(uploadFile));

        let errorCount = 0;

        for (const result of results) {
          if (result.status === "fulfilled") {
            onFileChange(result.value);
          } else {
            errorCount++;
            console.error("File upload error:", result.reason);
          }
        }

        if (errorCount > 0) {
          toast.error(
            errorCount === 1
              ? "1 file failed to upload"
              : `${errorCount} files failed to upload`
          );
        }
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
        onUploadStateChange?.(false);
      }
    },
    [
      maxFiles,
      validateFile,
      uploadFile,
      onFileChange,
      onUploadStateChange,
    ]
  );

  return {
    isUploading,
    handleFiles,
    getAllowedFileTypes,
    getSupportedFileExtensions,
    validateFile,
  };
}; 