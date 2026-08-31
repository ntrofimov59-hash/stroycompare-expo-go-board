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
import { useThemeStore } from "../../src/store/theme";

export default function SettingsScreen() {
  const { regionName, language, setLanguage } = useSettingsStore();
  const { mode, setMode, colors } = useThemeStore();
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
      <ScrollView style={[s.wrap, { backgroundColor: colors.bg }]} contentContainerStyle={s.content}>
        
        {/* Аккаунт */}
        <Text style={[s.group, { color: colors.muted }]}>Аккаунт</Text>
        <TouchableOpacity
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => {
            if (!accessToken) router.push("/(auth)/login");
          }}
        >
          <View style={[s.avatarBox, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9" }]}>
            <Ionicons name="person" size={20} color={colors.muted} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>
              {accessToken ? "Личный кабинет поставщика" : "Войти в систему"}
            </Text>
            <Text style={[s.sub, { color: colors.muted }]}>
              {accessToken ? "Управление реквизитами и доступом" : "Авторизуйтесь для публикации цен"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Основные */}
        <Text style={[s.group, { color: colors.muted }]}>Основные</Text>
        
        <TouchableOpacity
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => Alert.alert("Регион", "Выбор региона доступен на главном экране или через фильтры")}
        >
          <Ionicons name="location-outline" size={20} color={colors.text} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Регион доставки и цен</Text>
            <Text style={[s.sub, { color: colors.muted }]}>{regionName || "Москва и область"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <View style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Пуш-уведомления</Text>
            <Text style={[s.sub, { color: colors.muted }]}>О новых заказах и ответах</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: mode === "dark" ? "#30363d" : "#E4E4E7", true: "#2AABEE" }}
          />
        </View>

        {/* Внешний вид и Мультиязычность */}
        <Text style={[s.group, { color: colors.muted }]}>Интерфейс</Text>

        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={() => setThemeModalVisible(true)}
        >
          <Ionicons name="moon-outline" size={20} color={colors.text} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Тема оформления</Text>
            <Text style={[s.sub, { color: colors.muted }]}>{getThemeTitle(mode)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={() => setLangModalVisible(true)}
        >
          <Ionicons name="language-outline" size={20} color={colors.text} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Язык / Language</Text>
            <Text style={[s.sub, { color: colors.muted }]}>{language === "ru" ? "Русский" : "English"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Данные и память */}
        <Text style={[s.group, { color: colors.muted }]}>Данные и хранилище</Text>
        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={clearCache}
        >
          <Ionicons name="trash-bin-outline" size={20} color={colors.text} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Очистить кэш</Text>
            <Text style={[s.sub, { color: colors.muted }]}>Освободить память на устройстве</Text>
          </View>
        </TouchableOpacity>

        {/* О сервисе и Юридическая информация */}
        <Text style={[s.group, { color: colors.muted }]}>О сервисе</Text>
        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={() => router.push("/(app)/about")}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.text} />
          <Text style={[s.title, { marginLeft: 12, flex: 1, color: colors.text }]}>Как это работает</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={() => router.push("/(app)/legal/terms")}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[s.title, { marginLeft: 12, flex: 1, color: colors.text }]}>Пользовательское соглашение</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          onPress={() => router.push("/(app)/legal/privacy")}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
          <Text style={[s.title, { marginLeft: 12, flex: 1, color: colors.text }]}>Политика конфиденциальности</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => Alert.alert("Поддержка", "Напишите нам в Telegram: @support_market")}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.text} />
          <Text style={[s.title, { marginLeft: 12, flex: 1, color: colors.text }]}>Служба поддержки</Text>
          <Ionicons name="open-outline" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.row, { marginTop: 24, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderBottomColor: colors.border }]} 
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

        <Text style={[s.versionText, { color: colors.muted }]}>B2B Marketplace v1.0.4 (Build 42)</Text>
      </ScrollView>

      {/* Модалка выбора темы */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Выбор темы</Text>
            {[
              { key: "system", label: "Как в системе (Авто)" },
              { key: "light", label: "Светлая" },
              { key: "dark", label: "Темная" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[s.modalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setMode(item.key as any);
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[s.modalOptionText, { color: colors.text }, mode === item.key && s.modalOptionActive]}>
                  {item.label}
                </Text>
                {mode === item.key && <Ionicons name="checkmark" size={18} color="#2AABEE" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[s.modalClose, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9" }]} 
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[s.modalCloseText, { color: colors.text }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модалка выбора языка */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Язык / Language</Text>
            {[
              { key: "ru", label: "Русский" },
              { key: "en", label: "English" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[s.modalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setLanguage(item.key as any);
                  setLangModalVisible(false);
                }}
              >
                <Text style={[s.modalOptionText, { color: colors.text }, language === item.key && s.modalOptionActive]}>
                  {item.label}
                </Text>
                {language === item.key && <Ionicons name="checkmark" size={18} color="#2AABEE" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[s.modalClose, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9" }]} 
              onPress={() => setLangModalVisible(false)}
            >
              <Text style={[s.modalCloseText, { color: colors.text }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  content: { paddingBottom: 40 },
  group: {
    marginTop: 24,
    marginLeft: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "500" },
  sub: { fontSize: 13, marginTop: 2 },
  versionText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 32,
    fontWeight: "500",
  },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center"},
  modalContent: { width: "80%", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { fontSize: 16 },
  modalOptionActive: { color: "#2AABEE", fontWeight: "700" },
  modalClose: { marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalCloseText: { fontWeight: "600", fontSize: 15 },
});