import { type Model } from "@/lib/ai/config";
import { useFileHandler } from "@/hooks/use-file-handler";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Loader2, Paperclip } from "lucide-react";
import { useRef } from "react";

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

export const FileButton = ({
  selectedModel,
  onFileChange,
  onUploadStateChange,
  disabled = false,
}: FileButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isUploading,
    handleFiles,
    getAllowedFileTypes,
    getSupportedFileExtensions,
  } = useFileHandler({
    selectedModel,
    onFileChange,
    onUploadStateChange,
  });

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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await handleFiles(files);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
