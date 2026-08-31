import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { api } from "../../src/api/client";
import { useThemeStore } from "../../src/store/theme";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  const [q, setQ] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  const run = async () => {
    const query = q.trim();
    if (!query) return;
    try {
      const [p, l] = await Promise.all([
        api.get("/products", { params: { search: query } }),
        api.get("/listings", { params: { search: query } }),
      ]);
      setProducts(p.data.products || []);
      setListings(l.data.listings || []);
    } catch (e) {
      console.log("Search error", e);
      Alert.alert("Нет связи", "Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.");
    }
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      
      {/* Поисковая строка */}
      <View style={[styles.box, { backgroundColor: mode === "dark" ? "#161b22" : "#F2F2F7" }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Поиск по ценам и доске"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={run}
          autoFocus
        />
        {q.length > 0 && (
          <TouchableOpacity onPress={() => setQ("")}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {products.length > 0 && (
          <>
            <Text style={[styles.sec, { color: colors.muted }]}>В каталоге</Text>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/(app)/product/${p.id}`)}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{p.name}</Text>
                <Text style={[styles.rowSub, { color: colors.muted }]}>
                  {p.category?.name || "Каталог"} · {p.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {listings.length > 0 && (
          <>
            <Text style={[styles.sec, { color: colors.muted }]}>На доске объявлений</Text>
            {listings.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/(app)/listing/${l.id}`)}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{l.title}</Text>
                <Text style={[styles.rowSub, { color: colors.muted }]}>
                  {l.price ? `${l.price.toLocaleString("ru-RU")} ₽` : "Цена договорная"}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {q.length > 0 && products.length === 0 && listings.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Ничего не найдено</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>Попробуйте изменить запрос</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  sec: { marginTop: 16, marginBottom: 8, fontWeight: "600", fontSize: 13 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowSub: { marginTop: 2, fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "600" },
  emptySub: { marginTop: 4, fontSize: 13 },
});