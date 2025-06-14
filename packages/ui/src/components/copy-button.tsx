"use client";

import { Button } from "@workspace/ui/components/button";
import { Copy } from "lucide-react";
import { type Variants, motion, cubicBezier } from "motion/react";
import type React from "react";
import { useRef, useState } from "react";

interface CopyButtonProps {
  onCopy: () => Promise<void> | void;
}

const easeOut = cubicBezier(0.4, 0, 0.2, 1);

const copyIconVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: easeOut },
  },
  copying: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: easeOut },
  },
  copied: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: easeOut },
  },
};

const checkIconVariants: Variants = {
  idle: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: easeOut },
  },
  copying: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: easeOut },
  },
  copied: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: easeOut },
  },
};

const checkPathVariants: Variants = {
  idle: {
    pathLength: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: easeOut },
  },
  copying: {
    pathLength: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: easeOut },
  },
  copied: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: easeOut },
  },
};

const MotionButton = motion.create(Button);

export const CopyButton: React.FC<CopyButtonProps> = ({ onCopy }) => {
  const [status, setStatus] = useState<"idle" | "copying" | "copied">("idle");
  const [backgroundState, setBackgroundState] = useState<
    "hidden" | "entering" | "centered" | "leaving"
  >("hidden");
  const [entryDirection, setEntryDirection] = useState({ x: 0, y: 0 });
  const [leaveDirection, setLeaveDirection] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleCopy = async () => {
    if (status !== "idle") return;

    setStatus("copying");
    await onCopy();

    setTimeout(() => {
      setStatus("copied");
    }, 100);

    setTimeout(() => {
      setStatus("idle");
    }, 2000);
  };

  const calculateDirection = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return { x: 0, y: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const offsetX = mouseX - centerX;
    const offsetY = mouseY - centerY;

    return { x: offsetX, y: offsetY };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const direction = calculateDirection(e);
    setEntryDirection(direction);

    // phase 1: instantly spawn at cursor position
    setBackgroundState("entering");

    // phase 2: animate to center after a brief moment
    setTimeout(() => {
      setBackgroundState("centered");
    }, 10);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const direction = calculateDirection(e);
    setLeaveDirection(direction);

    // phase 3: animate to leave direction
    setBackgroundState("leaving");

    // reset to hidden after animation completes
    setTimeout(() => {
      setBackgroundState("hidden");
    }, 150);
  };

  const getBackgroundAnimation = () => {
    switch (backgroundState) {
      case "hidden":
        return {
          opacity: 0,
          x: entryDirection.x,
          y: entryDirection.y,
          scale: 0.6,
          transition: { duration: 0 },
        };
      case "entering":
        return {
          opacity: 0,
          x: entryDirection.x,
          y: entryDirection.y,
          scale: 0.6,
          transition: { duration: 0 },
        };
      case "centered":
        return {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: { duration: 0.15, ease: easeOut },
        };
      case "leaving":
        return {
          opacity: 0,
          x: leaveDirection.x,
          y: leaveDirection.y,
          scale: 1,
          transition: { duration: 0.15, ease: easeOut },
        };
      default:
        return {
          opacity: 0,
          x: 0,
          y: 0,
          scale: 0.6,
          transition: { duration: 0 },
        };
    }
  };

  return (
    <div className="relative">
      {/* animated Background */}
      <motion.div
        className="absolute inset-0 rounded-md bg-border/50 dark:bg-border"
        style={{
          opacity: 0,
          x: 0,
          y: 0,
          scale: 0.6,
        }}
        animate={getBackgroundAnimation()}
      />

      <MotionButton
        ref={buttonRef}
        onClick={handleCopy}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 cursor-pointer bg-none text-muted-foreground transition duration-300 ease-out hover:scale-105 hover:bg-transparent hover:text-foreground dark:hover:text-white"
        aria-label="Copy code"
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        // disabled={status !== "idle"}
      >
        <div className="relative h-4 w-4">
          {/* Copy Icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={status}
            variants={copyIconVariants}
          >
            <Copy className="h-4 w-4" />
          </motion.div>

          {/* Check Icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={status}
            variants={checkIconVariants}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground dark:text-white"
            >
              <title>Check</title>
              <motion.path
                d="M4 12 9 17L20 6"
                animate={status}
                variants={checkPathVariants}
              />
            </svg>
          </motion.div>
        </div>
      </MotionButton>
    </div>
  );
};
