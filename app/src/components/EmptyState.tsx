import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={s.box}>
      <Ionicons name={icon} size={40} color="#C7C7CC" />
      <Text style={s.title}>{title}</Text>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", padding: 40 },
  title: { marginTop: 12, fontSize: 17, fontWeight: "600", color: "#0F172A" },
  text: { marginTop: 6, fontSize: 14, color: "#8E8E93", textAlign: "center" },
});