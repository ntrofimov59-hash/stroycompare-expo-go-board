import { ScrollView, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function AboutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Как это работает", headerShown: true }} />
      <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.h}>StroyCompare</Text>
        <Text style={styles.p}>
          Сравнение цен на стройматериалы и услуги в вашем регионе и доска разовых объявлений.
        </Text>
        <Text style={styles.h2}>1. Цены</Text>
        <Text style={styles.p}>
          Выберите товар — увидите предложения поставщиков: цена, срок, минимальный заказ.
        </Text>
        <Text style={styles.h2}>2. Premium</Text>
        <Text style={styles.p}>
          Скидка на предложения с пометкой «скидка». Поставщикам — доступ к кабинету цен.
        </Text>
        <Text style={styles.h2}>3. Доска</Text>
        <Text style={styles.p}>
          Частные лоты и разовые услуги. Это не прайс магазина.
        </Text>
        <Text style={styles.h2}>4. Регион</Text>
        <Text style={styles.p}>
          Задаётся в профиле. Сравнение и объявления подстраиваются под него.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  h: { fontSize: 24, fontWeight: "700", marginBottom: 8, color: "#0F172A" },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 20, marginBottom: 6, color: "#0F172A" },
  p: { fontSize: 15, lineHeight: 22, color: "#3F3F46" },
});