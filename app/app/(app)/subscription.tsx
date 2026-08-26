import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";

type Plan = {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  discount_percent: number;
};

export default function SubscriptionScreen() {
  const { accessToken, user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  const load = async () => {
    try {
      const plansRes = await api.get("/subscriptions/plans");
      setPlans(plansRes.data.plans || []);
      if (accessToken) {
        const meRes = await api.get("/subscriptions/me");
        setMySub(meRes.data);
      } else {
        setMySub(null);
      }
    } catch (e) {
      console.log(e);
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

  const purchase = async (planId: string) => {
    if (!accessToken) {
      Alert.alert("Войдите", "Нужен аккаунт");
      return;
    }
    setBuying(planId);
    try {
      await api.post("/subscriptions/purchase", { plan_id: planId });
      Alert.alert("Готово", "Подписка активирована");
      await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось");
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2AABEE" />
      </View>
    );
  }

  const hasSub = !!mySub?.has_subscription;
  const plan = mySub?.subscription?.plan;
  const isTrial = mySub?.subscription?.payment_id?.startsWith?.("trial");
  const isSupplier = user?.role === "supplier";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor="#2AABEE" />
      }
    >
      <Text style={styles.h1}>Premium</Text>
      <Text style={styles.lead}>
        Скидки в сравнении цен и доступ к кабинету поставщика
      </Text>

      {/* Статус */}
      {hasSub ? (
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusTitle}>
                {isTrial ? "Пробный период" : "Подписка активна"}
                {plan ? ` · ${plan.name}` : ""}
              </Text>
              <Text style={styles.statusMeta}>
                Скидка −{plan?.discount_percent}% · до{" "}
                {new Date(mySub.subscription.end_at).toLocaleDateString("ru-RU")}
              </Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <Benefit icon="pricetag-outline" text="Цены со скидкой в сравнении" />
            <Benefit icon="storefront-outline" text="Размещение предложений" />
            <Benefit icon="trending-down-outline" text="Экономия на закупках" />
          </View>
        </View>
      ) : (
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            Без Premium цены в сравнении без скидки. Поставщикам нужен Premium или trial.
          </Text>
        </View>
      )}

      {/* Для поставщика */}
      {isSupplier && (
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(app)/supplier-offers")}
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={22} color="#2AABEE" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionTitle}>Мои предложения</Text>
            <Text style={styles.actionSub}>Цены в сравнении для ваших товаров</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
        </TouchableOpacity>
      )}

      {/* Быстрый переход к ценам */}
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => router.push("/(app)/")}
        activeOpacity={0.7}
      >
        <Ionicons name="git-compare-outline" size={22} color="#0F172A" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.actionTitle}>Сравнить цены</Text>
          <Text style={styles.actionSub}>
            {hasSub ? "Скидка уже применяется" : "Откройте товар в разделе Цены"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        {hasSub ? "Сменить тариф" : "Выбрать тариф"}
      </Text>

      {plans.map((p) => (
        <View key={p.id} style={styles.plan}>
          <View style={styles.planTop}>
            <Text style={styles.planName}>{p.name}</Text>
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>−{p.discount_percent}%</Text>
            </View>
          </View>
          {p.description ? (
            <Text style={styles.planDesc}>{p.description}</Text>
          ) : null}
          <Text style={styles.planPrice}>
            {p.price} ₽
            <Text style={styles.planDays}> / {p.duration_days} дн.</Text>
          </Text>
          <TouchableOpacity
            style={styles.buyBtn}
            disabled={!!buying}
            onPress={() => purchase(p.id)}
          >
            {buying === p.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyText}>
                {hasSub ? "Перейти на тариф" : "Подключить"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function Benefit({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.benefit}>
      <Ionicons name={icon} size={16} color="#15803D" />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  h1: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  lead: { marginTop: 6, marginBottom: 16, fontSize: 14, color: "#707579", lineHeight: 20 },
  statusCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  statusTop: { flexDirection: "row", alignItems: "center" },
  statusTitle: { fontWeight: "700", color: "#15803D", fontSize: 15 },
  statusMeta: { marginTop: 2, fontSize: 13, color: "#16A34A" },
  benefitRow: { marginTop: 12, gap: 8 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 13, color: "#166534" },
  hintCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  hintText: { fontSize: 13, color: "#92400E", lineHeight: 18 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionTitle: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  actionSub: { marginTop: 2, fontSize: 12, color: "#8E8E93" },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  plan: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  discountPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { color: "#16A34A", fontWeight: "700", fontSize: 14 },
  planDesc: { marginTop: 8, fontSize: 14, color: "#707579" },
  planPrice: { marginTop: 12, fontSize: 22, fontWeight: "700", color: "#0F172A" },
  planDays: { fontSize: 14, fontWeight: "500", color: "#707579" },
  buyBtn: {
    marginTop: 14,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buyText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});