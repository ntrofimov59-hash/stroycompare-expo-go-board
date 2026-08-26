import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../src/api/client";

const { width } = Dimensions.get("window");
const PAD = 12;
const GAP = 8;
const COL = (width - PAD * 2 - GAP) / 2;

type Product = {
  id: string;
  name: string;
  unit: string;
  type: string;
  description?: string;
  category?: { name: string };
};

const NAV_TABS = [
  { key: "board", label: "Доска" },
  { key: "compare", label: "Сравнение" },
  { key: "services", label: "Услуги" },
  { key: "tech", label: "Техника" },
] as const;

const CATEGORIES = [
  { id: "all", name: "Все", icon: "apps", lib: "ion" as const, color: "#2AABEE" },
  { id: "cement", name: "Цемент", icon: "cube", lib: "ion" as const, color: "#78716C" },
  { id: "metal", name: "Металл", icon: "barbell-outline", lib: "ion" as const, color: "#64748B" },
  { id: "wood", name: "Дерево", icon: "leaf", lib: "ion" as const, color: "#16A34A" },
  { id: "finish", name: "Отделка", icon: "brush", lib: "ion" as const, color: "#A855F7" },
  { id: "tool", name: "Инструмент", icon: "hammer", lib: "ion" as const, color: "#F59E0B" },
  { id: "service", name: "Услуги", icon: "construct", lib: "ion" as const, color: "#0EA5E9" },
  { id: "rent", name: "Аренда", icon: "car-outline", lib: "ion" as const, color: "#EF4444" },
];

function CatIcon({
  lib,
  name,
  color,
  size = 22,
}: {
  lib: "ion" | "mc";
  name: string;
  color: string;
  size?: number;
}) {
  if (lib === "mc") {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}

export default function BoardScreen() {
  const [nav, setNav] = useState<(typeof NAV_TABS)[number]["key"]>("board");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (query) params.search = query;

      if (nav === "services") params.type = "service";
      if (nav === "board" && category === "service") params.type = "service";
      if (nav === "tech") params.search = query || "аренда";
      if (nav === "compare") params.type = "material";

      const { data } = await api.get("/products", { params });
      let list: Product[] = data.products || [];

      if (category === "cement") {
        list = list.filter((p) => p.name.toLowerCase().includes("цемент"));
      } else if (category === "metal") {
        list = list.filter((p) =>
          /армат|металл/i.test(p.name + (p.category?.name || ""))
        );
      } else if (category === "service") {
        list = list.filter((p) => p.type === "service");
      }

      setProducts(list);
    } catch (e) {
      console.log("board error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, nav, category]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onSearch = () => setQuery(search.trim());

  const renderCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/product/${item.id}`)}
    >
      <View style={styles.cardImage}>
        <Ionicons
          name={item.type === "service" ? "construct-outline" : "cube-outline"}
          size={36}
          color="#A0A0A0"
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.category?.name || (item.type === "service" ? "Услуга" : "Материал")}
          {" · "}
          {item.unit}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>Сравнить цены</Text>
          <Ionicons name="chevron-forward" size={16} color="#2AABEE" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = (
    <View>
      {/* Подсказка для режима сравнения */}
      {nav === "compare" && (
        <View style={styles.compareNotice}>
          <Text style={styles.compareNoticeText}>
            Выберите товар — откроется сравнение цен поставщиков
          </Text>
        </View>
      )}

      {/* 1. Поиск + premium-баннер */}
      <View style={styles.searchBlock}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Цемент, арматура, кладка..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={onSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={onSearch}>
              <Text style={styles.findBtn}>Найти</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.premiumBanner}
          activeOpacity={0.85}
          onPress={() => router.push("/(app)/subscription")}
        >
          <Ionicons name="sparkles" size={16} color="#F59E0B" />
          <Text style={styles.premiumText}>
            Premium — скидка до 15% на цены в сравнении
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* 2. Bento-категории */}
      <View style={styles.bento}>
        {CATEGORIES.map((item) => {
          const active = category === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.bentoCell,
                active && { backgroundColor: item.color, borderColor: item.color },
              ]}
              onPress={() => setCategory(item.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.bentoIconWrap,
                  { backgroundColor: active ? "rgba(255,255,255,0.25)" : `${item.color}18` },
                ]}
              >
                <CatIcon
                  lib={item.lib}
                  name={item.icon}
                  color={active ? "#FFFFFF" : item.color}
                  size={20}
                />
              </View>
              <Text
                style={[styles.bentoLabel, active && { color: "#FFFFFF" }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Доска / Сравнение / ... */}
      <View style={styles.nav}>
        {NAV_TABS.map((t) => {
          const active = nav === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => setNav(t.key)}
            >
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2AABEE" />
        </View>
      ) : (
        <Animated.FlatList
          data={products}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.cardRow}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.feed}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
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
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Объявлений пока нет</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },

  compareNotice: {
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DBEAFE",
  },
  compareNoticeText: { color: "#1D4ED8", fontWeight: "600", fontSize: 13 },

  searchBlock: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: PAD,
    paddingTop: 8,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A", paddingVertical: 0 },
  findBtn: { color: "#2AABEE", fontWeight: "700", fontSize: 14 },
  premiumBanner: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  premiumText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "600" },

  bento: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: PAD,
    paddingTop: 12,
    paddingBottom: 4,
    gap: GAP,
    backgroundColor: "#FFFFFF",
  },
  bentoCell: {
    width: COL,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bentoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoLabel: { fontSize: 13, fontWeight: "600", color: "#0F172A", flex: 1 },

  nav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E7",
  },
  navItem: { paddingVertical: 12, paddingHorizontal: 12, marginRight: 2 },
  navItemActive: { borderBottomWidth: 2, borderBottomColor: "#2AABEE" },
  navText: { fontSize: 15, color: "#707579", fontWeight: "500" },
  navTextActive: { color: "#0F172A", fontWeight: "700" },

  feed: { paddingBottom: 32 },
  cardRow: {
    justifyContent: "space-between",
    paddingHorizontal: PAD,
    marginBottom: 10,
  },
  card: {
    width: COL,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardImage: {
    height: 100,
    backgroundColor: "#EEF0F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A", minHeight: 36 },
  cardMeta: { marginTop: 4, fontSize: 11, color: "#8E8E93" },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPrice: { fontSize: 13, fontWeight: "700", color: "#2AABEE" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { paddingTop: 40, alignItems: "center" },
  empty: { color: "#707579", fontSize: 15 },
});