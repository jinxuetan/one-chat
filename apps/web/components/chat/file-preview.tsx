import { Button } from "@workspace/ui/components/button";
import { FileText, Image, X } from "lucide-react";

interface FilePreviewProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  onRemove: () => Promise<void>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export const FilePreview = ({
  fileName,
  fileType,
  fileSize,
  onRemove,
}: FilePreviewProps) => (
  <div className="flex items-center gap-2 rounded-lg border border-alpha-300 bg-white px-3 py-2 text-sm shadow-sm">
    <div className="flex-shrink-0">
      {fileType.startsWith("image/") ? (
        <Image className="size-4 text-blue-500" />
      ) : (
        <FileText className="size-4 text-gray-500" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="truncate font-medium text-gray-900">{fileName}</div>
      <div className="text-gray-500 text-xs">{formatFileSize(fileSize)}</div>
    </div>

    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onRemove}
      className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-gray-600 disabled:opacity-50"
      title="Remove file"
    >
      <X className="size-3" />
    </Button>
  </div>
);
