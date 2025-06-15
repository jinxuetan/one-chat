"use client";

import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PinnedThreadsState {
  pinnedThreadIds: string[];
  isLoaded: boolean;
  togglePin: (threadId: string) => void;
  isPinned: (threadId: string) => boolean;
  unpinThread: (threadId: string) => void;
  pinThread: (threadId: string) => void;
  setIsLoaded: (loaded: boolean) => void;
}

const PINNED_THREADS_STORAGE_KEY = "pinned-threads";

const storeCreator: StateCreator<
  PinnedThreadsState,
  [],
  [],
  PinnedThreadsState
> = (set, get) => ({
  pinnedThreadIds: [],
  isLoaded: false,

  togglePin: (threadId: string) => {
    set((state) => {
      const newIds = state.pinnedThreadIds.includes(threadId)
        ? state.pinnedThreadIds.filter((id) => id !== threadId)
        : [...state.pinnedThreadIds, threadId];

      return {
        ...state,
        pinnedThreadIds: newIds,
      };
    });
  },

  isPinned: (threadId: string) => {
    const state = get();
    return state.pinnedThreadIds.includes(threadId);
  },

  unpinThread: (threadId: string) => {
    set((state) => {
      const newIds = state.pinnedThreadIds.filter((id) => id !== threadId);

      return {
        ...state,
        pinnedThreadIds: newIds,
      };
    });
  },

  pinThread: (threadId: string) => {
    set((state) => {
      if (!state.pinnedThreadIds.includes(threadId)) {
        const newIds = [...state.pinnedThreadIds, threadId];

        return {
          ...state,
          pinnedThreadIds: newIds,
        };
      }

      return state;
    });
  },

  setIsLoaded: (loaded: boolean) => {
    set((state) => ({
      ...state,
      isLoaded: loaded,
    }));
  },
});

export const usePinnedThreads = create<PinnedThreadsState>()(
  persist(storeCreator, {
    name: PINNED_THREADS_STORAGE_KEY,
    storage: createJSONStorage(() => {
      // Custom storage implementation using cookies
      return {
        getItem: (name: string) => {
          if (typeof document === "undefined") return null;

          const nameEQ = `${name}=`;
          const ca = document.cookie.split(";");

          for (let c of ca) {
            while (c.charAt(0) === " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length, c.length);
            }
          }

          return null;
        },
        setItem: (name: string, value: string) => {
          if (typeof document === "undefined") return;

          const expires = new Date();
          expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        },
        removeItem: (name: string) => {
          if (typeof document === "undefined") return;

          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        },
      };
    }),
    partialize: (state) => ({ pinnedThreadIds: state.pinnedThreadIds }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.setIsLoaded(true);
      }
    },
  })
);
