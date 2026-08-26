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
  useWindowDimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { Product } from "../../src/types";
import { FadeCard } from "../../src/components/FadeCard"; // Импорт компонента анимации

const SLIDES = [
  { id: "f0000001-0000-0000-0000-000000000001", title: "Цемент М500", text: "Сравните мешок за минуту" },
  { id: "f0000001-0000-0000-0000-000000000002", title: "Арматура 12 мм", text: "Цены за тонну в вашем регионе" },
  { id: "f0000001-0000-0000-0000-000000000003", title: "Кладка кирпича", text: "Услуги подрядчиков рядом" },
];

const CATEGORIES = [
  { id: "all", name: "Все" },
  { id: "cement", name: "Цемент" },
  { id: "metal", name: "Металл" },
  { id: "wood", name: "Дерево" },
  { id: "finish", name: "Отделка" },
  { id: "tool", name: "Инструмент" },
  { id: "service", name: "Услуги" },
  { id: "rent", name: "Аренда" },
];

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon} size={48} color="#A0A0A0" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const pad = Math.max(insets.left, 16);
  const cardW = (width - pad * 2 - 10) / 2;

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchRef = useRef<TextInput>(null);
  const sliderRef = useRef<FlatList>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (slide + 1) % SLIDES.length;
      sliderRef.current?.scrollToIndex({ index: next, animated: true });
      setSlide(next);
    }, 3500);
    return () => clearInterval(t);
  }, [slide]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (query) params.search = query;
      if (category === "service") params.type = "service";

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
      console.log("home error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, category]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const renderCard = ({ item }: { item: Product }) => (
    <FadeCard>
      <TouchableOpacity
        style={[styles.card, { width: cardW }]}
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/product/${item.id}`)}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImage}>
            <Ionicons
              name={item.type === "service" ? "construct-outline" : "cube-outline"}
              size={36}
              color="#A0A0A0"
            />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.category?.name || (item.type === "service" ? "Услуга" : "Материал")} · {item.unit}
            </Text>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>Сравнить</Text>
            <Ionicons name="chevron-forward" size={16} color="#2AABEE" />
          </View>
        </View>
      </TouchableOpacity>
    </FadeCard>
  );

  const ListHeader = (
    <View style={styles.top}>
      <Text style={styles.slogan}>Цены на стройку — в одном месте</Text>
      <Text style={styles.sloganSub}>Сравните поставщиков и не открывайте десять сайтов</Text>

      <View style={styles.searchCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Цемент, арматура, кладка..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => setQuery(search.trim())}
          />
        </View>
        <TouchableOpacity
          style={styles.premChip}
          onPress={() => router.push("/(app)/subscription")}
        >
          <Ionicons name="sparkles" size={14} color="#B45309" />
          <Text style={styles.premChipText}>−15% с Premium</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={sliderRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (width - pad * 2));
          setSlide(i);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.slide, { width: width - pad * 2 }]}
            onPress={() => router.push(`/(app)/product/${item.id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.slideKicker}>Сравнить за минуту</Text>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideText}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slide && styles.dotOn]} />
        ))}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
        renderItem={({ item }) => {
          const active = category === item.id;
          return (
            <TouchableOpacity
              style={[styles.catChip, active && styles.catChipOn]}
              onPress={() => setCategory(item.id)}
            >
              <Text style={[styles.catChipText, active && { color: "#fff" }]}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      <View style={[styles.container]}>
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
            columnWrapperStyle={[styles.cardRow, { paddingHorizontal: pad }]}
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
              <EmptyState
                icon="cube-outline"
                title="Нет позиций"
                text="Измените категорию или поисковый запрос"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  top: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  slogan: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  sloganSub: { marginTop: 4, marginBottom: 14, fontSize: 14, color: "#8E8E93", lineHeight: 20 },
  searchCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 8,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#0F172A", paddingVertical: 0 },
  premChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  premChipText: { fontSize: 13, fontWeight: "700", color: "#B45309" },

  slide: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 18,
  },
  slideKicker: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  slideTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 8 },
  slideText: { color: "#CBD5E1", marginTop: 6, fontSize: 14 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D4D4D8" },
  dotOn: { backgroundColor: "#2AABEE", width: 16 },

  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  catChipOn: { backgroundColor: "#2AABEE" },
  catChipText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },

  feed: { paddingBottom: 100 },
  cardRow: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#EEF0F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", minHeight: 40 },
  cardDesc: { marginTop: 4, fontSize: 12, lineHeight: 16, color: "#52525B", minHeight: 32 },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPrice: { fontSize: 13, fontWeight: "700", color: "#2AABEE" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { paddingTop: 60, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#0F172A" },
  emptyText: { marginTop: 6, fontSize: 13, color: "#8E8E93", textAlign: "center" },
});