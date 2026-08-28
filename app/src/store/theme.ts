import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { githubDark, githubLight } from "../theme";

type Mode = "dark" | "light";

export const useThemeStore = create<{
  mode: Mode;
  colors: typeof githubDark;
  setMode: (m: Mode) => Promise<void>;
  load: () => Promise<void>;
}>((set) => ({
  mode: "dark",
  colors: githubDark,
  setMode: async (mode) => {
    await SecureStore.setItemAsync("theme", mode);
    set({ mode, colors: mode === "dark" ? githubDark : githubLight });
  },
  load: async () => {
    const saved = (await SecureStore.getItemAsync("theme")) as Mode | null;
    const mode = saved === "light" ? "light" : "dark";
    set({ mode, colors: mode === "dark" ? githubDark : githubLight });
  },
}));