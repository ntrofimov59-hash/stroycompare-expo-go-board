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
import { api } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";
import { useSettingsStore } from "../../src/store/settings";

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

  // Реализация Debounce для поиска
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
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        price: !isNaN(p) && p > 0 ? p : undefined,
        contact_phone: phone.trim() || undefined,
        image: imageUrl.trim() || undefined,
        region_id: regionId || "a0000001-0000-0000-0000-000000000001",
      };

      await api.post("/listings", body);
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

  // Вычисляем безопасный отступ снизу с учетом таб-бара (обычно высота табов ~60 + отступ устройства)
  const bottomFabOffset = Math.max(insets.bottom, 16) + 65;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      <View style={styles.container}>
        {/* Хэдер с поиском */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Доска объявлений</Text>
              <Text style={styles.headerSub}>
                📍 {regionName || "Москва"} · Частные предложения и услуги
              </Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Поиск по материалам и услугам..."
              placeholderTextColor="#8E8E93"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Фильтры */}
        <View style={styles.filtersContainer}>
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
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={15}
                    color={active ? "#fff" : "#52525B"}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
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
                <Ionicons name="file-tray-outline" size={56} color="#D1D1D6" />
                <Text style={styles.emptyTitle}>Ничего не найдено</Text>
                <Text style={styles.emptySub}>
                  По вашему запросу нет объявлений или доска пока пуста. Станьте первыми!
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenCreateModal}>
                  <Text style={styles.emptyBtnText}>Разместить объявление</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/(app)/listing/${item.id}`)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImage}>
                    <Ionicons
                      name={item.type === "service" ? "construct-outline" : "cube-outline"}
                      size={30}
                      color="#A0A0A0"
                    />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: item.type === "service" ? "#FEF3C7" : "#E0F2FE" },
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

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {item.description || item.region?.name || "Регион не указан"}
                  </Text>

                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* FAB кнопка добавления (поднята выше нижнего таб-бара) */}
        <TouchableOpacity
          style={[styles.fab, { bottom: bottomFabOffset }]}
          activeOpacity={0.85}
          onPress={handleOpenCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Подать</Text>
        </TouchableOpacity>

        {/* Модальное окно создания объявления */}
        <Modal visible={modal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Новое объявление</Text>
                <View style={{ width: 50 }} />
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
              >
                <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>Тип объявления *</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[styles.typeBtn, type === "material" && styles.typeActive]}
                      onPress={() => setType("material")}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={18}
                        color={type === "material" ? "#fff" : "#0F172A"}
                      />
                      <Text style={[styles.typeText, type === "material" && styles.typeTextActive]}>
                        Материал
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, type === "service" && styles.typeActive]}
                      onPress={() => setType("service")}
                    >
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color={type === "service" ? "#fff" : "#0F172A"}
                      />
                      <Text style={[styles.typeText, type === "service" && styles.typeTextActive]}>
                        Услуга
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Заголовок *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Например: Остатки арматуры А500С"
                    placeholderTextColor="#A0A0A0"
                  />

                  <Text style={styles.label}>Описание и условия</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Укажите характеристики, объем, самовывоз или доставку..."
                    placeholderTextColor="#A0A0A0"
                    multiline
                  />

                  <Text style={styles.label}>Цена, ₽ (оставьте пустым, если договорная)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#A0A0A0"
                  />

                  <Text style={styles.label}>Телефон для связи</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+7 (999) 000-00-00"
                    placeholderTextColor="#A0A0A0"
                  />

                  <Text style={styles.label}>Ссылка на фото (опционально)</Text>
                  <TextInput
                    style={styles.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor="#A0A0A0"
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
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4E4E7" },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerSub: { color: "#707579", marginTop: 2, fontSize: 13, fontWeight: "500" },
  
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 0 },

  filtersContainer: { backgroundColor: "#fff", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4E4E7" },
  filters: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F4F4F5",
    gap: 6,
  },
  chipActive: { backgroundColor: "#2AABEE" },
  chipText: { fontSize: 13, color: "#52525B", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  list: { padding: 16 },
  
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E4E4E7",
  },
  cardImage: {
    width: 110,
    height: "100%",
    minHeight: 110,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardTopRow: { flexDirection: "row", marginBottom: 4 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", lineHeight: 20 },
  cardDesc: { marginTop: 2, fontSize: 12, color: "#707579" },
  cardPrice: { marginTop: 6, fontSize: 16, fontWeight: "800", color: "#0F172A" },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#0F172A" },
  emptySub: { marginTop: 6, fontSize: 14, color: "#707579", textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: "#2AABEE", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#0F172A",
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
  modalContainer: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E7",
  },
  modalCancelText: { color: "#2AABEE", fontWeight: "600", fontSize: 15 },
  modalTitle: { fontWeight: "700", fontSize: 17, color: "#0F172A" },
  
  modalScroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#FAFAFA",
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    gap: 6,
  },
  typeActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  typeText: { fontWeight: "600", color: "#0F172A", fontSize: 14 },
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