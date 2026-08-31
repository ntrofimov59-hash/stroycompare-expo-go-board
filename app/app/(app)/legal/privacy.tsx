import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useThemeStore } from "../../../src/store/theme";

export default function PrivacyScreen() {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: "Политика ПДн", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.h, { color: colors.text }]}>Политика обработки персональных данных</Text>
        <Text style={[styles.p, { color: colors.muted }]}>
          Оператором персональных данных является владелец сервиса StroyCompare.
         {"\n\n"}
          1. Мы обрабатываем: email, имя, телефон (если указан), данные профиля поставщика, регион, сведения о подписке.
          {"\n\n"}
          2. Цели: регистрация и вход, сравнение цен, объявления, связь с поставщиками, поддержка, исполнение договора (оферты).
          {"\n\n"}
          3. Основания: согласие субъекта (ст. 6 152-ФЗ), исполнение договора.
          {"\n\n"}
          4. Хранение: на территории Российской Федерации. Срок — пока нужен для целей обработки или до отзыва согласия / удаления аккаунта.
          {"\n\n"}
          5. Вы вправе запросить доступ, уточнение, блокирование или удаление данных, отозвать согласие.
          {"\n\n"}
          6. Для удаления аккаунта используйте раздел «Профиль» → «Удалить аккаунт» или напишите на support@stroycompare.ru.
          {"\n\n"}
          Редакция: 01.09.2026. Текст-шаблон; перед публикацией в сторах проверьте юристом и подставьте реквизиты оператора.
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