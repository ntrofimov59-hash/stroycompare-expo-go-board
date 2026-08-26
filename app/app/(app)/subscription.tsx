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

const PLAN_ID = "c0000001-0000-0000-0000-000000000002";

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
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

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
      Alert.alert("Войдите", "Чтобы подключить Premium, нужен аккаунт");
      return;
    }
    setBuying(true);
    try {
      await api.post("/subscriptions/purchase", { plan_id: PLAN_ID });
      await load();
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
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#E8A017" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      <View style={styles.root}>
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
                { opacity: glow, transform: [{ scale }] },
              ]}
            >
              <Ionicons name="diamond" size={56} color="#E8A017" />
            </Animated.View>
            <Text style={styles.brand}>StroyCompare</Text>
            <Text style={styles.h1}>Premium</Text>
            <Text style={styles.lead}>
              {hasSub
                ? `Подписка активна${until ? ` до ${until}` : ""}`
                : "Скидка в сравнении цен и доступ к кабинету поставщика"}
            </Text>
          </Animated.View>

          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} index={i} />
          ))}

          {hasSub && isSupplier && (
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => router.push("/(app)/supplier-offers")}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={22} color="#5B8DEF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.linkTitle}>Мои предложения</Text>
                <Text style={styles.linkSub}>Цены в таблице сравнения</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}

          {/* Увеличенный отступ, чтобы контент не перекрывался плавающей кнопкой и таб-баром */}
          <View style={{ height: 130 }} />
        </ScrollView>

        {/* Плавающая кнопка поднята выше таб-бара */}
        <View style={styles.dock}>
          {!hasSub ? (
            <>
              <Text style={styles.dockPrice}>699 ₽ · 90 дней</Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={purchase}
                disabled={buying}
                activeOpacity={0.85}
              >
                {buying ? (
                  <ActivityIndicator color="#1C1C1E" />
                ) : (
                  <Text style={styles.ctaText}>Подключить Premium</Text>
                )}
              </TouchableOpacity>
            </>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  text: string;
  index: number;
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
        <Text style={styles.featTitle}>{title}</Text>
        <Text style={styles.featText}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 28 },
  hero: { alignItems: "center", marginBottom: 28 },
  starWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF6E0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 13, fontWeight: "600", color: "#8E8E93", letterSpacing: 0.4 },
  h1: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
  },
  lead: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: "#8E8E93",
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
  featTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  featText: { marginTop: 4, fontSize: 14, lineHeight: 20, color: "#8E8E93" },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  linkTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  linkSub: { marginTop: 2, fontSize: 13, color: "#8E8E93" },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    // Установлено выше плавающего таб-бара (высота таб-бара ~56 + отступ снизу 10 + зазор)
    bottom: 74,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
  },
  dockPrice: {
    textAlign: "center",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  cta: {
    backgroundColor: "#E8A017",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E" },
});