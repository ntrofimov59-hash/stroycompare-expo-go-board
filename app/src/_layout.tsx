import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/auth";

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);

  useEffect(() => {
    loadToken();
  }, []);

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