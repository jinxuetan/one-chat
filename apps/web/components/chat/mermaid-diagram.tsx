"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { DownloadIcon, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useEffect, useRef, useState } from "react";

// Global flag to track Mermaid initialization
let mermaidInitialized = false;
// Cache the mermaid module to avoid repeated dynamic imports
let mermaidModule: any = null;

// Dynamic import for Mermaid to avoid bundle bloat
const importMermaid = async () => {
  if (mermaidModule) return mermaidModule;
  const mermaid = await import("mermaid");
  mermaidModule = mermaid.default;
  return mermaidModule;
};

// Mermaid theme configuration for consistent styling
const getMermaidTheme = (isDark: boolean) => ({
  theme: "base" as const,
  themeVariables: {
    primaryColor: isDark ? "#ffffff" : "#000000",
    primaryTextColor: isDark ? "#ffffff" : "#000000",
    primaryBorderColor: isDark ? "#525252" : "#d4d4d4",
    lineColor: isDark ? "#a3a3a3" : "#525252",
    secondaryColor: isDark ? "#262626" : "#f5f5f5",
    tertiaryColor: isDark ? "#404040" : "#e5e5e5",
    background: isDark ? "#171717" : "#ffffff",
    mainBkg: isDark ? "#262626" : "#f9f9f9",
    secondBkg: isDark ? "#404040" : "#f0f0f0",
    tertiaryBkg: isDark ? "#525252" : "#e0e0e0",
    // Text colors
    textColor: isDark ? "#ffffff" : "#000000",
    darkTextColor: isDark ? "#000000" : "#ffffff",
    // Node styling
    fillType0: isDark ? "#262626" : "#f9f9f9",
    fillType1: isDark ? "#404040" : "#f0f0f0",
    fillType2: isDark ? "#525252" : "#e5e5e5",
    fillType3: isDark ? "#737373" : "#d4d4d4",
    // Font
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    fontSize: "14px",
  },
});

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

// Convert SVG to PNG and download
const downloadMermaidAsPNG = async (
  svgElement: SVGElement,
  filename = "diagram.png"
) => {
  try {
    // Create a canvas and get context
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    let svgData = new XMLSerializer().serializeToString(svgElement);

    // Ensure SVG has proper namespace and is self-contained
    if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgData = svgData.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    // Set canvas size with scale for better quality
    const scale = 2;
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    ctx.scale(scale, scale);

    // Create image from SVG using data URI to avoid CORS issues
    const img = new Image();
    img.crossOrigin = "anonymous";
    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      svgData
    )}`;

    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Fill background based on current theme
          const isDark = document.documentElement.classList.contains("dark");
          ctx.fillStyle = isDark ? "#171717" : "#ffffff";
          ctx.fillRect(0, 0, svgRect.width, svgRect.height);

          // Draw the SVG image
          ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);

          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Cleanup
            URL.revokeObjectURL(downloadUrl);
            resolve();
          }, "image/png");
        } catch (canvasError) {
          reject(
            new Error(
              `Canvas operation failed: ${
                canvasError instanceof Error
                  ? canvasError.message
                  : "Unknown error"
              }`
            )
          );
        }
      };

      img.onerror = () => reject(new Error("Failed to load SVG"));
      img.src = svgDataUri;
    });
  } catch (error) {
    console.error("Failed to download diagram:", error);
    throw error;
  }
};

const MermaidDiagram = memo<MermaidDiagramProps>(({ code, className }) => {
  const { theme } = useTheme();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDownload = useCallback(async () => {
    if (!elementRef.current || !svg) return;

    try {
      setIsDownloading(true);
      const svgElement = elementRef.current.querySelector("svg");
      if (!svgElement) throw new Error("SVG element not found");

      await downloadMermaidAsPNG(svgElement, "mermaid-diagram.png");
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [svg]);

  const handleEditInMermaid = useCallback(() => {
    if (!code.trim()) return;

    const url = `https://mermaid.live/edit#base64:${btoa(
      JSON.stringify({
        code,
        mermaid: { theme: theme === "dark" ? "dark" : "default" },
      })
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }, [code, theme]);

  useEffect(() => {
    let cancelled = false;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const renderDiagram = async () => {
      try {
        // Set loading state inside debounced function to avoid extra renders
        if (!cancelled) {
          setIsLoading(true);
          setError("");
        }

        const mermaid = await importMermaid();
        const isDark = theme === "dark";

        // Only initialize once globally to prevent conflicts
        if (!mermaidInitialized) {
          mermaid.initialize({
            ...getMermaidTheme(isDark),
            startOnLoad: false,
            securityLevel: "strict",
            suppressErrorRendering: true,
          });
          mermaidInitialized = true;
        }

        // Sanitize the code to ensure it's a valid string and not JSON
        const sanitizedCode = typeof code === "string" ? code : String(code);

        // Validate that the code looks like a Mermaid diagram
        if (!sanitizedCode.trim()) {
          throw new Error("Empty diagram code");
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`;

        // Render the diagram with proper error handling
        const { svg: renderedSvg } = await mermaid.render(id, sanitizedCode);

        if (!cancelled) {
          setSvg(renderedSvg);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
          setIsLoading(false);
        }
      }
    };

    // Debounce rendering to avoid excessive renders during streaming
    debounceTimerRef.current = setTimeout(() => {
      if (!cancelled) {
        renderDiagram();
      }
    }, 300);

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code, theme]);

  if (error) {
    // Fallback to code display if Mermaid fails
    return (
      <div className={cn("bg-destructive/5 p-4", className)}>
        <div className="mb-2 font-medium text-destructive text-sm">
          Failed to render Mermaid diagram
        </div>
        <pre className="overflow-auto rounded bg-muted p-3 text-sm">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-50/80 p-8 dark:bg-neutral-900",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Rendering diagram...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      <div
        className={cn(
          "overflow-auto rounded-none bg-neutral-50/80 p-4 dark:bg-neutral-900",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 hover:scrollbar-thumb-border/50"
        )}
        ref={elementRef}
        role="img"
        aria-label="Mermaid diagram"
      >
        <div
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Action buttons - only show when diagram is loaded */}
      {svg && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          {/* Edit in Mermaid Live button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0 text-muted-foreground hover:bg-accent hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            onClick={handleEditInMermaid}
            title="Edit in Mermaid Live Editor"
          >
            <ExternalLink className="size-4" />
            <span className="sr-only">Edit in Mermaid Live Editor</span>
          </Button>

          {/* Download button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0 text-muted-foreground hover:bg-accent hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDownloading && "opacity-100"
            )}
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download diagram as PNG"
          >
            {isDownloading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            <span className="sr-only">
              {isDownloading ? "Downloading..." : "Download diagram"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
});

MermaidDiagram.displayName = "MermaidDiagram";

// Loading fallback component
export const MermaidDiagramFallback = ({
  className,
}: {
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-center rounded-md border bg-muted/30 p-8",
      className
    )}
  >
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      Loading diagram renderer...
    </div>
  </div>
);

export default MermaidDiagram;
