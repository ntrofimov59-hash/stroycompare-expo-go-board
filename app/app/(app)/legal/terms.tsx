import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useThemeStore } from "../../../src/store/theme";

export default function TermsScreen() {
  const colors = useThemeStore((s) => s.colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Соглашение", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.h, { color: colors.text }]}>Пользовательское соглашение</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          StroyCompare — информационный сервис сравнения цен и доска объявлений.
          {"\n\n"}
          1. Сервис не является продавцом товаров или услуг и не несет ответственности за заключенные сделки.
          {"\n\n"}
          2. Все сделки купли-продажи осуществляются напрямую между пользователем и поставщиком / автором объявления.
          {"\n\n"}
          3. Цены и характеристики товаров носят исключительно справочный характер и могут отличаться от актуальных предложений продавцов.
          {"\n\n"}
          4. Запрещено размещение недостоверных объявлений, спама, а также товаров, запрещенных к обороту законодательством РФ.
          {"\n\n"}
          5. Подписка Premium предоставляет расширенный доступ к функциям сервиса в соответствии с выбранным тарифом.
          {"\n\n"}
          Редакция от 01.09.2026. Использование сервиса означает полное принятие условий настоящего соглашения.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  h: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  p: { fontSize: 15, lineHeight: 22 },
});