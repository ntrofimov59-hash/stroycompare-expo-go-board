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
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/api/client";
import { useSettingsStore } from "../../../src/store/settings";

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

export default function ProductCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const regionId = useSettingsStore((s: any) => s.regionId);

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
        <View style={[styles.card, isBest && styles.cardBest]}>
          {isBest && (
            <View style={styles.bestBadge}>
              <Ionicons name="flash" size={12} color="#FFFFFF" />
              <Text style={styles.bestBadgeText}>Лучшая цена</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.supplierRow}>
                <Text style={styles.supplierName} numberOfLines={1}>{item.supplier.company_name}</Text>
                {item.supplier.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {item.supplier.rating.toFixed(1)}
                  {item.supplier.reviews_count > 0 ? ` · ${item.supplier.reviews_count} отзывов` : " · Новый"}
                </Text>
              </View>
            </View>
            <View style={styles.regionBadge}>
              <Ionicons name="location-outline" size={12} color="#71717A" />
              <Text style={styles.regionText}>{item.region?.name || "Регион"}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View>
              {hasDiscount && (
                <Text style={styles.oldPrice}>{formatPrice(item.price)}</Text>
              )}
              <Text style={styles.finalPrice}>{formatPrice(hasDiscount ? item.final_price : item.price)}</Text>
            </View>
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>−{item.discount_percent}%</Text>
              </View>
            )}
          </View>

          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="cube-outline" size={14} color="#71717A" />
              <Text style={styles.specText}>от {item.min_order_qty} {product?.unit || "шт"}</Text>
            </View>
            {item.delivery_days != null && (
              <View style={styles.specItem}>
                <Ionicons name="time-outline" size={14} color="#71717A" />
                <Text style={styles.specText}>{item.delivery_days} дн.</Text>
              </View>
            )}
            {item.stock_qty != null && (
              <View style={styles.specItem}>
                <Ionicons name="layers-outline" size={14} color="#71717A" />
                <Text style={styles.specText}>в наличии: {item.stock_qty}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.actionBtn} 
            activeOpacity={0.8}
            onPress={() => handleContact(item)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>Связаться с поставщиком</Text>
          </TouchableOpacity>
        </View>

        {hasSub && isBest && saved > 0 && (
          <View style={styles.savingsBanner}>
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
      <View style={styles.center}>
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
          headerTintColor: "#0F172A",
          headerStyle: { backgroundColor: "#FFFFFF" },
        }}
      />

      <View style={styles.container}>
        {/* Шапка товара */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product?.name}</Text>
          <Text style={styles.productMeta}>
            {product?.category?.name || "Категория"}
            {product?.unit ? ` · Ед. изм: ${product.unit}` : ""}
          </Text>
          {product?.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}

          {hasSub ? (
            <View style={styles.subBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={styles.subBannerText}>Премиум-доступ активен: оптовые цены применены</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.promoBox}
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
          <Text style={styles.sortLabel}>Сортировать:</Text>
          <TouchableOpacity
            style={[styles.sortChip, sort === "price_asc" && styles.sortChipActive]}
            onPress={() => setSort("price_asc")}
          >
            <Text style={[styles.sortChipText, sort === "price_asc" && styles.sortChipTextActive]}>
              Сначала дешевле
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sort === "price_desc" && styles.sortChipActive]}
            onPress={() => setSort("price_desc")}
          >
            <Text style={[styles.sortChipText, sort === "price_desc" && styles.sortChipTextActive]}>
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>Предложений пока нет</Text>
              <Text style={styles.emptyDesc}>В выбранном регионе никто из поставщиков еще не выставил этот товар</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  productHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  productName: { fontSize: 20, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  productMeta: { marginTop: 4, fontSize: 13, color: "#64748B", fontWeight: "500" },
  productDesc: { marginTop: 8, fontSize: 14, color: "#334155", lineHeight: 20 },
  subBanner: {
    marginTop: 14,
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  subBannerText: { color: "#166534", fontSize: 13, fontWeight: "600" },
  promoBox: {
    marginTop: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    flexDirection: "row",
    alignItems: "center",
  },
  promoTitle: { color: "#92400E", fontWeight: "700", fontSize: 13 },
  promoSub: { color: "#B45309", fontSize: 12, marginTop: 2, fontWeight: "500" },
  savingsBanner: {
    marginTop: -4,
    marginBottom: 12,
    marginHorizontal: 4,
    backgroundColor: "#F0FDF4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
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
  sortLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sortChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  sortChipText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  sortChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBest: {
    borderColor: "#0284C7",
    borderWidth: 1.5,
    backgroundColor: "#F8FAFC",
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
  supplierName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  verifiedBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  regionText: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  oldPrice: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  finalPrice: { fontSize: 22, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: { color: "#16A34A", fontSize: 12, fontWeight: "700" },
  specsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 12 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  actionBtn: {
    marginTop: 16,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginTop: 12 },
  emptyDesc: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 20 },
});