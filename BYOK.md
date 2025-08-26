# BYOK (Bring Your Own Key) Implementation Guide

This document provides comprehensive information for implementing the exact same BYOK functionality from OneChat into another project with a similar tech stack.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [State Management & Hooks](#state-management--hooks)
4. [Backend Implementation](#backend-implementation)
5. [UI Dependencies & Styling](#ui-dependencies--styling)
6. [Integration Patterns](#integration-patterns)
7. [Security Implementation](#security-implementation)
8. [Installation & Setup](#installation--setup)

## Architecture Overview

OneChat's BYOK uses **AI SDK provider libraries** for direct API integration - no custom gateway layer.

### Key Architecture Principles
- **Direct Provider Integration**: Uses AI SDK's `createOpenAI`, `createAnthropic`, `createGoogleGenerativeAI`, `createOpenRouter`
- **Client-to-Provider Flow**: User API keys → Frontend → Backend → AI SDK Client → Provider API
- **No Custom Gateway**: Each provider client connects directly to respective AI provider APIs
- **OpenRouter as Universal Proxy**: Optional gateway for accessing multiple models with single key

### File Structure
```
components/byok/
├── index.tsx          # Main BYOK management interface
├── model.tsx          # Modal wrapper for BYOK dialog
└── provider-card.tsx  # Individual provider configuration cards

hooks/
├── use-api-keys.ts        # Core API key management (validation, encryption, storage)
├── use-local-storage.ts   # SSR-safe localStorage with cross-tab sync
├── use-event-callback.ts  # Stable event handler references
├── use-event-listener.ts  # Type-safe event listener management
└── use-isomorphic-layout-effect.ts # SSR-compatible layout effect

lib/
├── api-keys.ts           # Provider configs, validation logic, encryption utilities
├── ai/models.ts          # AI SDK client creation and model resolution
└── utils/cookie.ts       # Cookie-based persistence for has-keys flags

app/api/
└── validate/route.ts     # API key validation proxy (CORS handling for Anthropic)
```

### Required Dependencies
```bash
# AI SDK Providers (Core)
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @openrouter/ai-sdk-provider ai

# UI & Icons
npm install @lobehub/icons lucide-react motion sonner

# Shadcn UI Components
npx shadcn@canary add button input dialog badge copy-button

# Authentication & Environment (if needed)
npm install better-auth @t3-oss/env-core zod
```

## Core Components

### 1. Main BYOK Component (`components/byok/index.tsx`)

```tsx
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
```

### 2. BYOK Modal Component (`components/byok/model.tsx`)

```tsx
"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { Box } from "lucide-react";
import { BYOK } from "./index";

export const BYOKModel = () => {
  const { open } = useSidebar();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Box className="size-4" />
          Manage Models
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[90vh] w-full max-w-[90%] overflow-y-auto md:w-fit md:max-w-4xl p-4",
          open && "md:left-[calc(50%+8rem)]"
        )}
      >
        <BYOK />
      </DialogContent>
    </Dialog>
  );
};
```

### 3. Provider Card Component (`components/byok/provider-card.tsx`)

**Key Features:**
- Individual provider configuration cards
- Real-time validation with visual feedback
- Secure key input with show/hide toggle
- Copy functionality for existing keys
- Error handling with detailed validation hints

**Props Interface:**
```tsx
interface ProviderCardProps {
  provider: ApiProvider;
  existingKey?: string;
  isValidating: boolean;
  validationResult?: { isValid: boolean; error?: string } | null;
  validationStatus: Record<ApiProvider, { isValid: boolean; error?: string } | null>;
  onSaveKey: (provider: ApiProvider, key: string) => Promise<void>;
  onRemoveKey: (provider: ApiProvider) => void;
  onClearValidation: (provider: ApiProvider) => void;
}
```

**UI States:**
- **Not configured**: Shows input field with save button
- **Connected**: Shows obfuscated key with copy and remove buttons
- **Validating**: Shows loading spinner
- **Error**: Shows validation error with helpful hints

## State Management & Hooks

### 1. Core API Keys Hook (`hooks/use-api-keys.ts`)

**Purpose**: Centralized API key management with validation, encryption, and persistence.

**Key Features:**
- Local storage with user-specific encryption
- Real-time validation against provider APIs
- Cookie-based persistence flags
- Model selection integration
- Toast notifications

**Return Interface:**
```tsx
interface UseApiKeysReturn {
  keys: ApiKeys;
  hasKeys: boolean;
  availableProviders: ApiProvider[];
  hasOpenRouter: boolean;
  isValidating: boolean;
  validationStatus: Record<ApiProvider, ValidationResult | null>;
  
  validateKey: (provider: ApiProvider, key: string) => Promise<ValidationResult>;
  saveKey: (provider: ApiProvider, key: string) => Promise<void>;
  removeKey: (provider: ApiProvider) => void;
  clearAllKeys: () => void;
  clearValidation: (provider: ApiProvider) => void;
  canUseModelWithKeys: (modelKey: string) => boolean;
  resetRouting: () => void;
}
```

### 2. Local Storage Hook (`hooks/use-local-storage.ts`)

**Purpose**: SSR-safe localStorage management with cross-tab synchronization.

**Key Features:**
- Server-side rendering compatibility
- Cross-tab synchronization via custom events
- Serialization/deserialization support
- Error handling and fallbacks

### 3. Supporting Utility Hooks

**useEventCallback**: Stable event handler references
**useEventListener**: Type-safe event listener management
**useIsomorphicLayoutEffect**: SSR-safe layout effect

## Backend Implementation

### 1. AI SDK Provider Integration (`lib/ai/models.ts`)

**Core Function - Direct Provider Client Creation:**
```tsx
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const getLanguageModel = (modelKey: Model, options: ModelOptions) => {
  const modelConfig = getModelByKey(modelKey);
  const provider = options.forceOpenRouter ? "openrouter" : modelConfig.apiProvider;

  const clients = {
    openai: () => {
      if (!options.apiKeys.openai) throw new Error("OpenAI API key required");
      // Creates direct client to api.openai.com
      const client = createOpenAI({ apiKey: options.apiKeys.openai });
      return client(modelConfig.id);
    },

    anthropic: () => {
      if (!options.apiKeys.anthropic) throw new Error("Anthropic API key required");
      // Creates direct client to api.anthropic.com
      const client = createAnthropic({ apiKey: options.apiKeys.anthropic });
      return client(modelConfig.id);
    },

    google: () => {
      if (!options.apiKeys.google) throw new Error("Google API key required");
      // Creates direct client to generativelanguage.googleapis.com
      const client = createGoogleGenerativeAI({ apiKey: options.apiKeys.google });
      return client(modelConfig.id, { useSearchGrounding: options.search });
    },

    openrouter: () => {
      if (!options.apiKeys.openrouter) throw new Error("OpenRouter API key required");
      // Creates client to OpenRouter gateway service
      const client = createOpenRouter({ apiKey: options.apiKeys.openrouter });
      return client(modelConfig.id);
    },
  };

  return { model: clients[provider](), config: modelConfig };
};
```

### 2. API Key Validation Proxy (`app/api/validate/route.ts`)

**Purpose**: CORS proxy for Anthropic validation only (others validate directly)
```tsx
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");

  // Only Anthropic needs CORS proxy - others validate directly from client
  if (provider !== "anthropic") {
    return NextResponse.json({ error: "Only Anthropic supported" }, { status: 400 });
  }

  try {
    // Proxy to Anthropic API to handle CORS
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
    
    return NextResponse.json({ 
      isValid: response.ok,
      error: response.ok ? undefined : "Invalid API key" 
    });
  } catch (_error) {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
};
```

### 3. API Key Configuration (`lib/api-keys.ts`)

**Provider Configurations with Direct Validation:**
```tsx
export const PROVIDER_CONFIGS: Record<ApiProvider, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "o4-mini, GPT-4o, GPT-4.1, o3, and ImageGen",
    validationEndpoint: "https://api.openai.com/v1/models", // Direct API call
    testMethod: "GET",
  },
  anthropic: {
    name: "Anthropic", 
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "Claude 4 Sonnet and Claude 3.7 Sonnet",
    validationEndpoint: `${env.NEXT_PUBLIC_APP_URL}/api/validate?provider=anthropic`, // CORS proxy
    testMethod: "GET",
  },
  google: {
    name: "Google AI",
    keyPrefix: "AIza", 
    keyPattern: /^AIza[A-Za-z0-9_-]{35,}$/,
    description: "Gemini 2.5 Pro, 2.5 Flash, and 2.0 Flash",
    validationEndpoint: "https://generativelanguage.googleapis.com/v1beta/models", // Direct API call
    testMethod: "GET",
  },
  openrouter: {
    name: "OpenRouter",
    keyPrefix: "sk-",
    keyPattern: /^sk-[A-Za-z0-9_-]{32,}$/,
    description: "Access all the models with one key",
    validationEndpoint: "https://openrouter.ai/api/v1/credits", // Direct API call
    testMethod: "GET",
  },
};
```

**Client-Side Validation Logic:**
```tsx
const validateKeyWithProvider = async (provider: ApiProvider, key: string) => {
  const config = PROVIDER_CONFIGS[provider];
  
  // Format validation first
  if (!validateApiKeyFormat(provider, key)) {
    return { isValid: false, error: `Invalid ${config.name} key format` };
  }

  const headers: Record<string, string> = {};
  
  // Provider-specific authentication headers
  switch (provider) {
    case "openai":
    case "openrouter":
      headers.Authorization = `Bearer ${key}`;
      break;
    case "anthropic":
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      break;
    case "google":
      // Uses query parameter: ?key=${key}
      break;
  }

  const url = provider === "google" 
    ? `${config.validationEndpoint}?key=${key}`
    : config.validationEndpoint;

  const response = await fetch(url, { method: config.testMethod, headers });
  return { isValid: response.ok };
};
```

## UI Dependencies & Styling

### Required Shadcn UI Components

```bash
# Core components needed
npx shadcn@canary add button
npx shadcn@canary add input
npx shadcn@canary add dialog
npx shadcn@canary add badge
npx shadcn@canary add sidebar

# Additional UI components
npx shadcn@canary add copy-button  # Custom animated copy component
npx shadcn@canary add sonner      # Toast notifications
```

### Required Icon Libraries

```bash
npm install lucide-react @lobehub/icons
```

### Animation Library

```bash
npm install motion
```

### Provider Icons Implementation

```tsx
import { Anthropic, Google, OpenAI, OpenRouter } from "@lobehub/icons";

const PROVIDER_ICONS = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  openrouter: OpenRouter,
} as const;

const ProviderIcon = ({ provider, className }: { provider: ApiProvider; className?: string; }) => {
  const Icon = PROVIDER_ICONS[provider];
  return Icon ? <Icon className={cn("size-5", className)} /> : null;
};
```

### Key Styling Classes

**Layout & Spacing:**
- `mx-auto max-w-2xl space-y-4` - Main container
- `space-y-4 border border-border rounded-lg p-4` - Provider card
- `flex items-center gap-3` - Icon and text layout

**Input Styling:**
- Password toggle with Eye/EyeOff icons
- Validation error states with destructive border
- Disabled state for existing keys

**Badge States:**
- `Connected` - Success state with CheckCircle icon
- `Not configured` - Outline variant
- `Recommended` - Secondary variant for OpenRouter

## Integration Patterns

### 1. Cookie Management

**Has-Keys Flag:**
```tsx
export const setHasKeysCookie = (hasKeys: boolean, userId: string): void => {
  setCookie(`has-api-keys-${userId}`, hasKeys.toString(), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
  });
};
```

**Model Routing:**
```tsx
export const setRoutingCookie = (isRestrictedToOpenRouter: boolean): void => {
  setCookie("model-routing", isRestrictedToOpenRouter.toString(), {
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
  });
};
```

### 2. Model Selection Integration

When saving a new API key, the system automatically:
1. Validates the key
2. Determines the best available model
3. Updates the model cookie
4. Shows success notification with new model name

```tsx
const saveKey = async (provider: ApiProvider, key: string): Promise<void> => {
  const validation = await validateKey(provider, key);
  
  if (!validation.isValid) {
    toast.error(validation.error || `Invalid ${PROVIDER_CONFIGS[provider].name} key`);
    throw new Error(validation.error);
  }

  const encryptedKey = encryptKey(key, resolvedUserId);
  setStoredKeys((prev) => ({ ...prev, [provider]: encryptedKey }));

  // Get updated keys including the new one
  const updatedKeys = { ...keys, [provider]: key };
  
  // Get the best available model with the new keys
  const bestModel = getBestAvailableDefaultModel(updatedKeys);
  
  // Set the new model as the default
  setModelCookie(bestModel);
  
  // Update the has-keys cookie flag
  setHasKeysCookie(true, resolvedUserId);
  
  // Get model config for display name
  const modelConfig = getModelByKey(bestModel);
  const modelName = modelConfig?.name || bestModel;

  toast.success(
    `${PROVIDER_CONFIGS[provider].name} key added successfully. Switched to ${modelName}.`
  );
};
```

### 3. Authentication Integration

The system integrates with user sessions to provide:
- User-specific key storage
- Session-based encryption keys
- Fallback to anonymous user handling

```tsx
export const useApiKeys = ({ userId }: { userId?: string } = {}): UseApiKeysReturn => {
  const { data: session } = useSession();
  const resolvedUserId = userId || session?.user?.id || "anonymous";
  
  // User-specific storage key
  const [storedKeys, setStoredKeys, clearStoredKeys] = useLocalStorage<Record<string, string>>(
    getKeyStorageKey(resolvedUserId), 
    {}
  );
  
  // Decrypt keys with user-specific encryption
  const keys: ApiKeys = {
    openai: storedKeys.openai ? decryptKey(storedKeys.openai, resolvedUserId) : undefined,
    anthropic: storedKeys.anthropic ? decryptKey(storedKeys.anthropic, resolvedUserId) : undefined,
    google: storedKeys.google ? decryptKey(storedKeys.google, resolvedUserId) : undefined,
    openrouter: storedKeys.openrouter ? decryptKey(storedKeys.openrouter, resolvedUserId) : undefined,
  };
  
  // ... rest of implementation
};
```

## Security Implementation

### 1. Client-Side Encryption

**XOR Encryption with User ID:**
```tsx
export const encryptKey = (key: string, userId: string): string => {
  const keyArray = key.split("");
  const userIdArray = userId.split("");

  return keyArray
    .map((char, index) => {
      const userChar = userIdArray[index % userIdArray.length] || userId[0] || "x";
      return String.fromCharCode(char.charCodeAt(0) ^ userChar.charCodeAt(0));
    })
    .join("");
};

export const decryptKey = (encryptedKey: string, userId: string): string => {
  return encryptKey(encryptedKey, userId); // XOR is reversible
};
```

### 2. Key Obfuscation for UI

```tsx
export const obfuscateKey = (key: string): string => {
  if (key.length <= 8) return key;
  const visibleStart = key.substring(0, 6);
  const visibleEnd = key.substring(key.length - 4);
  const hiddenCount = key.length - 10;
  return `${visibleStart}${"*".repeat(Math.min(hiddenCount, 20))}${visibleEnd}`;
};
```

### 3. Validation Security

**Format Validation:**
```tsx
export const validateApiKeyFormat = (provider: ApiProvider, key: string): boolean => {
  const config = PROVIDER_CONFIGS[provider];
  return config.keyPattern.test(key);
};
```

**API Validation with Provider-Specific Headers:**
```tsx
const validateKeyWithProvider = async (provider: ApiProvider, key: string): Promise<ValidationResult> => {
  const config = PROVIDER_CONFIGS[provider];

  // Format validation first
  if (!validateApiKeyFormat(provider, key)) {
    return {
      isValid: false,
      error: `Invalid ${config.name} key format. Must start with ${config.keyPrefix}`,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Provider-specific authentication headers
    switch (provider) {
      case "openai":
        headers.Authorization = `Bearer ${key}`;
        break;
      case "anthropic":
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
        break;
      case "google":
        break; // Uses query parameter
      case "openrouter":
        headers.Authorization = `Bearer ${key}`;
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "OneChat";
        break;
    }

    const url = provider === "google" 
      ? `${config.validationEndpoint}?key=${key}`
      : config.validationEndpoint;

    const response = await fetch(url, {
      method: config.testMethod,
      headers,
    });

    // Handle various HTTP status codes
    if (response.status === 401 || response.status === 400) {
      return {
        isValid: false,
        error: `Invalid ${config.name} API key. Please check your key.`,
      };
    }

    if (response.status === 403) {
      return {
        isValid: false,
        error: `${config.name} API key lacks required permissions.`,
      };
    }

    if (!response.ok) {
      return {
        isValid: false,
        error: `Failed to validate ${config.name} key. Please try again.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Network error while validating ${config.name} key.`,
    };
  }
};
```

## Quick Setup Guide

### 1. Install Dependencies
```bash
# AI SDK Providers (Required)
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @openrouter/ai-sdk-provider ai

# UI Components
npm install @lobehub/icons lucide-react motion sonner
npx shadcn@canary add button input dialog badge copy-button

# Environment & Auth (if needed)  
npm install @t3-oss/env-core zod better-auth
```

### 2. Implementation Checklist
**Core Files:**
- [ ] `lib/api-keys.ts` - Provider configs, validation, encryption
- [ ] `lib/ai/models.ts` - AI SDK client creation with user keys
- [ ] `hooks/use-api-keys.ts` - Main API key management hook
- [ ] `hooks/use-local-storage.ts` - SSR-safe localStorage with sync
- [ ] `components/byok/` - UI components for API key management
- [ ] `app/api/validate/route.ts` - CORS proxy for Anthropic validation

**Integration Points:**
- [ ] Chat API route receives `userApiKeys` in request body
- [ ] Model resolution passes user keys to AI SDK clients
- [ ] Frontend encrypts/decrypts keys for localStorage
- [ ] Cookie management for has-keys persistence flags


## How BYOK API Key Flow Works

**Complete Request Flow:**
```
1. User Input → Frontend (localStorage encryption)
2. Frontend → API Route (/api/chat) 
3. API Route → AI SDK Client Creation
4. AI SDK Client → Direct Provider API
5. Provider Response → User
```

**Key Integration Points:**
```tsx
// Frontend: Chat request with user API keys
const requestBody = {
  userApiKeys: {
    openai: userKeys.openai,
    anthropic: userKeys.anthropic, 
    google: userKeys.google,
    openrouter: userKeys.openrouter
  },
  // ... other request data
};

// Backend: Create AI SDK clients with user keys
const options: ModelOptions = {
  apiKeys: {
    openai: userApiKeys?.openai,
    anthropic: userApiKeys?.anthropic,
    google: userApiKeys?.google, 
    openrouter: userApiKeys?.openrouter,
  },
};

const { model } = getLanguageModel(selectedModel, options);
// model is now a direct AI SDK client using user's API key
```

**Provider-Specific Details:**
- **OpenAI/OpenRouter**: `Authorization: Bearer {key}` → Direct to provider API
- **Anthropic**: `x-api-key: {key}` → Direct to provider API  
- **Google**: `?key={key}` → Direct to provider API
- **Validation**: Most direct, Anthropic via CORS proxy only

## Critical Implementation Notes

### 1. Direct Provider Integration (No Gateway)
- OneChat uses **AI SDK provider libraries** that create **direct clients** to each AI provider
- Each `createProvider()` function connects directly to that provider's API endpoints
- User API keys are passed directly to the provider's servers
- **No custom gateway layer** - just AI SDK abstractions

### 2. OpenRouter as Universal Proxy Option
- OpenRouter itself acts as a gateway to multiple AI providers
- Users can route all requests through OpenRouter with a single key
- Controlled by `forceOpenRouter` option in the model resolution logic

### 3. Security & Storage
- **Client-side encryption**: XOR encryption with user ID before localStorage
- **Request-time decryption**: Keys decrypted in frontend before sending to backend
- **No server storage**: API keys only exist in memory during request processing
- **User-specific**: All storage keys are scoped to user ID (or "anonymous")

## Summary

OneChat's BYOK implementation provides a complete solution for user-managed API keys with:

**Core Features:**
- **Direct AI SDK Integration**: Uses official provider libraries for direct API connections
- **Client-Side Security**: XOR encryption with user ID for localStorage
- **Real-Time Validation**: Per-provider API key verification with error handling
- **Model Auto-Selection**: Automatically switches to best available model when keys are added
- **Cross-Tab Sync**: localStorage changes synchronized across browser tabs

**Key Architectural Decisions:**
- **No Custom Gateway**: Uses AI SDK provider abstractions for direct provider communication
- **OpenRouter as Universal Proxy**: Optional single-key access to multiple models
- **Request-Time Decryption**: Keys only decrypted when needed for API calls
- **CORS Proxy Only for Anthropic**: All other providers validate directly from client

This implementation provides a secure, user-friendly BYOK system that seamlessly integrates with AI SDK providers while maintaining complete user control over their API keys.