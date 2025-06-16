"use client";

import { getCookie, removeCookie, setCookie } from "@/lib/utils";
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
          return getCookie(name);
        },
        setItem: (name: string, value: string) => {
          setCookie(name, value, {
            maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            path: "/",
            sameSite: "lax",
          });
        },
        removeItem: (name: string) => {
          removeCookie(name, { path: "/" });
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
