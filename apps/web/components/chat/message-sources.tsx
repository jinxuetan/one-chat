import type { SourceUIPart } from "@ai-sdk/ui-utils";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLink, Globe } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

const WWW_PREFIX_REGEX = /^www\./;

interface MessageSourcesProps {
  sources: SourceUIPart["source"][];
  className?: string;
}

interface FaviconState {
  [key: string]: boolean;
}

export const MessageSources = ({ sources, className }: MessageSourcesProps) => {
  const [failedFavicons, setFailedFavicons] = useState<FaviconState>({});

  const getDomainFromUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(WWW_PREFIX_REGEX, "");
    } catch {
      return "Unknown";
    }
  }, []);

  const getFaviconUrl = useCallback(
    (url: string) => {
      const domain = getDomainFromUrl(url);
      return `https://twenty-icons.com/${domain}/16`;
    },
    [getDomainFromUrl]
  );

  const handleSourceClick = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleFaviconError = useCallback((sourceId: string) => {
    setFailedFavicons((prev) => ({ ...prev, [sourceId]: true }));
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
            type="button"
            key={source.id}
            onClick={() => handleSourceClick(source.url)}
            className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1.5 pr-2 pl-1.5 text-xs transition-colors hover:bg-muted"
          >
            {failedFavicons[source.id] ? (
              <Globe className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Image
                src={getFaviconUrl(source.url)}
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0"
                unoptimized
                onError={() => handleFaviconError(source.id)}
              />
            )}
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
