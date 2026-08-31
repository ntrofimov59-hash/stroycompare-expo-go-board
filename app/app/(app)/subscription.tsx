import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";
import { useThemeStore } from "../../src/store/theme";

const FEATURES = [
  {
    icon: "pricetag" as const,
    color: "#E8A017",
    title: "Скидка в сравнении",
    text: "Цена с подпиской сразу в карточке поставщика — без калькулятора.",
  },
  {
    icon: "storefront" as const,
    color: "#5B8DEF",
    title: "Кабинет поставщика",
    text: "Свои прайсы в таблице сравнения. Trial при регистрации как supplier.",
  },
  {
    icon: "flash" as const,
    color: "#E85D4C",
    title: "Быстрый выбор",
    text: "Регион, наличие и срок в одном экране — не десять вкладок.",
  },
  {
    icon: "shield-checkmark" as const,
    color: "#4AB0A0",
    title: "Прозрачные условия",
    text: "Один тариф. Без скрытых комиссий на этом этапе.",
  },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuthStore();
  const { mode, colors } = useThemeStore();
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const star = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(star, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(star, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const load = async () => {
    try {
      const plansRes = await api.get("/subscriptions/plans");
      const list = plansRes.data.plans || plansRes.data || [];
      const paid = list.filter((p: any) => p.price > 0 && p.is_active);
      setPlans(paid);
      if (paid.length > 0 && !selectedPlanId) {
        setSelectedPlanId(paid[0].id);
      }
      if (accessToken) {
        const meRes = await api.get("/subscriptions/me");
        setMySub(meRes.data);
      } else {
        setMySub(null);
      }
    } catch {
      setMySub(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [accessToken])
  );

  const purchase = async () => {
    if (!accessToken) {
      Alert.alert("Войдите", "Чтобы подключить Premium, нужен аккаунт", [
        { text: "Отмена", style: "cancel" },
        { text: "Войти", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    if (!selectedPlanId) {
      Alert.alert("Выберите тариф");
      return;
    }
    setBuying(true);
    try {
      await api.post("/subscriptions/purchase", { plan_id: selectedPlanId });
      await load();
      Alert.alert("Готово", "Premium активирован (тестовый режим)");
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось");
    } finally {
      setBuying(false);
    }
  };

  const hasSub = !!mySub?.has_subscription;
  const until = mySub?.subscription?.end_at
    ? new Date(mySub.subscription.end_at).toLocaleDateString("ru-RU")
    : "";
  const isSupplier = user?.role === "supplier";

  const scale = star.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const glow = star.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <ActivityIndicator color="#E8A017" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.hero, { opacity: fade, transform: [{ translateY: rise }] }]}
          >
            <Animated.View
              style={[
                styles.starWrap,
                { 
                  opacity: glow, 
                  transform: [{ scale }],
                  backgroundColor: mode === "dark" ? "#33270c" : "#FFF6E0" 
                },
              ]}
            >
              <Ionicons name="diamond" size={56} color="#E8A017" />
            </Animated.View>
            <Text style={[styles.brand, { color: colors.muted }]}>StroyCompare</Text>
            <Text style={[styles.h1, { color: colors.text }]}>Premium</Text>
            <Text style={[styles.lead, { color: colors.muted }]}>
              {hasSub
                ? `Подписка активна${until ? ` до ${until}` : ""}`
                : "Скидка в сравнении цен и доступ к кабинету поставщика"}
            </Text>
          </Animated.View>

          {!hasSub && plans.length > 0 && (
            <View style={{ marginTop: 20, gap: 10 }}>
              {plans.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPlanId(p.id)}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selectedPlanId === p.id ? "#E8A017" : colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>
                    {p.price.toLocaleString("ru-RU")} ₽ / {p.duration_days} дн.
                    {p.discount_percent > 0 ? ` · скидка ${p.discount_percent}%` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />

          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} index={i} colors={colors} />
          ))}

          {hasSub && isSupplier && (
            <TouchableOpacity
              style={[styles.linkCard, { backgroundColor: mode === "dark" ? "#21262d" : "#F2F2F7" }]}
              onPress={() => router.push("/(app)/supplier-offers")}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={22} color="#5B8DEF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.linkTitle, { color: colors.text }]}>Мои предложения</Text>
                <Text style={[styles.linkSub, { color: colors.muted }]}>Цены в таблице сравнения</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}

          {/* Увеличенный отступ, чтобы контент не перекрывался плавающей кнопкой и таб-баром */}
          <View style={{ height: 130 }} />
        </ScrollView>

        {/* Плавающая кнопка поднята выше таб-бара */}
        <View style={[styles.dock, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          {!hasSub ? (
            <TouchableOpacity
              onPress={purchase}
              disabled={buying || !selectedPlanId}
              style={{
                backgroundColor: "#E8A017",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                opacity: buying || !selectedPlanId ? 0.7 : 1,
              }}
            >
              {buying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  Подключить Premium
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/(app)/")}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Сравнить цены со скидкой</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function FeatureRow({
  icon,
  color,
  title,
  text,
  index,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  text: string;
  index: number;
  colors: any;
}) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay: 180 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const y = a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[styles.feat, { opacity: a, transform: [{ translateY: y }] }]}>
      <View style={[styles.featIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.featTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featText, { color: colors.muted }]}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 28 },
  hero: { alignItems: "center", marginBottom: 28 },
  starWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
  h1: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  lead: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  feat: { flexDirection: "row", gap: 14, marginBottom: 20, alignItems: "flex-start" },
  featIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featTitle: { fontSize: 17, fontWeight: "700" },
  featText: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  linkTitle: { fontSize: 16, fontWeight: "600" },
  linkSub: { marginTop: 2, fontSize: 13 },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 74,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dockPrice: {
    textAlign: "center",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  cta: {
    backgroundColor: "#E8A017",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E" },
});