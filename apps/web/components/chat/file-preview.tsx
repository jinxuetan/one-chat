import { Button } from "@workspace/ui/components/button";
import { FileText, Image, X } from "lucide-react";

interface FilePreviewProps {
  fileName: string;
  fileType?: string;
  fileSize?: number;
  onRemove?: () => Promise<void>;
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
  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors duration-200 dark:border-border/60 dark:bg-card/80 dark:shadow-none">
    {fileType && (
      <div className="flex-shrink-0">
        {fileType.startsWith("image/") ? (
          <Image className="size-4 text-blue-500 dark:text-blue-400" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}
      </div>
    )}

    <div className="min-w-0 flex-1">
      <div className="truncate font-medium text-foreground">{fileName}</div>
      {fileSize && (
        <div className="text-muted-foreground text-xs">
          {formatFileSize(fileSize)}
        </div>
      )}
    </div>

    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onRemove}
      className="h-6 w-6 flex-shrink-0 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 dark:hover:bg-accent/60"
      title="Remove file"
      aria-label="Remove file"
    >
      <X className="size-3" />
    </Button>
  </div>
);
