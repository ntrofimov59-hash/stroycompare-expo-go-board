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
import { useFocusEffect, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { useSettingsStore } from "../../src/store/settings";

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

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const { data } = await api.get("/offers/me");
      setOffers(data.offers || []);
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
        region_id: currentRegionId || "a0000001-0000-0000-0000-000000000001",
        price: p,
        min_order_qty: parseInt(minQty) || 1,
        delivery_days: parseInt(deliveryDays) || 1,
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
    Alert.alert("Снять с публикации?", "Предложение исчезнет из сравнения цен покупателей.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Снять",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/offers/${id}`);
            load(true);
          } catch {
            Alert.alert("Ошибка", "Не удалось изменить статус");
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

      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2AABEE" />
          </View>
        ) : (
          <FlatList
            data={offers}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.list}
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
                <Ionicons name="pricetags-outline" size={48} color="#A0A0A0" />
                <Text style={styles.emptyText}>
                  У вас пока нет активных предложений. Добавьте цены, чтобы они появились в общем сравнении.
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenModal}>
                  <Text style={styles.emptyBtnText}>Добавить первую цену</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.product?.name || "Товар"}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.is_active ? "#DCFCE7" : "#F1F5F9" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.is_active ? "#15803D" : "#64748B" },
                      ]}
                    >
                      {item.is_active ? "Активно" : "Скрыто"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.meta}>
                  📍 {item.region?.name || currentRegionName || "Москва"} · Мин. заказ: {item.min_order_qty} {item.product?.unit || "шт"}
                  {item.delivery_days ? ` · ${item.delivery_days} дн.` : ""}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.price}>
                    {item.price.toLocaleString("ru-RU")} ₽
                    <Text style={styles.unit}> / {item.product?.unit || "шт"}</Text>
                  </Text>

                  {item.is_active && (
                    <TouchableOpacity
                      style={styles.hideBtn}
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
            <View style={styles.modal}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>Добавить предложение</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Выберите товар из каталога *</Text>
                <View style={styles.catalogBox}>
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
                            selectedProduct?.id === p.id && styles.catalogItemTextActive,
                          ]}
                        >
                          {p.name} ({p.unit})
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                <Text style={styles.label}>Цена за 1 {selectedProduct?.unit || "ед."} (₽) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="Например: 1500"
                  placeholderTextColor="#8E8E93"
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Мин. объем</Text>
                    <TextInput
                      style={styles.input}
                      value={minQty}
                      onChangeText={setMinQty}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Срок (дней)</Text>
                    <TextInput
                      style={styles.input}
                      value={deliveryDays}
                      onChangeText={setDeliveryDays}
                      keyboardType="numeric"
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
                  <Text style={styles.cancel}>Отмена</Text>
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
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
  headerBtnText: { color: "#2AABEE", fontWeight: "600", fontSize: 15 },
  list: { padding: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: "#fff",
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
  name: { fontSize: 16, fontWeight: "600", color: "#0F172A", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  meta: { marginTop: 6, fontSize: 13, color: "#707579" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E4E4E7" },
  price: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  unit: { fontSize: 13, fontWeight: "400", color: "#707579" },
  hideBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF2F2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  hideText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },

  emptyContainer: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyText: { textAlign: "center", color: "#707579", marginTop: 12, fontSize: 14, lineHeight: 20 },
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalIndicator: {
    width: 36,
    height: 4,
    backgroundColor: "#E4E4E7",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  rowInputs: { flexDirection: "row" },
  catalogBox: { maxHeight: 160, borderWidth: 1, borderColor: "#E4E4E7", borderRadius: 12, padding: 6, backgroundColor: "#FAFAFA" },
  catalogItem: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  catalogItemActive: { backgroundColor: "#2AABEE" },
  catalogItemText: { fontSize: 14, color: "#0F172A" },
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
  cancel: { textAlign: "center", color: "#707579", fontWeight: "600", fontSize: 15 },
});