"use client";

import { useApiKeys } from "@/hooks/use-api-keys";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Loader, Square, Volume2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ProviderIcon } from "./model-selection-popover";

interface TTSButtonProps {
  text: string;
  className?: string;
  onOpenChange: (open: boolean) => void;
  isOpen: boolean;
}

type TTSModel =
  | "gpt-4o-mini-tts"
  | "tts-1"
  | "tts-1-hd"
  | "gemini-2.5-flash-preview-tts"
  | "gemini-2.5-pro-preview-tts";

type TTSProvider = "openai" | "google";

const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

const GEMINI_VOICES = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
];

const TTS_MODELS: {
  id: TTSModel;
  name: string;
  description: string;
  provider: TTSProvider;
  defaultVoice: string;
}[] = [
  {
    id: "gpt-4o-mini-tts",
    name: "GPT-4o Mini TTS",
    description: "Fast & efficient",
    provider: "openai",
    defaultVoice: "alloy",
  },
  {
    id: "tts-1",
    name: "TTS-1",
    description: "Standard quality",
    provider: "openai",
    defaultVoice: "alloy",
  },
  {
    id: "tts-1-hd",
    name: "TTS-1 HD",
    description: "High quality",
    provider: "openai",
    defaultVoice: "alloy",
  },
  {
    id: "gemini-2.5-flash-preview-tts",
    name: "Gemini 2.5 Flash TTS",
    description: "Google's fast TTS",
    provider: "google",
    defaultVoice: "Kore",
  },
  {
    id: "gemini-2.5-pro-preview-tts",
    name: "Gemini 2.5 Pro TTS",
    description: "Google's premium TTS",
    provider: "google",
    defaultVoice: "Kore",
  },
];

export const TTSButton = memo<TTSButtonProps>(
  ({ text, className, onOpenChange, isOpen }) => {
    const { keys } = useApiKeys();
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const stopAudio = useCallback(() => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        setIsPlaying(false);
      }
    }, []);

    const generateSpeech = trpc.voice.textToSpeech.useMutation({
      onSuccess: (data) => {
        try {
          // Stop any currently playing audio
          stopAudio();

          // Create audio element and play
          const audio = new Audio(
            `data:audio/${data.format};base64,${data.audio}`
          );

          currentAudioRef.current = audio;
          setIsPlaying(true);

          // Handle audio end
          audio.onended = () => {
            setIsPlaying(false);
            currentAudioRef.current = null;
          };

          // Handle audio error
          audio.onerror = () => {
            console.error("Audio playback failed");
            toast.error("Audio playback failed");
            setIsPlaying(false);
            currentAudioRef.current = null;
          };

          audio.play();
        } catch (error) {
          console.error("Failed to play audio:", error);
          toast.error("Failed to play audio");
          setIsPlaying(false);
        }
      },
      onError: (error) => {
        toast.error(error.message);
        setIsPlaying(false);
      },
    });

    const handleModelSelect = useCallback(
      (model: TTSModel) => {
        if (!text.trim()) {
          toast.error("No text to convert to speech");
          return;
        }

        if (text.length > 4000) {
          toast.error(`Text is too long (${text.length}/4000 characters)`);
          return;
        }

        const modelConfig = TTS_MODELS.find((m) => m.id === model);
        if (!modelConfig) return;

        const apiKey =
          modelConfig.provider === "openai" ? keys.openai : keys.google;

        generateSpeech.mutate({
          text: text.trim(),
          model,
          voice: modelConfig.defaultVoice,
          speed: 1.0,
          provider: modelConfig.provider,
          apiKey: apiKey || undefined,
        });
      },
      [text, generateSpeech, keys.openai, keys.google]
    );

    // Cleanup audio on unmount
    useEffect(() => {
      return () => {
        stopAudio();
      };
    }, [stopAudio]);

    const isLoading = generateSpeech.isPending;
    const hasOpenAIKey = Boolean(keys.openai);
    const hasGoogleKey = Boolean(keys.google);
    const isTextTooLong = text.length > 4000;
    const isDisabled = (isLoading && !isPlaying) || !text.trim();

    const handleButtonClick = () => {
      if (isPlaying) {
        stopAudio();
      }
    };

    return (
      <DropdownMenu onOpenChange={onOpenChange} open={isOpen && !isPlaying}>
        <Tooltip>
          <TooltipTrigger asChild>
            {isPlaying ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn("group/tts", className)}
                onClick={handleButtonClick}
              >
                <Square
                  size={14}
                  className="text-muted-foreground group-hover/tts:text-foreground"
                />
              </Button>
            ) : (
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("group/tts", className)}
                  disabled={isDisabled}
                >
                  {isLoading ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    <Volume2
                      size={14}
                      className="text-muted-foreground group-hover/tts:text-foreground"
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPlaying
              ? "Stop audio"
              : isLoading
              ? "Generating speech..."
              : isTextTooLong
              ? `Speech - Text too long (${text.length}/4000 characters)`
              : "Text to Speech"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="w-48"
          sideOffset={4}
        >
          {!hasOpenAIKey && !hasGoogleKey && (
            <div className="px-3 pt-2 text-start">
              <span className="font-medium text-sm text-muted-foreground">
                Add OpenAI or Gemini API key to use TTS
              </span>
            </div>
          )}

          {TTS_MODELS.map((model) => {
            const canUseModel =
              model.provider === "openai" ? hasOpenAIKey : hasGoogleKey;

            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                disabled={!canUseModel || isLoading}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <ProviderIcon
                  provider={model.provider}
                  className="size-4 flex-shrink-0"
                />
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-sm">{model.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {model.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

TTSButton.displayName = "TTSButton";
