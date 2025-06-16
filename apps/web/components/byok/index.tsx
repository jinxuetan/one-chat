"use client";

import { useApiKeys } from "@/hooks/use-api-keys";
import type { ApiProvider } from "@/lib/api-keys";
import { Key, Shield, Zap } from "lucide-react";
import { ProviderCard } from "./provider-card";

const PROVIDER_ORDER: ApiProvider[] = [
  "openrouter",
  "openai",
  "anthropic",
  "google",
];

export const BYOK = () => {
  const {
    keys,
    isValidating,
    validationStatus,
    saveKey,
    removeKey,
    clearValidation,
  } = useApiKeys();

  return (
    <div className="m-auto max-w-xl space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex rounded-full border border-border dark:border-border/60 bg-accent/50 dark:bg-accent/20 p-2 transition-colors duration-200">
          <Key className="size-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-xl text-foreground">Connect Your AI Models</h1>
          <p className="text-muted-foreground text-sm">
            Use your own API keys for unlimited access. Stored securely in your
            browser.
          </p>
        </div>

        <div className="flex justify-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            <span>Private</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            <span>Instant Setup</span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-6 bg-card/30 dark:bg-card/20 border border-border/30 dark:border-border/20 rounded-xl p-6 backdrop-blur-sm">
        {PROVIDER_ORDER.map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            existingKey={keys[provider]}
            isValidating={isValidating}
            validationResult={validationStatus[provider]}
            validationStatus={validationStatus}
            onSaveKey={saveKey}
            onRemoveKey={removeKey}
            onClearValidation={clearValidation}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-6 text-center text-muted-foreground text-sm">
        <div className="space-y-1">
          <p className="font-medium text-foreground">Your keys, your control</p>
          <p>Stored locally • Never shared • Always private</p>
        </div>
      </div>
    </div>
  );
};
