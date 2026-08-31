import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/auth";
import { useThemeStore } from "../src/store/theme"; // Исправили путь на правильный файл стора тем

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const loadTheme = useThemeStore((s) => s.load); // Используем метод load из стора темы

  useEffect(() => {
    loadToken();
    if (loadTheme) {
      loadTheme(); 
    }
  }, [loadToken, loadTheme]);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}