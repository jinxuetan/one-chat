"use client";

import type { ApiProvider } from "@/lib/api-keys";
import { PROVIDER_CONFIGS, obfuscateKey } from "@/lib/api-keys";
import { Anthropic, Google, OpenAI, OpenRouter } from "@lobehub/icons";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import {
  CheckCircle,
  Eye,
  EyeOff,
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
    <div className="space-y-4 border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={provider} className="size-6" />
          <div>
            <h3 className="font-medium text-sm text-foreground">
              {config.name}
            </h3>
            <p className="text-muted-foreground text-xs">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider === "openrouter" && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}
          {hasExistingKey ? (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="mr-1 size-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Not configured
            </Badge>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={`${provider}-api-key`}
              type={showKey ? "text" : "password"}
              value={hasExistingKey ? displayKey : key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={`Enter ${config.name} API key`}
              disabled={hasExistingKey}
              className={cn(
                "pr-10",
                validationResult?.isValid === false && "border-destructive"
              )}
            />

            {hasExistingKey ? (
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
                <CopyButton onCopy={handleCopyKey} className="rounded-sm" />
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0.5 rounded-sm top-1/2 size-8 -translate-y-1/2 px-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            )}
          </div>

          {hasExistingKey ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveKey}
              className="text-destructive hover:bg-destructive/10 size-9"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSaveKey}
              disabled={isButtonDisabled}
              size="sm"
              className="h-9"
            >
              {isSaving ? <Loader className="size-4 animate-spin" /> : "Save"}
            </Button>
          )}
        </div>

        {validationResult?.error && (
          <div className="flex items-start gap-2 rounded border-l-2 border-destructive bg-destructive/5 p-2 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 flex-shrink-0" />
            <span>
              {validationResult.error.includes("format")
                ? getValidationHint()
                : validationResult.error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
