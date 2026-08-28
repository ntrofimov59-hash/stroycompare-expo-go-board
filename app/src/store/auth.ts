import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type User = {
  id: string;
  email?: string;
  first_name: string;
  last_name?: string;
  role: "buyer" | "supplier" | "admin";
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null; // <-- Добавили поле для рефреш-токена
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User, refreshToken?: string) => Promise<void>; // <-- Принимаем рефреш
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
};

const storage = {
  async get(key: string) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null, // <-- Инициализация
  user: null,
  isLoading: true,

  setAuth: async (token, user, refreshToken) => {
    await storage.set("access_token", token);
    if (refreshToken) {
      await storage.set("refresh_token", refreshToken); // <-- Сохраняем рефреш
    }
    await storage.set("user", JSON.stringify(user));
    
    set((state) => ({
      accessToken: token,
      refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
      user,
    }));
  },

  logout: async () => {
    await storage.remove("access_token");
    await storage.remove("refresh_token"); // <-- Удаляем рефреш при выходе
    await storage.remove("user");
    set({ accessToken: null, refreshToken: null, user: null });
  },

  loadToken: async () => {
    try {
      const token = await storage.get("access_token");
      const refreshToken = await storage.get("refresh_token"); // <-- Загружаем рефреш
      const userStr = await storage.get("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      set({ accessToken: token, refreshToken, user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));