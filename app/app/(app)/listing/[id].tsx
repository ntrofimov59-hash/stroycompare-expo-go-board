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
  supplier?: {
    id: string;
    company_name: string;
    rating: number;
    reviews_count: number;
    is_verified: boolean;
  };
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

  const handleCall = () => {
    if (!item?.contact_phone) {
      Alert.alert("Контакт не указан", "Автор не оставил телефон для связи");
      return;
    }
    Linking.openURL(`tel:${item.contact_phone}`);
  };

  const handleChat = () => {
    if (item?.supplier?.id) {
      router.push(`/(app)/chat/${item.supplier.id}`);
    } else {
      Alert.alert("Чат недоступен", "Не удалось определить автора объявления");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0284C7" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={48} color="#A1A1AA" />
        <Text style={styles.muted}>Объявление не найдено или удалено</Text>
        <TouchableOpacity style={styles.backBtnEmpty} onPress={() => router.back()}>
          <Text style={styles.link}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priceText =
    item.price != null
      ? `${item.price.toLocaleString("ru-RU")} ₽`
      : "Цена договорная";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
    } catch {
      return null;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Объявление", 
          headerBackTitle: "Назад",
          headerTintColor: "#0F172A",
          headerStyle: { backgroundColor: "#FFFFFF" }
        }} 
      />

      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Верхняя плашка: Тип и Дата */}
          <View style={styles.topMetaRow}>
            <View style={[styles.badge, item.type === "service" ? styles.badgeService : styles.badgeMaterial]}>
              <Ionicons 
                name={item.type === "service" ? "construct-outline" : "cube-outline"} 
                size={13} 
                color={item.type === "service" ? "#0369A1" : "#166534"} 
              />
              <Text style={[styles.badgeText, item.type === "service" ? styles.badgeTextService : styles.badgeTextMaterial]}>
                {item.type === "service" ? "Услуга" : "Материал / Товар"}
              </Text>
            </View>
            {item.created_at && (
              <Text style={styles.dateText}>Опубликовано {formatDate(item.created_at)}</Text>
            )}
          </View>

          {/* Заголовок и Цена */}
          <View style={styles.mainCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{priceText}</Text>

            {item.region?.name ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.locationText}>{item.region.name}</Text>
              </View>
            ) : null}
          </View>

          {/* Блок описания */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Описание</Text>
            {item.description ? (
              <Text style={styles.desc}>{item.description}</Text>
            ) : (
              <Text style={styles.mutedDesc}>Автор не добавил подробного описания к этому объявлению.</Text>
            )}
          </View>

          {/* Блок продавца */}
          {item.supplier && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Продавец</Text>
              <View style={styles.supplierRow}>
                <View style={styles.supplierAvatar}>
                  <Ionicons name="business-outline" size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.supplierName}>{item.supplier.company_name}</Text>
                    {item.supplier.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.supplierRating}>
                      {item.supplier.rating.toFixed(1)}
                      {item.supplier.reviews_count > 0 ? ` · ${item.supplier.reviews_count} отзывов` : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Быстрая ссылка на сравнение в каталоге */}
          <TouchableOpacity
            style={styles.catalogBanner}
            onPress={() => router.push("/(app)/")}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.catalogBannerTitle}>Ищете где дешевле?</Text>
              <Text style={styles.catalogBannerSub}>Сравните цены на аналогичные товары в каталоге →</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0284C7" />
          </TouchableOpacity>

          {/* Отступ в конце для безопасной прокрутки выше футера */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Плавающая нижняя панель действий */}
        <View style={styles.footer}>
          {item.contact_phone ? (
            <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.callBtnText}>Позвонить</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.chatBtn} onPress={handleChat} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#0F172A" />
            <Text style={styles.chatBtnText}>Написать</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 16, paddingBottom: 130 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC", padding: 24 },
  
  topMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  badgeService: { backgroundColor: "#E0F2FE" },
  badgeMaterial: { backgroundColor: "#DCFCE7" },
  badgeText: { fontWeight: "600", fontSize: 12 },
  badgeTextService: { color: "#0369A1" },
  badgeTextMaterial: { color: "#166534" },
  dateText: { fontSize: 12, color: "#94A3B8" },

  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginBottom: 8, letterSpacing: -0.3 },
  price: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 12, letterSpacing: -0.5 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "#64748B", fontSize: 14, fontWeight: "500" },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 10 },
  desc: { fontSize: 15, lineHeight: 22, color: "#334155" },
  mutedDesc: { color: "#94A3B8", fontSize: 14, fontStyle: "italic" },

  supplierRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  supplierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  supplierName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  verifiedBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierRating: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  catalogBanner: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  catalogBannerTitle: { color: "#0369A1", fontWeight: "700", fontSize: 14 },
  catalogBannerSub: { color: "#0284C7", fontSize: 13, marginTop: 2, fontWeight: "500" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
  },
  callBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chatBtnText: { color: "#0F172A", fontWeight: "700", fontSize: 15 },

  muted: { color: "#64748B", marginTop: 12, fontSize: 15 },
  backBtnEmpty: { marginTop: 16 },
  link: { color: "#0284C7", fontWeight: "600", fontSize: 15 },
});