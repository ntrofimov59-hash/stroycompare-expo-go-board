import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

type SettingsState = {
  regionId: string;
  regionName: string;
  setRegion: (id: string, name: string) => Promise<void>;
  load: () => Promise<void>;
};

const storage = {
  async get(key: string) {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};

// Москва из seed
const DEFAULT_REGION = {
  id: "a0000001-0000-0000-0000-000000000001",
  name: "Москва",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  regionId: DEFAULT_REGION.id,
  regionName: DEFAULT_REGION.name,

  setRegion: async (id, name) => {
    await storage.set("region_id", id);
    await storage.set("region_name", name);
    set({ regionId: id, regionName: name });
  },

  load: async () => {
    const id = (await storage.get("region_id")) || DEFAULT_REGION.id;
    const name = (await storage.get("region_name")) || DEFAULT_REGION.name;
    set({ regionId: id, regionName: name });
  },
}));