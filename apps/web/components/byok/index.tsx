"use client";

import { useApiKeys } from "@/hooks/use-api-keys";
import type { ApiProvider } from "@/lib/api-keys";
import { Key } from "lucide-react";
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
    <div className="m-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex rounded-full border border-border bg-accent/50 p-2 transition-colors duration-200 dark:border-border/60 dark:bg-accent/20">
          <Key className="size-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-foreground text-xl">
            Connect Your AI Models
          </h1>
          <p className="text-muted-foreground text-sm">
            Use your own API keys for unlimited access. Stored securely in your
            browser.
          </p>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-6 rounded-xl border border-border/30 bg-card/30 p-4 backdrop-blur-sm sm:p-6 dark:border-border/20 dark:bg-card/20">
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
      <div className="text-center text-muted-foreground text-sm">
        <div className="space-y-1">
          <p className="font-medium text-foreground">Your keys, your control</p>
          <p>Stored locally • Never shared • Always private</p>
        </div>
      </div>
    </div>
  );
};
