import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useThemeStore } from "../store/theme";

export type Filters = {
  categoryId: string;
  type: string;
  unit: string;
};

type Cat = { id: string; name: string };

export function FilterSheet({
  visible,
  onClose,
  value,
  onChange,
  categories,
  units,
}: {
  visible: boolean;
  onClose: () => void;
  value: Filters;
  onChange: (f: Filters) => void;
  categories: any; // Временно ослабляем тип для безопасности
  units: string[];
}) {
  const c = useThemeStore((s) => s.colors);

  // Жестко гарантируем, что categories — это массив
  const safeCategories: Cat[] = Array.isArray(categories) 
    ? categories 
    : categories?.data && Array.isArray(categories.data) 
    ? categories.data 
    : [];

  const safeUnits = Array.isArray(units) ? units : [];

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? c.accent : c.border, backgroundColor: c.bgElevated },
      ]}
    >
      <Text style={{ color: active ? c.accent : c.text, fontWeight: "600", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={styles.bg} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.bgElevated }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        <Text style={[styles.title, { color: c.text }]}>Фильтры</Text>
        <ScrollView>
          <Text style={[styles.label, { color: c.muted }]}>Категория</Text>
          <View style={styles.wrap}>
            <Chip
              label="Все"
              active={!value.categoryId}
              onPress={() => onChange({ ...value, categoryId: "" })}
            />
            {safeCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                active={value.categoryId === cat.id}
                onPress={() => onChange({ ...value, categoryId: cat.id })}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: c.muted }]}>Тип</Text>
          <View style={styles.wrap}>
            <Chip label="Все" active={!value.type} onPress={() => onChange({ ...value, type: "" })} />
            <Chip label="Материал" active={value.type === "material"} onPress={() => onChange({ ...value, type: "material" })} />
            <Chip label="Услуга" active={value.type === "service"} onPress={() => onChange({ ...value, type: "service" })} />
          </View>

          {safeUnits.length > 0 && (
            <>
              <Text style={[styles.label, { color: c.muted }]}>Фасовка / единица</Text>
              <View style={styles.wrap}>
                <Chip label="Любая" active={!value.unit} onPress={() => onChange({ ...value, unit: "" })} />
                {safeUnits.map((u) => (
                  <Chip
                    key={u}
                    label={u}
                    active={value.unit === u}
                    onPress={() => onChange({ ...value, unit: u })}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.reset, { borderColor: c.border }]}
          onPress={() => onChange({ categoryId: "", type: "", unit: "" })}
        >
          <Text style={{ color: c.muted, fontWeight: "600" }}>Сбросить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.done, { backgroundColor: c.accent }]} onPress={onClose}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Показать</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 36,
    maxHeight: "75%",
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  reset: { marginTop: 16, padding: 12, alignItems: "center", borderRadius: 12, borderWidth: 1 },
  done: { marginTop: 8, padding: 14, alignItems: "center", borderRadius: 12 },
});