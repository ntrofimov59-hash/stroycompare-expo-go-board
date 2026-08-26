import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 9,
        marginBottom: 1,
        color: focused ? "#2AABEE" : "#707579",
        fontWeight: focused ? "600" : "400",
      }}
    >
      {label}
    </Text>
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTitleStyle: { fontWeight: "600", fontSize: 17, color: "#0F172A" },
        headerShadowVisible: false,
        tabBarShowLabel: true,
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 4,
        },
        // Сделали таб-бар компактнее (высота 56 вместо 64)
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 10,
          height: 56,
          paddingTop: 4,
          paddingBottom: 6,
          borderRadius: 20,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: "hidden" }]}>
            <BlurView
              intensity={Platform.OS === "ios" ? 55 : 90}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor:
                    Platform.OS === "android"
                      ? "rgba(255,255,255,0.88)"
                      : "rgba(255,255,255,0.55)",
                },
              ]}
            />
          </View>
        ),
        tabBarActiveTintColor: "#2AABEE",
        tabBarInactiveTintColor: "#707579",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Цены",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "pricetags" : "pricetags-outline"}
              size={24} // Увеличенный размер иконки
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Цены" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: "Доска",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={24} // Увеличенный размер иконки
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Доска" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Поиск",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={24} // Увеличенный размер иконки
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Искать" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Premium",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "diamond" : "diamond-outline"}
              size={24} // Увеличенный размер иконки
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Premium" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24} // Увеличенный размер иконки
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Профиль" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          title: "Сравнение",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="listing/[id]"
        options={{
          href: null,
          title: "Объявление",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="supplier-offers"
        options={{
          href: null,
          title: "Мои предложения",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
          title: "О приложении",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "Настройки",
          headerShown: true,
        }}
      />
    </Tabs>
  );
}