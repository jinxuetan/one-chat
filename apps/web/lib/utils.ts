import type { CustomAnnotation, MessageWithMetadata } from "@/types";
import type { Model } from "./ai";
import { type ModelConfig, OPENROUTER_MODEL_MAP } from "./ai/config";

export const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/**
 * Resolves the AI model for a message, checking direct property first, then annotations fallback.
 */
export const resolveModel = (message: MessageWithMetadata): Model | null => {
  const model =
    message.model ??
    (message.annotations as CustomAnnotation[])?.find(
      (annotation) => annotation.type === "model"
    )?.model;

  const cookieModel = getModelFromCookie();

  return model ?? cookieModel ?? null;
};

/**
 * Sets the model preference cookie (client-side only)
 */
export const setModelCookie = (model: Model): void => {
  setCookie("chat-model", model, {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    sameSite: "lax",
  });
};

/**
 * Gets the model from cookie (client-side only)
 */
export const getModelFromCookie = (): Model | null => {
  return getCookie("chat-model") as Model | null;
};

/**
 * Resolves the initial model for a chat based on messages and cookie fallback
 * 1. If messages exist, use model from latest assistant message
 * 2. If no messages, use model from cookie
 * 3. If no cookie, use default model
 */
export const resolveInitialModel = (
  messages: MessageWithMetadata[],
  cookieModel: Model | null,
  defaultModel: Model
): Model => {
  if (cookieModel) return cookieModel;

  // Check if we have messages with model information
  if (messages.length > 0) {
    // Find the latest assistant message to get the model used
    const lastAssistantMessage = messages
      .filter((msg) => msg.role === "assistant")
      .pop();

    if (lastAssistantMessage) {
      const modelFromMessage = resolveModel(lastAssistantMessage);
      if (modelFromMessage) {
        return modelFromMessage;
      }
    }
  }

  return defaultModel;
};

export const getOpenRouterModel = (model: ModelConfig) => {
  if (model.apiProvider === "openrouter") return model.id;

  return (
    OPENROUTER_MODEL_MAP[model.id as keyof typeof OPENROUTER_MODEL_MAP] ??
    model.id
  );
};

/**
 * Cookie Management Utilities
 */

export interface CookieOptions {
  expires?: Date;
  maxAge?: number; // in seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  httpOnly?: boolean;
}

/**
 * Sets a cookie with specified options
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  if (typeof document === "undefined") return;

  const {
    expires,
    maxAge,
    path = "/",
    domain,
    secure,
    sameSite = "lax",
    httpOnly,
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `;expires=${expires.toUTCString()}`;
  }

  if (maxAge !== undefined) {
    cookieString += `;max-age=${maxAge}`;
  }

  if (path) {
    cookieString += `;path=${path}`;
  }

  if (domain) {
    cookieString += `;domain=${domain}`;
  }

  if (secure) {
    cookieString += `;secure`;
  }

  if (sameSite) {
    cookieString += `;samesite=${sameSite}`;
  }

  if (httpOnly) {
    cookieString += `;httponly`;
  }

  document.cookie = cookieString;
};

/**
 * Gets a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

/**
 * Removes a cookie by setting its expiry date to the past
 */
export const removeCookie = (
  name: string,
  options: Pick<CookieOptions, "path" | "domain"> = {}
): void => {
  const { path = "/", domain } = options;

  setCookie(name, "", {
    expires: new Date(0),
    path,
    domain,
  });
};

/**
 * Checks if a cookie exists
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Gets all cookies as an object
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof document === "undefined") return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(";");

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, ...valueParts] = cookie.split("=");
    if (name && valueParts.length > 0) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(
        valueParts.join("=")
      );
    }
  }

  return cookies;
};
