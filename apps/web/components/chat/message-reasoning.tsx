"use client";

import { TextShimmer } from "@workspace/ui/components/text-shimmer";
import { ChevronRightIcon, Loader } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Markdown } from "./markdown";

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export const MessageReasoning = ({
  isLoading,
  reasoning,
}: MessageReasoningProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentElementRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const measureContentHeight = useCallback((element: HTMLDivElement | null) => {
    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    contentElementRef.current = element;

    if (!element) return;

    // Create ResizeObserver for efficient height tracking
    resizeObserverRef.current = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry) {
        const height = entry.contentRect.height;
        setContentHeight(height + 20); // Buffer for smooth rendering
      }
    });

    // Start observing
    resizeObserverRef.current.observe(element);

    // Initial height measurement
    const rect = element.getBoundingClientRect();
    setContentHeight(rect.height + 20);
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleExpansion = useCallback(() => {
    setIsExpanded((previousState) => !previousState);
  }, []);

  if (!reasoning) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Model did not provide reasoning.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        data-testid="message-reasoning-toggle"
        type="button"
        className="flex cursor-pointer flex-row items-center gap-2 transition-colors duration-150 hover:text-neutral-700 dark:hover:text-neutral-300"
        onClick={handleToggleExpansion}
        aria-expanded={isExpanded}
        aria-controls="reasoning-content"
      >
        <div
          className={`transition-transform duration-200 ease-out ${
            isExpanded ? "rotate-90" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          <ChevronRightIcon className="size-4" />
        </div>

        {isLoading ? (
          <TextShimmer>Reasoning</TextShimmer>
        ) : (
          <span>Reasoning</span>
        )}

        {isLoading && (
          <div className="animate-spin" aria-hidden="true">
            <Loader className="size-3" />
          </div>
        )}
      </button>

      <div
        id="reasoning-content"
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: isExpanded ? `${contentHeight}px` : "0px",
          marginTop: isExpanded ? "1rem" : "0",
        }}
        aria-hidden={!isExpanded}
      >
        <div
          ref={measureContentHeight}
          data-testid="message-reasoning"
          className={`flex flex-col gap-4 rounded-r-xl rounded-l-md border bg-neutral-50 dark:bg-neutral-900 p-2 pl-3 text-neutral-600 shadow-xs dark:text-neutral-400 transition-opacity duration-150 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Markdown className="text-sm w-full">{reasoning}</Markdown>
        </div>
      </div>
    </div>
  );
};
