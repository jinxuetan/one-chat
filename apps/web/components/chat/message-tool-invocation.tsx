import { Button } from "@workspace/ui/components/button";
import { TextShimmer } from "@workspace/ui/components/text-shimmer";
import type { ToolInvocation } from "ai";
import { Download, Loader, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";

interface MessageToolInvocationProps {
  toolInvocation: ToolInvocation;
}

export const MessageToolInvocation = memo<MessageToolInvocationProps>(
  ({ toolInvocation }) => {
    const { toolName, state } = toolInvocation;

    if (state === "call" && toolName === "generateImage") {
      return (
        <div className="flex size-[256px] animate-pulse items-center justify-center rounded-md border bg-muted shadow-inner">
          <p>Generating image...</p>
        </div>
      );
    }

    if (state === "call" && toolName === "webSearch") {
      return (
        <div className="flex items-center gap-2">
          <Loader className="size-3.5 animate-spin" />
          <TextShimmer>Searching the web...</TextShimmer>
        </div>
      );
    }

    if (state === "result" && toolName === "webSearch") {
      return (
        <div className="flex w-full items-center gap-1 rounded-md border border-border bg-muted p-1.5 pl-2 text-sm">
          <Search className="size-3.5" />
          <span>Searched the web</span>
        </div>
      );
    }

    if (state === "result" && toolName === "generateImage") {
      if (toolInvocation.result.error) {
        return (
          <div className="flex size-[256px] flex-col items-center justify-center space-y-2 rounded-md border border-rose-100 bg-rose-50 px-6 shadow-inner shadow-rose-100">
            <p className="text-rose-900">Image generation failed</p>
            <p className="text-center text-sm">
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
        <div className="group relative w-fit">
          <Image
            src={toolInvocation.result.downloadUrl}
            alt="Generated image"
            width={256}
            height={256}
            className="rounded-md border border-border shadow-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-2 bottom-2 rounded-sm opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
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
