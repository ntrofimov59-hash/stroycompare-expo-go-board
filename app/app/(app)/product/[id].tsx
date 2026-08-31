import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/api/client";
import { useSettingsStore } from "../../../src/store/settings";
import { useThemeStore } from "../../../src/store/theme";
import { EmptyState } from "../../../src/components/EmptyState";

type Offer = {
  id: string;
  price: number;
  final_price: number;
  discount_percent: number;
  min_order_qty: number;
  stock_qty?: number;
  delivery_days?: number;
  supports_discount: boolean;
  currency: string;
  supplier: {
    id: string;
    company_name: string;
    rating: number;
    reviews_count: number;
    is_verified: boolean;
    phone?: string;
  };
  region: {
    name: string;
  };
};

type Product = {
  id: string;
  name: string;
  unit: string;
  description?: string;
  category?: { name: string };
};

const reportOffer = (offerId: string, productName?: string, companyName?: string) => {
  const subject = encodeURIComponent(`Жалоба на предложение ${offerId}`);
  const body = encodeURIComponent(
    `Товар: ${productName || "Не указан"}\nПоставщик: ${companyName || "Не указан"}\nID предложения: ${offerId}\nПричина: \n\n— Отправлено из StroyCompare`
  );
  Linking.openURL(`mailto:support@stroycompare.ru?subject=${subject}&body=${body}`);
};

