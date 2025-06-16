"use client";

import { useVoiceTranscription } from "@/hooks/use-voice-transcription";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Loader, Mic, MicOff } from "lucide-react";
import { motion } from "motion/react";
import { forwardRef, useImperativeHandle } from "react";

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export interface VoiceButtonRef {
  stop: () => void;
}

export const VoiceButton = forwardRef<VoiceButtonRef, VoiceButtonProps>(
  ({ onTranscript, disabled = false }, ref) => {
    const { isRecording, isConnecting, hasPermission, error, toggle, stop } =
      useVoiceTranscription({
        onTranscript,
        onError: (error: string) => toast.error(error),
      });

    useImperativeHandle(
      ref,
      () => ({
        stop,
      }),
      [stop]
    );

    const handleClick = async () => {
      if (disabled) return;
      await toggle();
    };

    const getTooltipText = () => {
      if (error) return `${error}`;
      if (isRecording) return "Stop dictating";
      if (isConnecting) return "Connecting...";
      if (!hasPermission) return "Grant microphone permission";
      return "Start dictating";
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isConnecting}
            className={cn("relative transition-all duration-200")}
          >
            {isConnecting ? (
              <Loader className="size-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}

            {/* Recording pulse indicator */}
            {isRecording && (
              <motion.div
                className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

VoiceButton.displayName = "VoiceButton";
