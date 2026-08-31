import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { useSettingsStore } from "../../src/store/settings";
import { useThemeStore } from "../../src/store/theme";

type Offer = {
  id: string;
  price: number;
  min_order_qty: number;
  delivery_days?: number;
  is_active: boolean;
  product?: { id: string; name: string; unit: string };
  region?: { id: string; name: string };
};

type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
};

export default function SupplierOffersScreen() {
  const currentRegionId = useSettingsStore((s: any) => s.regionId);
  const currentRegionName = useSettingsStore((s: any) => s.regionName);
  const { mode, colors } = useThemeStore();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subInfo, setSubInfo] = useState<any>(null);

  // Модальное окно и форма
  const [modal, setModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [price, setPrice] = useState("");
  const [minQty, setMinQty] = useState("1");
  const [deliveryDays, setDeliveryDays] = useState("2");
  const [saving, setSaving] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [offersRes, subRes] = await Promise.all([
        api.get("/offers/me"),
        api.get("/subscriptions/me").catch(() => ({ data: null })),
      ]);
      setOffers(offersRes.data.offers || []);
      setSubInfo(subRes.data);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || "Ошибка загрузки";
      Alert.alert("Кабинет", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const loadCatalog = async () => {
    try {
      const { data } = await api.get("/products");
      setCatalogProducts(data.products || data || []);
    } catch (e) {
      console.log("Error loading catalog", e);
    }
  };

  const handleOpenModal = () => {
    loadCatalog();
    setSelectedProduct(null);
    setPrice("");
    setMinQty("1");
    setDeliveryDays("2");
    setModal(true);
  };

  const createOffer = async () => {
    if (!currentRegionId) {
      Alert.alert("Выберите регион", "Сначала укажите регион в профиле");
      return;
    }

    const p = parseFloat(price.replace(",", "."));
    if (!selectedProduct) {
      Alert.alert("Ошибка", "Выберите товар из каталога");
      return;
    }
    if (!p || p <= 0) {
      Alert.alert("Ошибка", "Укажите корректную цену");
      return;
    }

    setSaving(true);
    try {
      await api.post("/offers", {
        product_id: selectedProduct.id,
        region_id: currentRegionId,
        price: Number(p),
        min_order_qty: Number(minQty) || 1,
        delivery_days: Number(deliveryDays) || undefined,
        supports_discount: true,
      });
      setModal(false);
      load(true);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = (id: string) => {
    Alert.alert("Скрыть предложение?", "", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Скрыть",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/offers/${id}`);
            load(true);
          } catch (e: any) {
            Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось");
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Мои предложения",
          headerRight: () => (
            <TouchableOpacity onPress={handleOpenModal} style={styles.headerBtn}>
              <Ionicons name="add" size={22} color="#2AABEE" />
              <Text style={styles.headerBtnText}>Добавить</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2AABEE" />
          </View>
        ) : (
          <FlatList
            data={offers}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={{ marginBottom: 12 }}>
                {subInfo?.has_subscription ? (
                  <Text style={{ color: "#10b981", marginBottom: 8, fontWeight: "600" }}>
                    Подписка активна до {new Date(subInfo.subscription.end_at).toLocaleDateString("ru-RU")}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => router.push("/(app)/subscription")}>
                    <Text style={{ color: "#E8A017", marginBottom: 8, fontWeight: "600" }}>
                      Нет активной подписки — продлить Premium
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load(true);
                }}
                tintColor="#2AABEE"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="pricetags-outline" size={48} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  У вас пока нет активных предложений. Добавьте цены, чтобы они появились в общем сравнении.
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenModal}>
                  <Text style={styles.emptyBtnText}>Добавить первую цену</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                    {item.product?.name || "Товар"}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.is_active ? (mode === "dark" ? "#064e3b" : "#DCFCE7") : (mode === "dark" ? "#1e293b" : "#F1F5F9") },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.is_active ? "#15803D" : colors.muted },
                      ]}
                    >
                      {item.is_active ? "Активно" : "Скрыто"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.meta, { color: colors.muted }]}>
                  📍 {item.region?.name || currentRegionName || "Москва"} · Мин. заказ: {item.min_order_qty} {item.product?.unit || "шт"}
                  {item.delivery_days ? ` · ${item.delivery_days} дн.` : ""}
                </Text>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.price, { color: colors.text }]}>
                    {item.price.toLocaleString("ru-RU")} ₽
                    <Text style={[styles.unit, { color: colors.muted }]}> / {item.product?.unit || "шт"}</Text>
                  </Text>

                  {item.is_active && (
                    <TouchableOpacity
                      style={[styles.hideBtn, { backgroundColor: mode === "dark" ? "#450a0a" : "#FEF2F2" }]}
                      onPress={() => deactivate(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={styles.hideText}>Снять</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}

        {/* Плавающая кнопка для быстрого доступа */}
        <TouchableOpacity style={styles.fab} onPress={handleOpenModal} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Новая цена</Text>
        </TouchableOpacity>

        {/* Модальное окно создания офера */}
        <Modal visible={modal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={[styles.modalIndicator, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Добавить предложение</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.label, { color: colors.muted }]}>Выберите товар из каталога *</Text>
                <View style={[styles.catalogBox, { backgroundColor: mode === "dark" ? "#161b22" : "#FAFAFA", borderColor: colors.border }]}>
                  {catalogProducts.length === 0 ? (
                    <ActivityIndicator size="small" color="#2AABEE" style={{ padding: 10 }} />
                  ) : (
                    catalogProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.catalogItem,
                          selectedProduct?.id === p.id && styles.catalogItemActive,
                        ]}
                        onPress={() => setSelectedProduct(p)}
                      >
                        <Text
                          style={[
                            styles.catalogItemText,
                            { color: colors.text },
                            selectedProduct?.id === p.id && styles.catalogItemTextActive,
                          ]}
                        >
                          {p.name} ({p.unit})
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                <Text style={[styles.label, { color: colors.muted }]}>Цена за 1 {selectedProduct?.unit || "ед."} (₽) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: mode === "dark" ? "#21262d" : "#F2F2F7", color: colors.text }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="Например: 1500"
                  placeholderTextColor={colors.muted}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.label, { color: colors.muted }]}>Мин. объем</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: mode === "dark" ? "#21262d" : "#F2F2F7", color: colors.text }]}
                      value={minQty}
                      onChangeText={setMinQty}
                      keyboardType="numeric"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.label, { color: colors.muted }]}>Срок (дней)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: mode === "dark" ? "#21262d" : "#F2F2F7", color: colors.text }]}
                      value={deliveryDays}
                      onChangeText={setDeliveryDays}
                      keyboardType="numeric"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={createOffer}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Опубликовать в прайс</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModal(false)} style={{ paddingVertical: 12 }}>
                  <Text style={[styles.cancel, { color: colors.muted }]}>Отмена</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
  headerBtnText: { color: "#2AABEE", fontWeight: "600", fontSize: 15 },
  list: { padding: 16, paddingBottom: 100 },
  
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  name: { fontSize: 16, fontWeight: "600", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  meta: { marginTop: 6, fontSize: 13 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  price: { fontSize: 18, fontWeight: "700" },
  unit: { fontSize: 13, fontWeight: "400" },
  hideBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  hideText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },

  emptyContainer: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyText: { textAlign: "center", marginTop: 12, fontSize: 14, lineHeight: 20 },
  emptyBtn: { marginTop: 16, backgroundColor: "#2AABEE", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  rowInputs: { flexDirection: "row" },
  catalogBox: { maxHeight: 160, borderWidth: 1, borderRadius: 12, padding: 6 },
  catalogItem: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  catalogItemActive: { backgroundColor: "#2AABEE" },
  catalogItemText: { fontSize: 14 },
  catalogItemTextActive: { color: "#FFFFFF", fontWeight: "600" },

  saveBtn: {
    backgroundColor: "#2AABEE",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancel: { textAlign: "center", fontWeight: "600", fontSize: 15 },
});