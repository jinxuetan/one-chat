"use client";

import { useApiKeys } from "@/hooks/use-api-keys";
import type { ApiProvider } from "@/lib/api-keys";
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
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h1 className="font-medium text-lg text-foreground">API Keys</h1>
        <p className="text-muted-foreground text-sm">
          Add your API keys to access AI models. Keys are stored locally in your
          browser.
        </p>
      </div>

      {/* Provider List */}
      <div className="space-y-4">
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
    </div>
  );
};
