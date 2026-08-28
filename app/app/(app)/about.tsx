import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "../../src/store/theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Как это работает", headerShown: true }} />
      <ScrollView style={[styles.wrap, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.h, { color: colors.text }]}>StroyCompare</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Сравнение цен на стройматериалы и услуги в вашем регионе и доска разовых объявлений.
        </Text>
        
        <Text style={[styles.h2, { color: colors.text }]}>1. Цены</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Выберите товар — увидите предложения поставщиков: цена, срок, минимальный заказ.
        </Text>
        
        <Text style={[styles.h2, { color: colors.text }]}>2. Premium</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Скидка на предложения с пометкой «скидка». Поставщикам — доступ к кабинету цен.
        </Text>
        
        <Text style={[styles.h2, { color: colors.text }]}>3. Доска</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Частные лоты и разовые услуги. Это не прайс магазина.
        </Text>
        
        <Text style={[styles.h2, { color: colors.text }]}>4. Регион</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Задаётся в профиле. Сравнение и объявления подстраиваются под него.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  h: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 20, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22 },
});