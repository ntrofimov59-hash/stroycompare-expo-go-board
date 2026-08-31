import { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { api } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";
import { useSettingsStore } from "../../src/store/settings";
import { useThemeStore } from "../../src/store/theme";

type Listing = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  type: "material" | "service";
  region?: { name: string };
};

export default function BoardScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.accessToken);
  const regionId = useSettingsStore((s) => s.regionId);
  const regionName = useSettingsStore((s) => s.regionName);
  
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "material" | "service">("all");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);

  const searchRef = useRef<TextInput>(null);

  // Форма нового объявления
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState<"material" | "service">("material");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const { data } = await api.get("/listings", {
        params: {
          type: filter === "all" ? undefined : filter,
          search: query || undefined,
        },
      });
      setItems(data.listings || data || []);
    } catch (e) {
      console.log("listings error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, query]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleOpenCreateModal = () => {
    if (!token) {
      Alert.alert(
        "Требуется авторизация",
        "Чтобы размещать объявления, необходимо войти в аккаунт",
        [
          { text: "Отмена", style: "cancel" },
          { text: "Войти", onPress: () => router.push("/(auth)/login") },
        ]
      );
      return;
    }
    setModal(true);
  };

  const create = async () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Укажите заголовок объявления");
      return;
    }
    setSaving(true);
    try {
      const p = parseFloat(price.replace(",", "."));
      await api.post("/listings", {
        title,
        description,
        price: price ? Number(price) : undefined,
        contact_phone: phone,
        type,
        region_id: regionId || undefined,
        image_url: imageUrl || undefined,
      });
      setModal(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setPhone("");
      setImageUrl("");
      setType("material");
      load(true);
      Alert.alert("Успешно", "Ваше объявление опубликовано");
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось создать объявление");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (n?: number) => {
    if (n == null || n === 0) return "Договорная";
    return n.toLocaleString("ru-RU") + " ₽";
  };

  const bottomFabOffset = Math.max(insets.bottom, 16) + 65;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Хэдер с поиском */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Доска объявлений</Text>
              <Text style={[styles.headerSub, { color: colors.muted }]}>
                📍 {regionName || "Москва"} · Частные предложения и услуги
              </Text>
            </View>
          </View>

          <View style={[styles.searchBox, { backgroundColor: mode === "dark" ? "#161b22" : "#F2F2F7" }]}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              ref={searchRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Поиск по материалам и услугам..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Фильтры */}
        <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {(
              [
                { key: "all", label: "Все объявления", icon: "apps-outline" },
                { key: "material", label: "Материалы", icon: "cube-outline" },
                { key: "service", label: "Услуги", icon: "construct-outline" },
              ] as const
            ).map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.chip, 
                    { backgroundColor: mode === "dark" ? "#21262d" : "#F4F4F5" },
                    active && styles.chipActive
                  ]}
                  onPress={() => setFilter(f.key)}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={15}
                    color={active ? "#fff" : colors.muted}
                  />
                  <Text style={[styles.chipText, { color: colors.muted }, active && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Список */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2AABEE" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomFabOffset + 40 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load(true);
                }}
                tintColor="#2AABEE"
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="file-tray-outline" size={56} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Ничего не найдено</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  По вашему запросу нет объявлений или доска пока пуста. Станьте первыми!
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenCreateModal}>
                  <Text style={styles.emptyBtnText}>Разместить объявление</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
                onPress={() => router.push(`/(app)/listing/${item.id}`)}
              >
                {item.image ? (
                  <Image 
                    source={{ uri: item.image }} 
                    style={[
                      styles.cardImage, 
                      { backgroundColor: mode === "dark" ? "#21262d" : "#F4F4F5" }
                    ]} 
                  />
                ) : (
                  <View style={[
                    styles.cardImagePlaceholder, 
                    { backgroundColor: mode === "dark" ? "#21262d" : "#F4F4F5" }
                  ]}>
                    <Ionicons
                      name={item.type === "service" ? "construct-outline" : "cube-outline"}
                      size={30}
                      color={colors.muted}
                    />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: item.type === "service" ? (mode === "dark" ? "#3b2d1c" : "#FEF3C7") : (mode === "dark" ? "#163353" : "#E0F2FE") },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: item.type === "service" ? "#D97706" : "#0284C7" },
                        ]}
                      >
                        {item.type === "service" ? "Услуга" : "Материал"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  
                  <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={1}>
                    {item.description || item.region?.name || "Регион не указан"}
                  </Text>

                  <Text style={[styles.cardPrice, { color: colors.text }]}>{formatPrice(item.price)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* FAB кнопка добавления */}
        <TouchableOpacity
          style={[styles.fab, { bottom: bottomFabOffset, backgroundColor: mode === "dark" ? "#30363d" : "#0F172A" }]}
          activeOpacity={0.85}
          onPress={handleOpenCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Подать</Text>
        </TouchableOpacity>

        {/* Модальное окно */}
        <Modal visible={modal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Новое объявление</Text>
                <View style={{ width: 50 }} />
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
              >
                <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.label, { color: colors.muted }]}>Тип объявления *</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn, 
                        { backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border },
                        type === "material" && styles.typeActive
                      ]}
                      onPress={() => setType("material")}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={18}
                        color={type === "material" ? "#fff" : colors.text}
                      />
                      <Text style={[styles.typeText, { color: colors.text }, type === "material" && styles.typeTextActive]}>
                        Материал
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn, 
                        { backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border },
                        type === "service" && styles.typeActive
                      ]}
                      onPress={() => setType("service")}
                    >
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color={type === "service" ? "#fff" : colors.text}
                      />
                      <Text style={[styles.typeText, { color: colors.text }, type === "service" && styles.typeTextActive]}>
                        Услуга
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: colors.muted }]}>Заголовок *</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Например: Остатки арматуры А500С"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={[styles.label, { color: colors.muted }]}>Описание и условия</Text>
                  <TextInput
                    style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Укажите характеристики, объем, самовывоз или доставку..."
                    placeholderTextColor={colors.muted}
                    multiline
                  />

                  <Text style={[styles.label, { color: colors.muted }]}>Цена, ₽ (оставьте пустым, если договорная)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={[styles.label, { color: colors.muted }]}>Телефон для связи</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+7 (999) 000-00-00"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={[styles.label, { color: colors.muted }]}>Ссылка на фото (опционально)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={create}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>Опубликовать объявление</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSub: { marginTop: 2, fontSize: 13, fontWeight: "500" },
  
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  filtersContainer: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  filters: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipActive: { backgroundColor: "#2AABEE" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  list: { padding: 16 },
  
  card: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardImage: {
    width: 110,
    height: "100%",
    minHeight: 110,
  },
  cardImagePlaceholder: {
    width: 110,
    height: "100%",
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardTopRow: { flexDirection: "row", marginBottom: 4 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardDesc: { marginTop: 2, fontSize: 12 },
  cardPrice: { marginTop: 6, fontSize: 16, fontWeight: "800" },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "700" },
  emptySub: { marginTop: 6, fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: "#2AABEE", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 10,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancelText: { color: "#2AABEE", fontWeight: "600", fontSize: 15 },
  modalTitle: { fontWeight: "700", fontSize: 17 },
  
  modalScroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  typeActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  typeText: { fontWeight: "600", fontSize: 14 },
  typeTextActive: { color: "#fff" },

  saveBtn: {
    backgroundColor: "#2AABEE",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});