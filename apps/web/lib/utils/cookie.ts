import type { Model } from "@/lib/ai";
import { type ModelConfig, OPENROUTER_MODEL_MAP } from "@/lib/ai/config";
import { useCallback, useState } from "react";

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
 * Sets the routing preference cookie (client-side only)
 * @param isRestrictedToOpenRouter - true for OpenRouter, false for native APIs
 */
export const setRoutingCookie = (isRestrictedToOpenRouter: boolean): void => {
  setCookie("model-routing", isRestrictedToOpenRouter.toString(), {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    sameSite: "lax",
  });
};

/**
 * Gets the routing preference from cookie (client-side only)
 * @returns boolean - true for OpenRouter, false for native APIs, null if not set
 */
export const getRoutingFromCookie = (): boolean | null => {
  const value = getCookie("model-routing");
  if (value === null) return null;
  return value === "true";
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
    cookieString += ";secure";
  }

  if (sameSite) {
    cookieString += `;samesite=${sameSite}`;
  }

  if (httpOnly) {
    cookieString += ";httponly";
  }

  // biome-ignore lint/nursery/noDocumentCookie: <explanation>
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

/**
 * Sets the has-keys flag cookie (client-side only)
 * @param hasKeys - true if user has at least one API key configured
 * @param userId - the user ID to make the cookie user-specific
 */
export const setHasKeysCookie = (hasKeys: boolean, userId: string): void => {
  setCookie(`has-api-keys-${userId}`, hasKeys.toString(), {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    sameSite: "lax",
  });
};

/**
 * Gets the has-keys flag from cookie (client-side only)
 * @param userId - the user ID to check the user-specific cookie
 * @returns boolean - true if user has keys, false if not, null if not set
 */
export const getHasKeysFromCookie = (userId: string): boolean | null => {
  const value = getCookie(`has-api-keys-${userId}`);
  if (value === null) return null;
  return value === "true";
};

/**
 * React hook for managing routing preference with automatic cookie persistence
 * @param defaultValue - Default routing preference if no cookie is set
 * @returns [isRestrictedToOpenRouter, setIsRestrictedToOpenRouter]
 */
export const useRoutingPreference = (defaultValue = false) => {
  const [isRestrictedToOpenRouter, setIsRestrictedToOpenRouterState] =
    useState<boolean>(() => {
      const cookieValue = getRoutingFromCookie();
      return cookieValue !== null ? cookieValue : defaultValue;
    });

  const setIsRestrictedToOpenRouter = useCallback((value: boolean) => {
    setIsRestrictedToOpenRouterState(value);
    setRoutingCookie(value);
  }, []);

  return [isRestrictedToOpenRouter, setIsRestrictedToOpenRouter] as const;
};
