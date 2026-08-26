import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: focused ? "#2AABEE" : "#707579",
        fontWeight: focused ? "600" : "400",
      }}
    >
      {label}
    </Text>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTitleStyle: { fontWeight: "600", fontSize: 17, color: "#0F172A" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E4E4E7",
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#2AABEE",
        tabBarInactiveTintColor: "#707579",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Сравнение цен",
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Цены" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: "Доска",
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Доска" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Premium",
          tabBarLabel: ({ focused }) => (
            <TabIcon label="Premium" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
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
    </Tabs>
  );
}