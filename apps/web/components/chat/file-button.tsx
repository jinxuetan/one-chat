import {
  AVAILABLE_MODELS,
  type Model,
  getModelAcceptTypes,
} from "@/lib/ai/config";
import { useSession } from "@/lib/auth/client";
import { upload } from "@vercel/blob/client";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState } from "react";

interface FileButtonProps {
  selectedModel?: Model;
  onFileChange: (file: {
    fileKey: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    fileName: string;
  }) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 10;

export const FileButton = ({
  selectedModel,
  onFileChange,
  onUploadStateChange,
  disabled = false,
}: FileButtonProps) => {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllowedFileTypes = () => {
    return selectedModel ? getModelAcceptTypes(selectedModel) : ["text/plain"];
  };

  const getSupportedFileExtensions = () => {
    if (!selectedModel) return ["txt"];
    const model = AVAILABLE_MODELS[selectedModel];
    return model?.supportedFileTypes || ["txt"];
  };

  const getTooltipContent = () => {
    const extensions = getSupportedFileExtensions();
    const modelName = selectedModel?.split(":")[1] || "this model";

    if (extensions.length === 0) {
      return `No file types supported by ${modelName}`;
    }

    const formattedExtensions = extensions
      .map((ext) => ext.toUpperCase())
      .join(", ");

    return formattedExtensions;
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = getAllowedFileTypes();

    if (!allowedTypes.includes(file.type)) {
      const modelName = selectedModel?.split(":")[1] || "selected model";
      return `File "${file.name}" is not supported by ${modelName}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large (max 8MB)`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
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
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    for (const file of Array.from(files)) {
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
        }
      }

      if (errorCount > 0) {
        toast.error(
          errorCount === 1
            ? "1 file failed to upload"
            : `${errorCount} files failed to upload`
        );
      }
    } catch (_error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept={getAllowedFileTypes().join(",")}
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 gap-1.5 px-2.5 sm:px-2.5"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Paperclip className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {isUploading ? "Uploading..." : "Attach"}
            </span>
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  );
};
