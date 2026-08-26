import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
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
    }
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.box}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.input}
          placeholder="Поиск по ценам и доске"
          placeholderTextColor="#8E8E93"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={run}
          autoFocus
        />
        {q.length > 0 && (
          <TouchableOpacity onPress={() => setQ("")}>
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {products.length > 0 && (
          <>
            <Text style={styles.sec}>В каталоге</Text>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.row}
                onPress={() => router.push(`/(app)/product/${p.id}`)}
              >
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowSub}>
                  {p.category?.name || "Каталог"} · {p.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {listings.length > 0 && (
          <>
            <Text style={styles.sec}>На доске объявлений</Text>
            {listings.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.row}
                onPress={() => router.push(`/(app)/listing/${l.id}`)}
              >
                <Text style={styles.rowTitle}>{l.title}</Text>
                <Text style={styles.rowSub}>
                  {l.price ? `${l.price.toLocaleString("ru-RU")} ₽` : "Цена договорная"}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {q.length > 0 && products.length === 0 && listings.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color="#C0C0C0" />
            <Text style={styles.emptyTitle}>Ничего не найдено</Text>
            <Text style={styles.emptySub}>Попробуйте изменить запрос</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#FFFFFF" },
  box: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, color: "#0F172A", paddingVertical: 0 },
  sec: { marginTop: 16, marginBottom: 8, color: "#8E8E93", fontWeight: "600", fontSize: 13 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5EA" },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  rowSub: { marginTop: 2, fontSize: 13, color: "#8E8E93" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#0F172A" },
  emptySub: { marginTop: 4, fontSize: 13, color: "#8E8E93" },
});