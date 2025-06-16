"use client";

import { TextShimmer } from "@workspace/ui/components/text-shimmer";
import { ChevronDownIcon, ChevronRightIcon, Loader } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Force a reflow to ensure accurate measurement
      contentRef.current.style.height = 'auto';
      const rect = contentRef.current.getBoundingClientRect();
      setHeight(rect.height + 8); // Add 8px buffer to prevent cutoff
    }
  }, [reasoning]);

  // Update height when expanded state changes
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      setHeight(rect.height + 8);
    }
  }, [isExpanded]);

  if (!reasoning)
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Model did not provide reasoning.
      </p>
    );

  return (
    <div className="flex flex-col">
      <button
        data-testid="message-reasoning-toggle"
        type="button"
        className="flex cursor-pointer flex-row items-center gap-2 transition-colors duration-150 hover:text-neutral-700 dark:hover:text-neutral-300"
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        <div
          className={`transition-transform duration-200 ease-out ${
            isExpanded ? "rotate-90" : "rotate-0"
          }`}
        >
          <ChevronRightIcon className="size-4" />
        </div>
        {isLoading ? (
          <TextShimmer>Reasoning</TextShimmer>
        ) : (
          <span>Reasoning</span>
        )}
        {isLoading && (
          <div className="animate-spin">
            <Loader className="size-3" />
          </div>
        )}
      </button>

      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: isExpanded ? `${height}px` : "0px",
          marginTop: isExpanded ? "1rem" : "0",
        }}
      >
        <div
          ref={contentRef}
          data-testid="message-reasoning"
          className={`flex flex-col gap-4 rounded-r-xl rounded-l-md border bg-neutral-50 dark:bg-neutral-900 p-2 pl-3 text-neutral-600 shadow-xs dark:text-neutral-400 transition-opacity duration-150 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Markdown className="text-sm">{reasoning}</Markdown>
        </div>
      </div>
    </div>
  );
};
