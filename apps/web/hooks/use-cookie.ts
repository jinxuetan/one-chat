"use client";

import {
  type CookieOptions,
  getCookie,
  removeCookie,
  setCookie,
} from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export interface UseCookieOptions extends CookieOptions {
  defaultValue?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

export interface UseCookieReturn<T> {
  /** Current cookie value */
  value: T | null;
  /** Set the cookie value */
  setValue: (newValue: T | null) => void;
  /** Remove the cookie */
  removeCookie: () => void;
  /** Update cookie with new options */
  updateCookie: (newValue: T, newOptions?: CookieOptions) => void;
  /** Check if cookie exists */
  hasCookie: boolean;
}

/**
 * Custom hook for managing cookies with React state synchronization
 *
 * @param name - Cookie name
 * @param options - Cookie options and configuration
 * @returns Cookie management utilities
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { value, setValue, removeCookie } = useCookie('theme', {
 *   defaultValue: 'light',
 *   maxAge: 60 * 60 * 24 * 30 // 30 days
 * });
 *
 * // With JSON serialization
 * const { value, setValue } = useCookie('user-preferences', {
 *   defaultValue: { theme: 'dark', language: 'en' },
 *   serialize: JSON.stringify,
 *   deserialize: JSON.parse,
 *   maxAge: 60 * 60 * 24 * 365 // 1 year
 * });
 * ```
 */
export const useCookie = <T = string>(
  name: string,
  options: UseCookieOptions = {}
): UseCookieReturn<T> => {
  const {
    defaultValue,
    serialize = (value: any) => String(value),
    deserialize = (value: string) => value as T,
    ...cookieOptions
  } = options;

  // Initialize state with cookie value or default
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === "undefined") {
      return defaultValue ? (defaultValue as T) : null;
    }

    try {
      const item = getCookie(name);
      if (item === null) {
        return defaultValue ? (defaultValue as T) : null;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading cookie "${name}":`, error);
      return defaultValue ? (defaultValue as T) : null;
    }
  });

  // Check if cookie exists
  const [hasCookie, setHasCookie] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getCookie(name) !== null;
  });

  // Set cookie value
  const setValue = useCallback(
    (newValue: T | null) => {
      try {
        if (newValue === null) {
          removeCookie(name, cookieOptions);
          setStoredValue(null);
          setHasCookie(false);
        } else {
          const serializedValue = serialize(newValue);
          setCookie(name, serializedValue, cookieOptions);
          setStoredValue(newValue);
          setHasCookie(true);
        }
      } catch (error) {
        console.error(`Error setting cookie "${name}":`, error);
      }
    },
    [name, serialize, cookieOptions]
  );

  // Remove cookie
  const handleRemoveCookie = useCallback(() => {
    try {
      removeCookie(name, cookieOptions);
      setStoredValue(null);
      setHasCookie(false);
    } catch (error) {
      console.error(`Error removing cookie "${name}":`, error);
    }
  }, [name, cookieOptions]);

  // Update cookie with new options
  const updateCookie = useCallback(
    (newValue: T, newOptions?: CookieOptions) => {
      try {
        const serializedValue = serialize(newValue);
        const mergedOptions = { ...cookieOptions, ...newOptions };
        setCookie(name, serializedValue, mergedOptions);
        setStoredValue(newValue);
        setHasCookie(true);
      } catch (error) {
        console.error(`Error updating cookie "${name}":`, error);
      }
    },
    [name, serialize, cookieOptions]
  );

  // Listen for cookie changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = getCookie(name);
        if (item === null) {
          setStoredValue(defaultValue ? (defaultValue as T) : null);
          setHasCookie(false);
        } else {
          setStoredValue(deserialize(item));
          setHasCookie(true);
        }
      } catch (error) {
        console.warn(`Error syncing cookie "${name}":`, error);
      }
    };

    // Listen for storage events (when localStorage changes in other tabs)
    // Note: This won't capture direct cookie changes, but it's a common pattern
    window.addEventListener("storage", handleStorageChange);

    // Optional: Poll for cookie changes (for cross-tab synchronization)
    const interval = setInterval(() => {
      const currentCookieValue = getCookie(name);
      const currentExists = currentCookieValue !== null;

      if (currentExists !== hasCookie) {
        handleStorageChange();
      } else if (
        currentExists &&
        currentCookieValue !== serialize(storedValue)
      ) {
        handleStorageChange();
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [name, defaultValue, deserialize, serialize, hasCookie, storedValue]);

  return {
    value: storedValue,
    setValue,
    removeCookie: handleRemoveCookie,
    updateCookie,
    hasCookie,
  };
};
