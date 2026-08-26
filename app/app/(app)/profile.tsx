import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/auth";
import { useSettingsStore } from "../../src/store/settings";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { regionName, setRegion } = useSettingsStore();

  const pickRegion = () => {
    Alert.alert("Регион", "Выберите регион", [
      {
        text: "Москва",
        onPress: () =>
          setRegion("a0000001-0000-0000-0000-000000000001", "Москва"),
      },
      {
        text: "Московская область",
        onPress: () =>
          setRegion("a0000001-0000-0000-0000-000000000002", "Московская область"),
      },
      {
        text: "Санкт-Петербург",
        onPress: () =>
          setRegion("a0000001-0000-0000-0000-000000000003", "Санкт-Петербург"),
      },
      { text: "Отмена", style: "cancel" },
    ]);
  };

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const roleLabel =
    user?.role === "supplier"
      ? "Поставщик"
      : user?.role === "admin"
      ? "Админ"
      : "Покупатель";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.first_name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.first_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      {user?.role === "supplier" && (
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push("/(app)/supplier-offers")}
        >
          <MenuRow
            icon="storefront-outline"
            title="Мои предложения"
            subtitle="Цены в сравнении"
            onPress={() => router.push("/(app)/supplier-offers")}
          />
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <MenuRow
          icon="diamond-outline"
          title="Подписка Premium"
          onPress={() => router.push("/(app)/subscription")}
        />
        <MenuRow
          icon="location-outline"
          title="Регион"
          subtitle={regionName || "Москва"}
          onPress={pickRegion}
        />
        <MenuRow icon="notifications-outline" title="Уведомления" onPress={() => {}} />
        <MenuRow icon="help-circle-outline" title="Поддержка" onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={22} color="#0F172A" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  hero: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2AABEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  email: { marginTop: 4, fontSize: 14, color: "#707579" },
  rolePill: {
    marginTop: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E7",
  },
  rowTitle: { fontSize: 16, color: "#0F172A", fontWeight: "500" },
  rowSub: { marginTop: 2, fontSize: 13, color: "#8E8E93" },
  logout: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
});