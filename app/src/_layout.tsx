import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/auth";
import { useThemeStore } from "../src/store/settings"; // Путь к твоему стору тем

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const loadTheme = useThemeStore((s) => s.load); // Или s.loadTheme, если метод так называется в сторе темы

  useEffect(() => {
    loadToken();
    if (loadTheme) {
      loadTheme(); // Загружаем сохраненную тему при старте
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