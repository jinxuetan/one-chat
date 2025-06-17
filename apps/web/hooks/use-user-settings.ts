"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserSettings {
  // Personal Information
  name: string;
  occupation: string;

  // AI Personality Traits (based on common user customization options)
  traits: string[];

  // Additional Context
  additionalContext: string;

  // Chat Preferences
  responseStyle: "concise" | "detailed" | "balanced";
  usePersonalization: boolean;
}

export interface UserSettingsStore {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  addTrait: (trait: string) => void;
  removeTrait: (trait: string) => void;
}

const defaultSettings: UserSettings = {
  name: "",
  occupation: "",
  traits: [],
  additionalContext: "",
  responseStyle: "balanced",
  usePersonalization: true,
};

export const useUserSettings = create<UserSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set(() => ({
          settings: defaultSettings,
        })),

      addTrait: (trait) =>
        set((state) => ({
          settings: {
            ...state.settings,
            traits: [...state.settings.traits, trait],
          },
        })),

      removeTrait: (trait) =>
        set((state) => ({
          settings: {
            ...state.settings,
            traits: state.settings.traits.filter((t) => t !== trait),
          },
        })),
    }),
    {
      name: "user-settings-storage",
      version: 1,
    }
  )
);
