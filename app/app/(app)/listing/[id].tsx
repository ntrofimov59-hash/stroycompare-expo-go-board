import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/api/client";

type Listing = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  type: string;
  contact_phone?: string;
  region?: { name: string };
  created_at?: string;
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/listings/${id}`);
      setItem(data);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const call = () => {
    if (!item?.contact_phone) {
      Alert.alert("Контакт не указан", "Автор не оставил телефон");
      return;
    }
    Linking.openURL(`tel:${item.contact_phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2AABEE" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Объявление не найдено</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priceText =
    item.price != null
      ? `${item.price.toLocaleString("ru-RU")} ₽`
      : "Цена договорная";

  return (
    <>
      <Stack.Screen options={{ title: "Объявление", headerBackTitle: "Доска" }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.type === "service" ? "Услуга" : "Материал"}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <Text style={styles.price}>{priceText}</Text>

        {item.region?.name ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color="#707579" />
            <Text style={styles.meta}>{item.region.name}</Text>
          </View>
        ) : null}

        {item.description ? (
          <Text style={styles.desc}>{item.description}</Text>
        ) : (
          <Text style={styles.muted}>Без описания</Text>
        )}

        <TouchableOpacity style={styles.btn} onPress={call} activeOpacity={0.8}>
          <Ionicons name="call-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Связаться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => router.push("/(app)/")}
        >
          <Text style={styles.secondaryText}>Сравнить цены в каталоге →</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: { color: "#0369A1", fontWeight: "600", fontSize: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  price: { fontSize: 24, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  meta: { color: "#707579", fontSize: 14 },
  desc: { fontSize: 15, lineHeight: 22, color: "#3F3F46", marginBottom: 24 },
  muted: { color: "#8E8E93", marginBottom: 24 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondary: { marginTop: 16, alignItems: "center" },
  secondaryText: { color: "#2AABEE", fontWeight: "600" },
  link: { marginTop: 12, color: "#2AABEE", fontWeight: "600" },
});