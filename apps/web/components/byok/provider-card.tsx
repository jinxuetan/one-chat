"use client";

import type { ApiProvider } from "@/lib/api-keys";
import { PROVIDER_CONFIGS, obfuscateKey } from "@/lib/api-keys";
import { Anthropic, Google, OpenAI, OpenRouter } from "@lobehub/icons";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Input } from "@workspace/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import {
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Loader,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ProviderCardProps {
  provider: ApiProvider;
  existingKey?: string;
  isValidating: boolean;
  validationResult?: { isValid: boolean; error?: string } | null;
  validationStatus: Record<
    ApiProvider,
    { isValid: boolean; error?: string } | null
  >;
  onSaveKey: (provider: ApiProvider, key: string) => Promise<void>;
  onRemoveKey: (provider: ApiProvider) => void;
  onClearValidation: (provider: ApiProvider) => void;
}

const PROVIDER_ICONS = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  openrouter: OpenRouter,
} as const;

const ProviderIcon = ({
  provider,
  className,
}: {
  provider: ApiProvider;
  className?: string;
}) => {
  const Icon = PROVIDER_ICONS[provider];
  return Icon ? <Icon className={cn("size-5", className)} /> : null;
};

export const ProviderCard = ({
  provider,
  existingKey,
  isValidating,
  validationResult,
  validationStatus,
  onSaveKey,
  onRemoveKey,
  onClearValidation,
}: ProviderCardProps) => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const config = PROVIDER_CONFIGS[provider];
  const hasExistingKey = Boolean(existingKey);

  const handleSaveKey = async () => {
    if (!key.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveKey(provider, key.trim());
      setKey("");
      setShowKey(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !hasExistingKey) {
      e.preventDefault();
      handleSaveKey();
    }
  };

  const handleBlur = () => {
    // Clear validation errors when user clicks away from input
    if (validationResult?.error) {
      onClearValidation(provider);
    }
  };

  const handleCopyKey = async () => {
    if (!existingKey) return;
    await navigator.clipboard.writeText(existingKey);
  };

  const handleRemoveKey = () => {
    onRemoveKey(provider);
    setKey("");
    setShowKey(false);
  };

  const displayKey =
    hasExistingKey && existingKey ? obfuscateKey(existingKey) : key;

  // Only show validating state if this specific provider is being validated
  const isCurrentProviderValidating =
    isValidating && validationStatus[provider] === null;

  const isButtonDisabled =
    !key.trim() || isSaving || isCurrentProviderValidating;

  // Get detailed validation requirements
  const getValidationHint = () => {
    switch (provider) {
      case "openai":
      case "anthropic":
      case "openrouter":
        return `Must start with ${config.keyPrefix} and be at least 35 characters long`;
      case "google":
        return `Must start with ${config.keyPrefix} and be at least 39 characters long`;
      default:
        return `Must start with ${config.keyPrefix}`;
    }
  };

  return (
    <div
      className={cn(
        "space-y-3 border-border/20 border-b pb-6 last:border-b-0 last:pb-0 dark:border-border/10"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={provider} className="size-8" />
          <div>
            <h3 className="font-medium text-base text-foreground">
              {config.name}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider === "openrouter" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="h-5 border-blue-200 bg-blue-50 text-blue-700 text-xs dark:border-blue-800/50 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  Recommended
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  One key unlocks all models available through OpenRouter
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {provider === "openai" && config.requiresVerification && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="h-5 border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-400"
                >
                  <Info className="mr-1 size-3" />
                  Verification
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="text-sm">{config.verificationNote}</p>
                  {config.verificationUrl && (
                    <a
                      href={config.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-800 dark:hover:text-neutral-700 hover:text-neutral-300 hover:underline mb-1"
                    >
                      Verify organization
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {hasExistingKey ? (
            <Badge
              variant="default"
              className="h-5 border-green-200 bg-green-100 text-green-700 text-xs dark:border-green-800/50 dark:bg-green-950/50 dark:text-green-400"
            >
              <CheckCircle className="mr-1 size-3" />
              Ready
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="h-5 border-orange-200 bg-orange-50 text-orange-700 text-xs dark:border-orange-800/50 dark:bg-orange-950/50 dark:text-orange-400"
            >
              Setup required
            </Badge>
          )}
        </div>
      </div>

      {/* Input with inline button */}
      <div className="space-y-2">
        <label htmlFor={`${provider}-api-key`} className="sr-only">
          {config.name} API Key
        </label>

        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <form autoComplete="off">
              <Input
                id={`${provider}-api-key`}
                type={showKey ? "text" : "password"}
                value={hasExistingKey ? displayKey : key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={`${config.name} API key (${config.keyPrefix}...)`}
                disabled={hasExistingKey}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                aria-invalid={validationResult?.isValid === false}
                aria-describedby={
                  validationResult?.error ? `${provider}-error` : undefined
                }
                className={cn(
                  "h-9 border-border bg-background pr-10 text-base transition-colors duration-200 focus-visible:border-border/80 dark:border-border/60 dark:bg-card/50 dark:focus-visible:border-border/80",
                  validationResult?.isValid === false &&
                    "border-destructive/50 focus-visible:border-destructive dark:border-destructive/30 dark:focus-visible:border-destructive/80"
                )}
              />

              {hasExistingKey ? (
                <div className="absolute top-0 right-0 flex size-9 items-center justify-center">
                  <CopyButton
                    onCopy={handleCopyKey}
                    className="rounded-sm transition-colors duration-200 hover:bg-accent dark:hover:bg-accent/60"
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 size-9 px-0 transition-colors duration-200 hover:bg-accent dark:hover:bg-accent/60"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              )}
            </form>
          </div>

          {hasExistingKey ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveKey}
                  className="h-9 text-muted-foreground text-sm transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive dark:hover:border-destructive/20 dark:hover:bg-destructive/5"
                >
                  <Trash2 className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Delete API key</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleSaveKey}
              disabled={isButtonDisabled}
              size="sm"
              className="h-9 w-16 bg-primary text-sm transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
            >
              {isSaving ? <Loader className="size-3 animate-spin" /> : "Save"}
            </Button>
          )}
        </div>

        {validationResult?.error && (
          <div
            id={`${provider}-error`}
            role="alert"
            aria-live="polite"
            className="flex max-w-full items-start gap-1.5 rounded-r-md border-destructive/20 border-l-2 bg-destructive/5 py-2 pl-2 text-destructive text-sm dark:border-destructive/10 dark:bg-destructive/5 dark:text-destructive/90"
          >
            <XCircle className="mt-0.5 size-3 flex-shrink-0" />
            <span className="min-w-0 flex-1 break-words">
              {validationResult.error.includes("format")
                ? getValidationHint()
                : validationResult.error}
            </span>
          </div>
        )}
      </div>
      {provider === "openrouter" && (
        <p className="text-muted-foreground text-sm">
          One key unlocks all models available through OpenRouter
        </p>
      )}
    </div>
  );
};
