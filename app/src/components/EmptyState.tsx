import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../src/store/theme";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useThemeStore((s) => s.colors);

  return (
    <View style={s.box}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={[s.title, { color: colors.text }]}>{title}</Text>
      <Text style={[s.text, { color: colors.muted }]}>{text}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={[s.btn, { backgroundColor: colors.accent || "#2AABEE" }]}
        >
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", padding: 32, justifyContent: "center" },
  title: { marginTop: 12, fontSize: 17, fontWeight: "700", textAlign: "center" },
  text: { marginTop: 8, fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});