export default function ProductCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const regionId = useSettingsStore((s: any) => s.regionId);

  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  const [product, setProduct] = useState<Product | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hasSub, setHasSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<"price_asc" | "price_desc">("price_asc");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/products/${id}/offers`, {
        params: { sort, region_id: regionId },
      });
      setProduct(data.product);
      setOffers(data.offers || []);
      setHasSub(!!data.user_has_subscription);
    } catch (e) {
      console.log("offers error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, sort, regionId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      maximumFractionDigits: 2,
    }).format(n) + " ₽";

  const handleContact = (item: Offer) => {
    const supplierName = item.supplier.company_name;
    const phone = item.supplier.phone;

    if (phone) {
      Alert.alert(
        supplierName,
        `Телефон для связи: ${phone}`,
        [
          { text: "Закрыть", style: "cancel" },
          { 
            text: "Позвонить", 
            onPress: () => {}
          },
          { 
            text: "Написать в чат", 
            onPress: () => router.push(`/(app)/chat/${item.supplier.id}`) 
          }
        ]
      );
    } else {
      router.push(`/(app)/chat/${item.supplier.id}`);
    }
  };

  const renderOffer = ({ item, index }: { item: Offer; index: number }) => {
    const hasDiscount = item.discount_percent > 0 && item.final_price < item.price;
    const isBest = index === 0 && sort === "price_asc";
    const best = isBest ? offers[0] : null;
    const saved = best && best.discount_percent > 0 ? best.price - best.final_price : 0;

    return (
      <View>
        <View style={[
          styles.card, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isBest && [styles.cardBest, { backgroundColor: mode === "dark" ? "#161b22" : "#F8FAFC" }]
        ]}>
          {isBest && (
            <View style={styles.bestBadge}>
              <Ionicons name="flash" size={12} color="#FFFFFF" />
              <Text style={styles.bestBadgeText}>Лучшая цена</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.supplierRow}>
                <Text style={[styles.supplierName, { color: colors.text }]} numberOfLines={1}>{item.supplier.company_name}</Text>
                {item.supplier.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.muted }]}>
                  {item.supplier.rating.toFixed(1)}
                  {item.supplier.reviews_count > 0 ? ` · ${item.supplier.reviews_count} отзывов` : " · Новый"}
                </Text>
              </View>
            </View>
            <View style={[styles.regionBadge, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9" }]}>
              <Ionicons name="location-outline" size={12} color={colors.muted} />
              <Text style={[styles.regionText, { color: colors.muted }]}>{item.region?.name || "Регион"}</Text>
            </View>
          </View>

          <View style={[styles.priceSection, { borderTopColor: colors.border }]}>
            <View>
              {hasDiscount && (
                <Text style={[styles.oldPrice, { color: colors.muted }]}>{formatPrice(item.price)}</Text>
              )}
              <Text style={[styles.finalPrice, { color: colors.text }]}>{formatPrice(item.final_price ?? item.price)}</Text>
            </View>
            {hasDiscount && (
              <View style={[styles.discountBadge, { backgroundColor: mode === "dark" ? "#052e16" : "#DCFCE7" }]}>
                <Text style={styles.discountText}>−{item.discount_percent}%</Text>
              </View>
            )}
          </View>

          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="cube-outline" size={14} color={colors.muted} />
              <Text style={[styles.specText, { color: colors.muted }]}>от {item.min_order_qty} {product?.unit || "шт"}</Text>
            </View>
            {item.delivery_days != null && (
              <View style={styles.specItem}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={[styles.specText, { color: colors.muted }]}>{item.delivery_days} дн.</Text>
              </View>
            )}
            {item.stock_qty != null && (
              <View style={styles.specItem}>
                <Ionicons name="layers-outline" size={14} color={colors.muted} />
                <Text style={[styles.specText, { color: colors.muted }]}>в наличии: {item.stock_qty}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            {item.supplier.phone ? (
              <TouchableOpacity 
                style={[styles.phoneBtn, { backgroundColor: mode === "dark" ? "#21262d" : "#F1F5F9", borderColor: colors.border }]} 
                activeOpacity={0.8}
                onPress={() => handleContact(item)}
              >
                <Ionicons name="call-outline" size={16} color={colors.text} />
                <Text style={[styles.phoneBtnText, { color: colors.text }]}>Позвонить</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: mode === "dark" ? "#30363d" : "#0F172A" }, !item.supplier.phone && { flex: 1 }]} 
              activeOpacity={0.8}
              onPress={() => router.push(`/(app)/chat/${item.supplier.id}`)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Связаться</Text>
            </TouchableOpacity>
          </View>

          {/* Кнопка жалобы на конкретное предложение */}
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => reportOffer(item.id, product?.name, item.supplier.company_name)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={13} color={colors.muted} />
            <Text style={[styles.reportText, { color: colors.muted }]}>Пожаловаться на предложение</Text>
          </TouchableOpacity>
        </View>

        {hasSub && isBest && saved > 0 && (
          <View style={[styles.savingsBanner, { backgroundColor: mode === "dark" ? "#052e16" : "#F0FDF4", borderColor: mode === "dark" ? "#14532d" : "#DCFCE7" }]}>
            <Ionicons name="trending-down" size={14} color="#16A34A" />
            <Text style={styles.savingsText}>
              Экономия по сравнению со средней ценой: ~{saved.toFixed(0)} ₽
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color="#0284C7" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: product?.name || "Сравнение цен",
          headerBackTitle: "Назад",
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.card },
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Шапка товара */}
        <View style={[styles.productHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{product?.name}</Text>
          <Text style={[styles.productMeta, { color: colors.muted }]}>
            {product?.category?.name || "Категория"}
            {product?.unit ? ` · Ед. изм: ${product.unit}` : ""}
          </Text>
          {product?.description ? (
            <Text style={[styles.productDesc, { color: colors.text }]} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}

          {hasSub ? (
            <View style={[styles.subBanner, { backgroundColor: mode === "dark" ? "#052e16" : "#F0FDF4", borderColor: mode === "dark" ? "#14532d" : "#DCFCE7" }]}>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={styles.subBannerText}>Премиум-доступ активен: оптовые цены применены</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.promoBox, { backgroundColor: mode === "dark" ? "#221a08" : "#FFFBEB", borderColor: mode === "dark" ? "#422e06" : "#FEF3C7" }]}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/subscription")}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Скидки по подписке Premium 5–15%</Text>
                <Text style={styles.promoSub}>Разблокируйте эксклюзивные предложения →</Text>
              </View>
              <Ionicons name="shield-checkmark" size={24} color="#D97706" />
            </TouchableOpacity>
          )}
        </View>

        {/* Панель сортировки */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.muted }]}>Сортировать:</Text>
          <TouchableOpacity
            style={[
              styles.sortChip, 
              { backgroundColor: colors.card, borderColor: colors.border },
              sort === "price_asc" && [styles.sortChipActive, { backgroundColor: mode === "dark" ? "#30363d" : "#0F172A", borderColor: mode === "dark" ? "#30363d" : "#0F172A" }]
            ]}
            onPress={() => setSort("price_asc")}
          >
            <Text style={[styles.sortChipText, { color: colors.text }, sort === "price_asc" && styles.sortChipTextActive]}>
              Сначала дешевле
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortChip, 
              { backgroundColor: colors.card, borderColor: colors.border },
              sort === "price_desc" && [styles.sortChipActive, { backgroundColor: mode === "dark" ? "#30363d" : "#0F172A", borderColor: mode === "dark" ? "#30363d" : "#0F172A" }]
            ]}
            onPress={() => setSort("price_desc")}
          >
            <Text style={[styles.sortChipText, { color: colors.text }, sort === "price_desc" && styles.sortChipTextActive]}>
              Сначала дороже
            </Text>
          </TouchableOpacity>
        </View>

        {/* Список офферов */}
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={renderOffer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#0284C7"
            />
          }
          ListFooterComponent={
            offers.length > 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: "center",
                  marginTop: 16,
                  marginBottom: 24,
                  lineHeight: 17,
                  paddingHorizontal: 8,
                }}
              >
                StroyCompare не продаёт товары и не является стороной сделки. Цены справочные. Условия уточняйте у поставщика.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Предложений пока нет"
              text="В выбранном регионе никто из поставщиков еще не выставил этот товар"
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  productHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  productName: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  productMeta: { marginTop: 4, fontSize: 13, fontWeight: "500" },
  productDesc: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  subBanner: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  subBannerText: { color: "#166534", fontSize: 13, fontWeight: "600" },
  promoBox: {
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  promoTitle: { color: "#D97706", fontWeight: "700", fontSize: 13 },
  promoSub: { color: "#B45309", fontSize: 12, marginTop: 2, fontWeight: "500" },
  savingsBanner: {
    marginTop: -4,
    marginBottom: 12,
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingsText: { color: "#15803D", fontSize: 13, fontWeight: "600" },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortLabel: { fontSize: 13, fontWeight: "500" },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipActive: {},
  sortChipText: { fontSize: 13, fontWeight: "500" },
  sortChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBest: {
    borderColor: "#0284C7",
    borderWidth: 1.5,
  },
  bestBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0284C7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 10,
  },
  bestBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  supplierRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "80%" },
  supplierName: { fontSize: 16, fontWeight: "700" },
  verifiedBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "500" },
  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  regionText: { fontSize: 11, fontWeight: "500" },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  oldPrice: {
    fontSize: 13,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  finalPrice: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: { color: "#16A34A", fontSize: 12, fontWeight: "700" },
  specsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 12 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, fontWeight: "500" },
  actionsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  phoneBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  phoneBtnText: { fontWeight: "600", fontSize: 14 },
  actionBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
    paddingVertical: 4,
  },
  reportText: {
    fontSize: 12,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});