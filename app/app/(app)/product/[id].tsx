import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
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
    company_name: string;
    rating: number;
    reviews_count: number;
    is_verified: boolean;
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

  const renderOffer = ({ item, index }: { item: Offer; index: number }) => {
    const hasDiscount = item.discount_percent > 0 && item.final_price < item.price;
    const isBest = index === 0 && sort === "price_asc";

    return (
      <View style={[styles.card, isBest && styles.cardBest]}>
        {isBest && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>Лучшая цена</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.supplierRow}>
              <Text style={styles.supplierName}>{item.supplier.company_name}</Text>
              {item.supplier.is_verified && (
                <Text style={styles.verified}>✓</Text>
              )}
            </View>
            <Text style={styles.rating}>
              ★ {item.supplier.rating.toFixed(1)}
              {item.supplier.reviews_count > 0
                ? ` · ${item.supplier.reviews_count} отзывов`
                : ""}
            </Text>
          </View>
          <Text style={styles.region}>{item.region?.name}</Text>
        </View>

        <View style={styles.priceBlock}>
          {hasDiscount ? (
            <>
              <Text style={styles.oldPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.finalPrice}>{formatPrice(item.final_price)}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>−{item.discount_percent}%</Text>
              </View>
            </>
          ) : (
            <Text style={styles.finalPrice}>{formatPrice(item.price)}</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            от {item.min_order_qty} {product?.unit || "шт"}
          </Text>
          {item.delivery_days != null && (
            <Text style={styles.meta}>· {item.delivery_days} дн.</Text>
          )}
          {item.stock_qty != null && (
            <Text style={styles.meta}>· в наличии {item.stock_qty}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionText}>Связаться</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2AABEE" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: product?.name || "Сравнение",
          headerBackTitle: "Назад",
        }}
      />

      <View style={styles.container}>
        {/* Шапка товара */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product?.name}</Text>
          <Text style={styles.productMeta}>
            {product?.category?.name}
            {product?.unit ? ` · ${product.unit}` : ""}
          </Text>
          {product?.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}

          {hasSub && (
            <View style={styles.subBanner}>
              <Text style={styles.subBannerText}>Ваша скидка по подписке применена</Text>
            </View>
          )}
        </View>

        {/* Сортировка */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Сортировка:</Text>
          <TouchableOpacity
            style={[styles.sortChip, sort === "price_asc" && styles.sortChipActive]}
            onPress={() => setSort("price_asc")}
          >
            <Text
              style={[
                styles.sortChipText,
                sort === "price_asc" && styles.sortChipTextActive,
              ]}
            >
              Дешевле
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sort === "price_desc" && styles.sortChipActive]}
            onPress={() => setSort("price_desc")}
          >
            <Text
              style={[
                styles.sortChipText,
                sort === "price_desc" && styles.sortChipTextActive,
              ]}
            >
              Дороже
            </Text>
          </TouchableOpacity>
        </View>

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
              tintColor="#2AABEE"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Нет предложений в этом регионе</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  productHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E7",
  },
  productName: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  productMeta: { marginTop: 4, fontSize: 13, color: "#707579" },
  productDesc: { marginTop: 8, fontSize: 14, color: "#3F3F46", lineHeight: 20 },
  subBanner: {
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  subBannerText: { color: "#15803D", fontSize: 13, fontWeight: "600" },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  sortLabel: { fontSize: 13, color: "#707579", marginRight: 4 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  sortChipActive: { backgroundColor: "#2AABEE" },
  sortChipText: { fontSize: 13, color: "#0F172A" },
  sortChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  list: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardBest: {
    borderWidth: 1.5,
    borderColor: "#2AABEE",
  },
  bestBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2AABEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  bestBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  supplierRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  supplierName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  verified: { color: "#2AABEE", fontWeight: "700", fontSize: 14 },
  rating: { marginTop: 2, fontSize: 13, color: "#707579" },
  region: { fontSize: 12, color: "#A0A0A0" },
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  oldPrice: {
    fontSize: 14,
    color: "#A0A0A0",
    textDecorationLine: "line-through",
  },
  finalPrice: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { color: "#16A34A", fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
  meta: { fontSize: 13, color: "#707579" },
  actionBtn: {
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  actionText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  empty: { color: "#707579", fontSize: 15 },
});