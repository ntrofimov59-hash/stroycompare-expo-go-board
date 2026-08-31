import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../api/client";
import { Region } from "../types";
import { useSettingsStore } from "../store/settings";
import { useThemeStore } from "../store/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  required?: boolean; // если true — нельзя закрыть без выбора
};

export function RegionPicker({ visible, onClose, required = false }: Props) {
  const { setRegion, regionId } = useSettingsStore();
  const colors = useThemeStore((s) => s.colors);

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api
      .get("/regions")
      .then(({ data }) => setRegions(data.regions || data || []))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, [visible]);

  const select = (r: Region) => {
    setRegion(r.id, r.name);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Выберите регион
            </Text>
            {!required && (
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 40 }} color={colors.accent} />
          ) : (
            <FlatList
              data={regions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.id === regionId && { backgroundColor: colors.accent + "15" },
                  ]}
                  onPress={() => select(item)}
                >
                  <Text style={[styles.itemText, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.id === regionId && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 18, fontWeight: "600" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemText: { fontSize: 16 },
});