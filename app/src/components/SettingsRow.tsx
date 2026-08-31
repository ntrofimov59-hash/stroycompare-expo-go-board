import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../store/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: string;
};

export function SettingsRow({ icon, title, subtitle, onPress, danger, right }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const color = danger ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.bgElevated }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: colors.muted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? (
        <Text style={{ color: colors.muted, marginRight: 6, maxWidth: 120 }} numberOfLines={1}>
          {right}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 2 },
});