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
} from "react-native";
import { useFocusEffect, Stack } from "expo-router";
import { api } from "../../src/api/client";

type Offer = {
  id: string;
  price: number;
  min_order_qty: number;
  is_active: boolean;
  product?: { name: string; unit: string };
  region?: { name: string };
};

export default function SupplierOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [price, setPrice] = useState("");
  const [productId, setProductId] = useState(
    "f0000001-0000-0000-0000-000000000001"
  );
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/offers/me");
      setOffers(data.offers || []);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || "Ошибка загрузки";
      Alert.alert("Кабинет", msg);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  const createOffer = async () => {
    const p = parseFloat(price.replace(",", "."));
    if (!p || p <= 0) {
      Alert.alert("Укажите цену");
      return;
    }
    setSaving(true);
    try {
      await api.post("/offers", {
        product_id: productId,
        region_id: "a0000001-0000-0000-0000-000000000001",
        price: p,
        min_order_qty: 1,
        delivery_days: 2,
      });
      setModal(false);
      setPrice("");
      await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = (id: string) => {
    Alert.alert("Снять с публикации?", undefined, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Снять",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/offers/${id}`);
            await load();
          } catch {
            Alert.alert("Ошибка");
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Мои предложения", headerShown: true }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2AABEE" />
        ) : (
          <FlatList
            data={offers}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={load} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                Нет предложений. Добавьте цену — она появится в сравнении.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.product?.name || "Товар"}</Text>
                <Text style={styles.meta}>
                  {item.region?.name} · {item.is_active ? "Активно" : "Скрыто"}
                </Text>
                <Text style={styles.price}>
                  {item.price.toLocaleString("ru-RU")} ₽
                  {item.product?.unit ? ` / ${item.product.unit}` : ""}
                </Text>
                {item.is_active && (
                  <TouchableOpacity onPress={() => deactivate(item.id)}>
                    <Text style={styles.hide}>Снять с публикации</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
          <Text style={styles.fabText}>+ Цена</Text>
        </TouchableOpacity>

        <Modal visible={modal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Новое предложение</Text>
              <Text style={styles.label}>ID товара (пока вручную)</Text>
              <TextInput
                style={styles.input}
                value={productId}
                onChangeText={setProductId}
                autoCapitalize="none"
              />
              <Text style={styles.label}>Цена, ₽</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="399"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={createOffer}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Опубликовать</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={styles.cancel}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F5" },
  empty: { textAlign: "center", color: "#8E8E93", marginTop: 40, paddingHorizontal: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  meta: { marginTop: 4, fontSize: 13, color: "#8E8E93" },
  price: { marginTop: 8, fontSize: 20, fontWeight: "700" },
  hide: { marginTop: 10, color: "#EF4444", fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: { color: "#fff", fontWeight: "700" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, color: "#707579", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#2AABEE",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  cancel: { textAlign: "center", marginTop: 16, color: "#707579", fontWeight: "600" },
});