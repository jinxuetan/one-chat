import { type Model, getModelAcceptTypes } from "@/lib/ai/config";
import { useSession } from "@/lib/auth/client";
import { upload } from "@vercel/blob/client";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
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
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export const FileButton = ({
  selectedModel,
  onFileChange,
}: FileButtonProps) => {
  const { data: session } = useSession();
  const getAllowedFileTypes = (): string[] => {
    if (!selectedModel) {
      return ["text/plain"];
    }
    return getModelAcceptTypes(selectedModel);
  };
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = getAllowedFileTypes();

    // Validate file type against model capabilities
    if (!allowedTypes.includes(file.type)) {
      const modelName = selectedModel
        ? `${selectedModel.split(":")[1]}`
        : "selected model";
      toast.error(
        `File type "${file.type}" is not supported by ${modelName}. Please select a compatible file.`
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Vercel Blob
      const blob = await upload(
        `${session?.user?.id}/attachments/${file.name}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/files/upload",
        }
      );

      // Call parent callback with file info
      // Note: Database storage is handled automatically by the server's onUploadCompleted callback
      onFileChange({
        fileKey: blob.pathname,
        fileUrl: blob.url,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      });

      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={getAllowedFileTypes().join(",")}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isUploading}
        onClick={handleFileSelect}
        title={isUploading ? "Uploading..." : "Attach file"}
      >
        {isUploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Paperclip className="size-3.5" />
        )}
        <span>Attach</span>
        <span className="sr-only">
          {isUploading ? "Uploading file..." : "Attach file"}
        </span>
      </Button>
    </>
  );
};
