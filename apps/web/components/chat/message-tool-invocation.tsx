import type { ToolInvocation } from "ai";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

interface MessageToolInvocationProps {
  toolInvocation: ToolInvocation;
}

export const MessageToolInvocation = memo<MessageToolInvocationProps>(
  ({ toolInvocation }) => {
    const { toolName, state } = toolInvocation;

    if (state === "call" && toolName === "generateImage") {
      return (
        <div className="size-[256px] animate-pulse bg-muted rounded-md border flex items-center justify-center shadow-inner">
          <p>Generating image...</p>
        </div>
      );
    }

    if (state === "result" && toolName === "generateImage") {
      if (toolInvocation.result.error) {
        return (
          <div className="flex items-center px-6 flex-col justify-center size-[256px] bg-rose-50 rounded-md border border-rose-100 shadow-inner shadow-rose-100 space-y-2">
            <p className="text-rose-900">Image generation failed</p>
            <p className="text-sm text-center">
              If you're using OpenAI, your organization must be verified to use
              image generation. Use{" "}
              <Link
                href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                this
              </Link>{" "}
              link to verify your organization.
            </p>
          </div>
        );
      }
      const handleDownload = () => {
        const link = document.createElement("a");
        link.href = toolInvocation.result.downloadUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <div className="relative group w-fit">
          <Image
            src={toolInvocation.result.downloadUrl}
            alt="Generated image"
            width={256}
            height={256}
            className="rounded-md shadow-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg rounded-sm"
            onClick={handleDownload}
          >
            <Download className="size-4" />
          </Button>
        </div>
      );
    }

    return null;
  }
);

MessageToolInvocation.displayName = "MessageToolInvocation";
