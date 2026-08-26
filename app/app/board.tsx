import { useCallback, useState } from "react";
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
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/api/client";
import { useAuthStore } from "../src/store/auth";
import { useSettingsStore } from "../src/store/settings";

type Listing = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  type: string;
  region?: { name: string };
};

export default function BoardScreen() {
  const token = useAuthStore((s) => s.accessToken);
  const regionId = useSettingsStore((s) => s.regionId);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "material" | "service">("all");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<"material" | "service">("material");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/listings", {
        params: {
          type: filter === "all" ? undefined : filter,
          search: query || undefined,
          // region_id: regionId || undefined, // включи, если нужны только свой регион
        },
      });
      setItems(data.listings || []);
    } catch (e) {
      console.log("listings error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, query, regionId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onSearch = () => setQuery(search.trim());

  const create = async () => {
    if (!token) {
      Alert.alert("Войдите", "Чтобы разместить объявление, нужен аккаунт");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Укажите заголовок");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
        region_id: regionId || "a0000001-0000-0000-0000-000000000001",
      };
      const p = parseFloat(price.replace(",", "."));
      if (!isNaN(p) && p > 0) body.price = p;

      await api.post("/listings", body);
      setModal(false);
      setTitle("");
      setPrice("");
      await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось создать");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (n?: number) => {
    if (n == null) return "Цена договорная";
    return n.toLocaleString("ru-RU") + " ₽";
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск объявлений"
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={onSearch}>
            <Text style={styles.find}>Найти</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {(
          [
            { key: "all", label: "Все" },
            { key: "material", label: "Материалы" },
            { key: "service", label: "Услуги" },
          ] as const
        ).map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2AABEE" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#2AABEE"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={40} color="#C0C0C0" />
              <Text style={styles.emptyTitle}>Пока нет объявлений</Text>
              <Text style={styles.emptySub}>
                Нажмите +, чтобы разместить первое
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name={
                    item.type === "service" ? "construct-outline" : "cube-outline"
                  }
                  size={28}
                  color="#A0A0A0"
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.region?.name || "Регион не указан"}
                </Text>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новое объявление</Text>

            <Text style={styles.label}>Заголовок</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Например: Остаток цемента М500"
              placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Цена, ₽ (необязательно)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#A0A0A0"
            />

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === "material" && styles.typeActive]}
                onPress={() => setType("material")}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === "material" && styles.typeTextActive,
                  ]}
                >
                  Материал
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === "service" && styles.typeActive]}
                onPress={() => setType("service")}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === "service" && styles.typeTextActive,
                  ]}
                >
                  Услуга
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={create}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Опубликовать</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cancel}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 0 },
  find: { color: "#2AABEE", fontWeight: "700", fontSize: 14 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#2AABEE" },
  chipText: { fontSize: 13, color: "#0F172A", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  list: { padding: 12, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#EEF0F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  cardMeta: { marginTop: 4, fontSize: 12, color: "#8E8E93" },
  cardPrice: { marginTop: 6, fontSize: 16, fontWeight: "700", color: "#0F172A" },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2AABEE",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, color: "#707579", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    alignItems: "center",
  },
  typeActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  typeText: { fontWeight: "600", color: "#0F172A" },
  typeTextActive: { color: "#fff" },
  saveBtn: {
    backgroundColor: "#2AABEE",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  cancel: {
    textAlign: "center",
    marginTop: 16,
    color: "#707579",
    fontWeight: "600",
  },
});