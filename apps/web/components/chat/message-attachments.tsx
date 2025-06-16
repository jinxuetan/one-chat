import { cn } from "@workspace/ui/lib/utils";
import type { Attachment } from "ai";
import { FileIcon, FileTextIcon, ImageIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface MessageAttachmentsProps {
  attachments: Attachment[];
  className?: string;
}

export const MessageAttachments = memo<MessageAttachmentsProps>(
  ({ attachments, className }) => {
    if (!attachments?.length) return null;

    return (
      <div
        className={cn(
          "flex flex-col items-end justify-center gap-2",
          className
        )}
      >
        {attachments.map((attachment) => {
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

          const fileName = `${(attachment.name?.split(".").at(0) ?? "File").substring(0, 20)}...`;
          const fileExtension = attachment.name?.split(".").at(1) ?? "txt";

          // For images, show the actual image preview
          if (isImage) {
            return (
              <div
                key={attachment.url}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/50 p-2 text-sm transition-colors hover:bg-muted"
              >
                <Link
                  href={attachment.url}
                  className="flex items-center gap-2 hover:opacity-80"
                  target="_blank"
                >
                  {/* biome-ignore lint/nursery/noImgElement: <explanation> */}
                  <img
                    src={attachment.url}
                    alt={attachment.name || "Uploaded image"}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <span className="truncate font-medium text-sm">
                    {fileName}.{fileExtension}
                  </span>
                </Link>
              </div>
            );
          }

          // For non-images, show the icon as before
          return (
            <div
              key={attachment.url}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/50 px-2 py-1 text-sm transition-colors hover:bg-muted"
            >
              <Icon className="size-4 text-muted-foreground" />
              <Link
                href={attachment.url}
                className="truncate font-medium hover:underline"
                target="_blank"
              >
                {fileName}.{fileExtension}
              </Link>
            </div>
          );
        })}
      </div>
    );
  }
);

MessageAttachments.displayName = "MessageAttachments";
