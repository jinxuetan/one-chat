import { Button } from "@workspace/ui/components/button";
import { FileText, Image, X } from "lucide-react";

interface FilePreviewProps {
  fileName: string;
  fileType?: string;
  fileSize?: number;
  onRemove?: () => Promise<void>;
  fileUrl?: string;
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
  fileUrl,
}: FilePreviewProps) => (
  <div className="group relative flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 shadow-xs backdrop-blur-sm transition-all duration-100 hover:border-border hover:bg-background dark:border-border/40 dark:bg-card/60 dark:backdrop-blur-sm dark:hover:border-border/60 dark:hover:bg-card/80">
    {/* File Type Icon */}
    {fileType && (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50 transition-colors duration-100 group-hover:bg-muted/70 dark:bg-muted/30 dark:group-hover:bg-muted/50">
        {fileType.startsWith("image/") && fileUrl ? (
          // biome-ignore lint/nursery/noImgElement: We want to show a preview of the image.
          <img
            src={fileUrl}
            alt={fileName}
            className="h-full w-full object-cover"
          />
        ) : fileType.startsWith("image/") ? (
          <Image className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        ) : (
          <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </div>
    )}

    {/* File Information */}
    <div className="min-w-0 flex-1 space-y-0.5">
      <div className="truncate font-medium text-foreground/90 text-sm leading-tight dark:text-foreground/95">
        {fileName}
      </div>
      {fileSize && (
        <div className="text-muted-foreground/80 text-xs leading-tight dark:text-muted-foreground/70">
          {formatFileSize(fileSize)}
        </div>
      )}
    </div>

    {/* Remove Button */}
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onRemove}
      className="h-6 w-6 flex-shrink-0 rounded-md bg-transparent text-muted-foreground/60 opacity-0 transition-all duration-100 hover:bg-destructive/10 hover:text-destructive/80 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 group-hover:opacity-100 dark:text-muted-foreground/50 dark:hover:bg-destructive/15 dark:hover:text-destructive/70"
      title="Remove file"
      aria-label="Remove file"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  </div>
);
