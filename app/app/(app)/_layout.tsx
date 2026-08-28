import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeStore } from "../../src/store/theme";

export default function AppLayout() {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500", marginBottom: 2 },
        tabBarItemStyle: { justifyContent: "center", paddingTop: 6 },
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 84,
          paddingBottom: 28,
          paddingTop: 6,
          backgroundColor: "transparent",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={mode === "dark" ? 40 : 50}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Цены",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "pricetags" : "pricetags-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: "Доска",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Поиск",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Premium",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "diamond" : "diamond-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Скрытые экраны */}
      <Tabs.Screen name="product/[id]" options={{ href: null, headerShown: true, title: "Сравнение" }} />
      <Tabs.Screen name="listing/[id]" options={{ href: null, headerShown: true, title: "Объявление" }} />
      <Tabs.Screen name="supplier-offers" options={{ href: null, headerShown: true, title: "Мои предложения" }} />
      <Tabs.Screen name="about" options={{ href: null, headerShown: true, title: "О приложении" }} />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: true, title: "Настройки" }} />
    </Tabs>
  );
}