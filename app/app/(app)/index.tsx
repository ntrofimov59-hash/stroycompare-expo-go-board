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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { api } from "../../src/api/client";
import { Product } from "../../src/types";
import { FadeCard } from "../../src/components/FadeCard";
import { useThemeStore } from "../../src/store/theme";
import { useSettingsStore } from "../../src/store/settings";
import { FilterSheet, Filters } from "../../src/components/FilterSheet";
import { RegionPicker } from "../../src/components/RegionPicker";
import { EmptyState } from "../../src/components/EmptyState";

const SLIDES = [
  { id: "f0000001-0000-0000-0000-000000000001", title: "Цемент М500", text: "Сравните мешок за минуту" },
  { id: "f0000001-0000-0000-0000-000000000002", title: "Арматура 12 мм", text: "Цены за тонну в вашем регионе" },
  { id: "f0000001-0000-0000-0000-000000000003", title: "Кладка кирпича", text: "Услуги подрядчиков рядом" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const regionName = useSettingsStore((s) => s.regionName);

  const pad = Math.max(insets.left, 16);
  const cardW = (width - pad * 2 - 12) / 2;

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Фильтры и регион
  const [filters, setFilters] = useState<Filters>({ categoryId: "", type: "", unit: "" });
  const [open, setOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const searchRef = useRef<TextInput>(null);
  const sliderRef = useRef<FlatList>(null);
  const [slide, setSlide] = useState(0);

  // Загрузка списка категорий для FilterSheet
  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => setCategories(data.categories || data || []))
      .catch((e) => console.log("categories error", e));
  }, []);

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
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.type) params.type = filters.type;

      const { data } = await api.get("/products", { params });
      let list: Product[] = data.products || [];

      if (filters.unit) {
        list = list.filter((p) => p.unit === filters.unit);
      }

      setProducts(list);
    } catch (e) {
      console.log("home error", e);
      Alert.alert("Нет связи", "Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, filters]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const units = [...new Set(products.map((p) => p.unit).filter(Boolean))];
  const activeCount = [filters.categoryId, filters.type, filters.unit].filter(Boolean).length;
  const hasActiveFiltersOrSearch = Boolean(query || activeCount > 0);

  const renderCard = ({ item }: { item: Product }) => (
    <FadeCard>
      <TouchableOpacity
        style={[styles.card, { width: cardW, backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/product/${item.id}`)}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={[styles.cardImage, { backgroundColor: mode === "dark" ? "#21262d" : "#EEF0F3" }]} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: mode === "dark" ? "#21262d" : "#EEF0F3" }]}>
            <Ionicons
              name={item.type === "service" ? "construct-outline" : "cube-outline"}
              size={42}
              color={colors.muted}
            />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
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
    <View style={[styles.top, { paddingHorizontal: pad, paddingTop: 4, marginBottom: 8 }]}>
      {/* Шапка */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setRegionOpen(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={18} color={colors.accent || "#2AABEE"} />
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }} numberOfLines={1}>
            {regionName || "Регион"}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(app)/subscription")} hitSlop={8}>
          <Ionicons name="diamond-outline" size={22} color={colors.accent || "#2AABEE"} />
        </TouchableOpacity>
      </View>

      {/* Поиск */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.bgElevated || (mode === "dark" ? "#161b22" : "#F2F2F7"),
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 12,
          height: 44,
          marginBottom: 12,
        }}
      >
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          ref={searchRef}
          style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 16 }}
          placeholder="Поиск материалов и услуг"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => setQuery(search.trim())}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(""); setQuery(""); }}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Слайдер и промо-блоки скрываем, если активен поиск или фильтры */}
      {!hasActiveFiltersOrSearch && (
        <>
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
                style={[styles.slide, { width: width - pad * 2, backgroundColor: mode === "dark" ? "#1f242c" : "#0F172A" }]}
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
              <View key={i} style={[styles.dot, { backgroundColor: mode === "dark" ? "#30363d" : "#D4D4D8" }, i === slide && styles.dotOn]} />
            ))}
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 6,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingVertical: 12,
          backgroundColor: mode === "dark" ? "#161b22" : "#F2F2F7",
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="options-outline" size={18} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
          Сортировка и фильтры{activeCount ? ` · ${activeCount}` : ""}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
                title="Нет товаров"
                text="Измените поиск или фильтр"
                actionLabel="Сбросить фильтр"
                onAction={() => {
                  setSearch("");
                  setQuery("");
                  setFilters({ categoryId: "", type: "", unit: "" });
                }}
              />
            }
          />
        )}
      </View>

      <FilterSheet
        visible={open}
        onClose={() => setOpen(false)}
        value={filters}
        onChange={setFilters}
        categories={categories}
        units={units}
      />

      <RegionPicker
        visible={regionOpen}
        onClose={() => setRegionOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { 
    paddingBottom: 4 
  },
  slide: {
    borderRadius: 16,
    padding: 18,
  },
  slideKicker: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  slideTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 8 },
  slideText: { color: "#CBD5E1", marginTop: 6, fontSize: 14 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: "#2AABEE", width: 16 },

  feed: { 
    paddingTop: 8,
    paddingBottom: 100, 
    paddingHorizontal: 0 
  },
  cardRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardImage: {
    width: "100%",
    height: 165,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", minHeight: 44 },
  cardDesc: { marginTop: 6, fontSize: 13, lineHeight: 18, minHeight: 36 },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#2AABEE" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});