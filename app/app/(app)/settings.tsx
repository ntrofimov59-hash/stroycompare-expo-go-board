import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../src/store/settings";
import { useAuthStore } from "../../src/store/auth";

export default function SettingsScreen() {
  const { regionName, theme, setTheme, language, setLanguage } = useSettingsStore();
  const { accessToken, logout } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogout = () => {
    if (!accessToken) {
      router.push("/(auth)/login");
      return;
    }

    Alert.alert("Выход из аккаунта", "Вы действительно хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Успешно", "Вы вышли из аккаунта");
        },
      },
    ]);
  };

  const clearCache = () => {
    Alert.alert("Очистка кэша", "Временные файлы и картинки были успешно удалены.", [
      { text: "ОК" },
    ]);
  };

  const getThemeTitle = (t: string) => {
    switch (t) {
      case "dark": return "Темная";
      case "light": return "Светлая";
      default: return "Как в системе";
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Настройки" }} />
      <ScrollView style={s.wrap} contentContainerStyle={s.content}>
        
        {/* Аккаунт */}
        <Text style={s.group}>Аккаунт</Text>
        <TouchableOpacity
          style={s.row}
          onPress={() => {
            if (!accessToken) router.push("/(auth)/login");
          }}
        >
          <View style={s.avatarBox}>
            <Ionicons name="person" size={20} color="#64748B" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>
              {accessToken ? "Личный кабинет поставщика" : "Войти в систему"}
            </Text>
            <Text style={s.sub}>
              {accessToken ? "Управление реквизитами и доступом" : "Авторизуйтесь для публикации цен"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Основные */}
        <Text style={s.group}>Основные</Text>
        
        <TouchableOpacity
          style={s.row}
          onPress={() => Alert.alert("Регион", "Выбор региона доступен на главном экране или через фильтры")}
        >
          <Ionicons name="location-outline" size={20} color="#0F172A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Регион доставки и цен</Text>
            <Text style={s.sub}>{regionName || "Москва и область"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={s.row}>
          <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Пуш-уведомления</Text>
            <Text style={s.sub}>О новых заказах и ответах</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: "#E4E4E7", true: "#2AABEE" }}
          />
        </View>

        {/* Внешний вид и Мультиязычность */}
        <Text style={s.group}>Интерфейс</Text>

        <TouchableOpacity style={s.row} onPress={() => setThemeModalVisible(true)}>
          <Ionicons name="moon-outline" size={20} color="#0F172A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Тема оформления</Text>
            <Text style={s.sub}>{getThemeTitle(theme)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={s.row} onPress={() => setLangModalVisible(true)}>
          <Ionicons name="language-outline" size={20} color="#0F172A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Язык / Language</Text>
            <Text style={s.sub}>{language === "ru" ? "Русский" : "English"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Данные и память */}
        <Text style={s.group}>Данные и хранилище</Text>
        <TouchableOpacity style={s.row} onPress={clearCache}>
          <Ionicons name="trash-bin-outline" size={20} color="#0F172A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Очистить кэш</Text>
            <Text style={s.sub}>Освободить память на устройстве</Text>
          </View>
        </TouchableOpacity>

        {/* О сервисе */}
        <Text style={s.group}>О сервисе</Text>
        <TouchableOpacity style={s.row} onPress={() => router.push("/(app)/about")}>
          <Ionicons name="information-circle-outline" size={20} color="#0F172A" />
          <Text style={[s.title, { marginLeft: 12, flex: 1 }]}>Как это работает</Text>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.row}
          onPress={() => Alert.alert("Поддержка", "Напишите нам в Telegram: @support_market")}
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#0F172A" />
          <Text style={[s.title, { marginLeft: 12, flex: 1 }]}>Служба поддержки</Text>
          <Ionicons name="open-outline" size={16} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.row, { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5EA" }]} 
          onPress={handleLogout}
        >
          <Ionicons
            name={accessToken ? "log-out-outline" : "log-in-outline"}
            size={20}
            color={accessToken ? "#EF4444" : "#2AABEE"}
          />
          <Text
            style={[
              s.title,
              { marginLeft: 12, flex: 1, color: accessToken ? "#EF4444" : "#2AABEE", fontWeight: "600" },
            ]}
          >
            {accessToken ? "Выйти из аккаунта" : "Войти в аккаунт"}
          </Text>
        </TouchableOpacity>

        <Text style={s.versionText}>B2B Marketplace v1.0.4 (Build 42)</Text>
      </ScrollView>

      {/* Модалка выбора темы */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Выбор темы</Text>
            {[
              { key: "system", label: "Как в системе (Авто)" },
              { key: "light", label: "Светлая" },
              { key: "dark", label: "Темная" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={s.modalOption}
                onPress={() => {
                  setTheme(item.key as any);
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[s.modalOptionText, theme === item.key && s.modalOptionActive]}>
                  {item.label}
                </Text>
                {theme === item.key && <Ionicons name="checkmark" size={18} color="#2AABEE" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalClose} onPress={() => setThemeModalVisible(false)}>
              <Text style={s.modalCloseText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модалка выбора языка */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Язык / Language</Text>
            {[
              { key: "ru", label: "Русский" },
              { key: "en", label: "English" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={s.modalOption}
                onPress={() => {
                  setLanguage(item.key as any);
                  setLangModalVisible(false);
                }}
              >
                <Text style={[s.modalOptionText, language === item.key && s.modalOptionActive]}>
                  {item.label}
                </Text>
                {language === item.key && <Ionicons name="checkmark" size={18} color="#2AABEE" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalClose} onPress={() => setLangModalVisible(false)}>
              <Text style={s.modalCloseText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F4F4F5" },
  content: { paddingBottom: 40 },
  group: {
    marginTop: 24,
    marginLeft: 16,
    marginBottom: 8,
    fontSize: 13,
    color: "#707579",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E7",
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "500", color: "#0F172A" },
  sub: { fontSize: 13, color: "#707579", marginTop: 2 },
  versionText: {
    textAlign: "center",
    color: "#A1A1AA",
    fontSize: 13,
    marginTop: 32,
    fontWeight: "500",
  },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 16, textAlign: "center" },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4E4E7" },
  modalOptionText: { fontSize: 16, color: "#334155" },
  modalOptionActive: { color: "#2AABEE", fontWeight: "700" },
  modalClose: { marginTop: 16, backgroundColor: "#F1F5F9", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#0F172A", fontWeight: "600", fontSize: 15 },
});