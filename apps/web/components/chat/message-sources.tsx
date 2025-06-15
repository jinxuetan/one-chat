import type { SourceUIPart } from "@ai-sdk/ui-utils";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLink } from "lucide-react";
import { useCallback } from "react";

interface MessageSourcesProps {
  sources: SourceUIPart["source"][];
  className?: string;
}

export const MessageSources = ({ sources, className }: MessageSourcesProps) => {
  const getDomainFromUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "");
    } catch {
      return "Unknown";
    }
  }, []);

  const getFaviconUrl = useCallback(
    (url: string) => {
      const domain = getDomainFromUrl(url);
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    },
    [getDomainFromUrl]
  );

  const handleSourceClick = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-medium text-foreground text-sm">Sources</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => handleSourceClick(source.url)}
            className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            <img
              src={getFaviconUrl(source.url)}
              alt=""
              className="size-4 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="max-w-32 truncate">{source.title}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {getDomainFromUrl(source.url)}
            </span>
            <ExternalLink className="size-3 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
