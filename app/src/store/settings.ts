import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "system" | "light" | "dark";
export type LanguageCode = "ru" | "en";

interface SettingsState {
  regionId: string;
  regionName: string;
  hasSelectedRegion: boolean;
  theme: ThemeMode;
  language: LanguageCode;
  
  setRegion: (id: string, name: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
}

// Кастомный сторадж на базе твоих проверенных SecureStore / localStorage
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

const DEFAULT_REGION = {
  id: "",
  name: "",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      regionId: DEFAULT_REGION.id,
      regionName: DEFAULT_REGION.name,
      hasSelectedRegion: false,
      theme: "system",
      language: "ru",

      setRegion: (id, name) => set({ 
        regionId: id, 
        regionName: name, 
        hasSelectedRegion: true 
      }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => customStorage),
    }
  )
);