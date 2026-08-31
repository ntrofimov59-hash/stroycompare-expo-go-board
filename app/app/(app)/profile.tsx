import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../src/store/auth";
import { useSettingsStore } from "../../src/store/settings";
import { useThemeStore } from "../../src/store/theme";
import { api } from "../../src/api/client";
import { RegionPicker } from "../../src/components/RegionPicker";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, accessToken, setAuth, logout } = useAuthStore();
  const { regionName } = useSettingsStore();
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  const [modal, setModal] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  const becomeSupplier = async () => {
    if (!company.trim()) {
      Alert.alert("Укажите название компании");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/users/me/become-supplier", {
        company_name: company.trim(),
      });
      if (accessToken) {
        await setAuth(accessToken, {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        });
      }
      setModal(false);
      setCompany("");
      Alert.alert("Готово", "Вы поставщик. Добавьте цены в «Мои предложения».");
      router.push("/(app)/supplier-offers");
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || "";
      if (msg.includes("premium") || e?.response?.status === 403) {
        Alert.alert(
          "Нужен Premium",
          "Чтобы стать поставщиком, оформите подписку.",
          [
            { text: "Отмена", style: "cancel" },
            {
              text: "Premium",
              onPress: () => router.push("/(app)/subscription"),
            },
          ]
        );
      } else if (msg.includes("already")) {
        Alert.alert("Вы уже поставщик");
      } else {
        Alert.alert("Ошибка", msg || "Не удалось");
      }
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const roleLabel =
    user?.role === "supplier"
      ? "Поставщик"
      : user?.role === "admin"
      ? "Админ"
      : "Покупатель";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.hero, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.first_name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.first_name || "Пользователь"}</Text>
          <Text style={[styles.email, { color: colors.muted }]}>{user?.email || "email не указан"}</Text>
          <View style={[styles.rolePill, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9" }]}>
            <Text style={[styles.roleText, { color: colors.muted }]}>{roleLabel}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {user?.role === "buyer" && (
            <MenuRow
              icon="storefront-outline"
              title="Стать поставщиком"
              subtitle="Нужна активная подписка Premium"
              onPress={() => setModal(true)}
            />
          )}
          {user?.role === "supplier" && (
            <MenuRow
              icon="list-outline"
              title="Мои предложения"
              subtitle="Цены в сравнении"
              onPress={() => router.push("/(app)/supplier-offers")}
            />
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <MenuRow
            icon="diamond-outline"
            title="Подписка Premium"
            subtitle="Скидки до 15% и доступ к закупкам"
            onPress={() => router.push("/(app)/subscription")}
          />
          <MenuRow
            icon="location-outline"
            title="Регион"
            subtitle={regionName || "Не выбран"}
            onPress={() => setRegionModal(true)}
          />
          <MenuRow
            icon="settings-outline"
            title="Настройки"
            onPress={() => router.push("/(app)/settings")}
          />
          <MenuRow icon="notifications-outline" title="Уведомления" onPress={() => {}} />
          <MenuRow icon="help-circle-outline" title="Поддержка" onPress={() => {}} />
        </View>

        <TouchableOpacity style={[styles.logout, { backgroundColor: colors.card }]} onPress={onLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>

        <Modal visible={modal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8, color: colors.text }}>Стать поставщиком</Text>
              <Text style={{ color: colors.muted, marginBottom: 16, fontSize: 14 }}>
                Ваши цены появятся в сравнении. Нужен активный Premium.
              </Text>
              <TextInput
                placeholder="Название компании"
                placeholderTextColor={colors.muted}
                value={company}
                onChangeText={setCompany}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA",
                }}
              />
              <TouchableOpacity
                onPress={becomeSupplier}
                disabled={loading}
                style={{ backgroundColor: mode === "dark" ? "#30363d" : "#0F172A", borderRadius: 12, padding: 14, alignItems: "center" }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Подтвердить</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={{ textAlign: "center", marginTop: 16, color: colors.muted, fontWeight: "600" }}>
                  Отмена
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <RegionPicker
          visible={regionModal}
          onClose={() => setRegionModal(false)}
        />
      </ScrollView>
    </View>
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
  const colors = useThemeStore((s) => s.colors);
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
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
  name: { fontSize: 20, fontWeight: "700" },
  email: { marginTop: 4, fontSize: 14 },
  rolePill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: "600" },
  section: {
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
  },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowSub: { marginTop: 2, fontSize: 13 },
  logout: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
});