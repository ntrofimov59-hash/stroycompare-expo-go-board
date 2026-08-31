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
import { useThemeStore } from "../../../src/store/theme";

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

const reportListing = (id: string, title: string) => {
  const subject = encodeURIComponent(`Жалоба на объявление ${id}`);
  const body = encodeURIComponent(
    `Объявление: ${title}\nID: ${id}\nПричина: \n\n— Отправлено из StroyCompare`
  );
  Linking.openURL(`mailto:support@stroycompare.ru?subject=${subject}&body=${body}`);
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

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
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color="#0284C7" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="document-text-outline" size={48} color={colors.muted} />
        <Text style={[styles.muted, { color: colors.muted }]}>Объявление не найдено или удалено</Text>
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
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.card }
        }} 
      />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Верхняя плашка: Тип и Дата */}
          <View style={styles.topMetaRow}>
            <View style={[
              styles.badge, 
              item.type === "service" 
                ? { backgroundColor: mode === "dark" ? "#032b43" : "#E0F2FE" } 
                : { backgroundColor: mode === "dark" ? "#052e16" : "#DCFCE7" }
            ]}>
              <Ionicons 
                name={item.type === "service" ? "construct-outline" : "cube-outline"} 
                size={13} 
                color={item.type === "service" ? "#38bdf8" : "#4ade80"} 
              />
              <Text style={[
                styles.badgeText, 
                item.type === "service" 
                  ? { color: "#38bdf8" } 
                  : { color: "#4ade80" }
              ]}>
                {item.type === "service" ? "Услуга" : "Материал / Товар"}
              </Text>
            </View>
            {item.created_at && (
              <Text style={[styles.dateText, { color: colors.muted }]}>Опубликовано {formatDate(item.created_at)}</Text>
            )}
          </View>

          {/* Заголовок и Цена */}
          <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.price, { color: colors.text }]}>{priceText}</Text>

            {item.region?.name ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.muted} />
                <Text style={[styles.locationText, { color: colors.muted }]}>{item.region.name}</Text>
              </View>
            ) : null}
          </View>

          {/* Блок описания */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Описание</Text>
            {item.description ? (
              <Text style={[styles.desc, { color: colors.text }]}>{item.description}</Text>
            ) : (
              <Text style={[styles.mutedDesc, { color: colors.muted }]}>Автор не добавил подробного описания к этому объявлению.</Text>
            )}
          </View>

          {/* Блок продавца */}
          {item.supplier && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Продавец</Text>
              <View style={styles.supplierRow}>
                <View style={[styles.supplierAvatar, { backgroundColor: mode === "dark" ? "#161b22" : "#F0F9FF", borderColor: colors.border }]}>
                  <Ionicons name="business-outline" size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.supplierName, { color: colors.text }]}>{item.supplier.company_name}</Text>
                    {item.supplier.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.supplierRating, { color: colors.muted }]}>
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
            style={[styles.catalogBanner, { backgroundColor: mode === "dark" ? "#161b22" : "#F0F9FF", borderColor: colors.border }]}
            onPress={() => router.push("/(app)/")}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.catalogBannerTitle}>Ищете где дешевле?</Text>
              <Text style={[styles.catalogBannerSub, { color: colors.muted }]}>Сравните цены на аналогичные товары в каталоге →</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0284C7" />
          </TouchableOpacity>

          {/* Кнопка жалобы на объявление */}
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => reportListing(item.id, item.title)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={15} color={colors.muted} />
            <Text style={[styles.reportText, { color: colors.muted }]}>Пожаловаться на объявление</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Плавающая нижняя панель действий */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {item.contact_phone ? (
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: mode === "dark" ? "#30363d" : "#0F172A" }]} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.callBtnText}>Позвонить</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={[styles.chatBtn, { backgroundColor: mode === "dark" ? "#161b22" : "#F1F5F9", borderColor: colors.border }]} onPress={handleChat} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.text} />
            <Text style={[styles.chatBtnText, { color: colors.text }]}>Написать</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 130 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  
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
  badgeText: { fontWeight: "600", fontSize: 12 },
  dateText: { fontSize: 12 },

  mainCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, letterSpacing: -0.3 },
  price: { fontSize: 24, fontWeight: "800", marginBottom: 12, letterSpacing: -0.5 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 14, fontWeight: "500" },

  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  desc: { fontSize: 15, lineHeight: 22 },
  mutedDesc: { fontSize: 14, fontStyle: "italic" },

  supplierRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  supplierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  supplierName: { fontSize: 15, fontWeight: "700" },
  verifiedBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierRating: { fontSize: 13, fontWeight: "500" },

  catalogBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  catalogBannerTitle: { color: "#38bdf8", fontWeight: "700", fontSize: 14 },
  catalogBannerSub: { fontSize: 13, marginTop: 2, fontWeight: "500" },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  reportText: {
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
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
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  chatBtnText: { fontWeight: "700", fontSize: 15 },

  muted: { marginTop: 12, fontSize: 15 },
  backBtnEmpty: { marginTop: 16 },
  link: { color: "#0284C7", fontWeight: "600", fontSize: 15 },
});