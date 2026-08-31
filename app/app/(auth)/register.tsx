import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { authApi } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<"buyer" | "supplier">("buyer");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const onRegister = async () => {
    if (!agree) {
      Alert.alert("Согласие", "Нужно принять Политику ПДн и Пользовательское соглашение");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Пароль", "Минимум 8 символов");
      return;
    }
    if (!email || !password || !firstName) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        role,
      });
      await setAuth(data.access_token, data.user);
      router.replace("/(app)");
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || "Ошибка регистрации";
      Alert.alert("Ошибка", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль (мин. 8 символов)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "buyer" && styles.roleActive]}
          onPress={() => setRole("buyer")}
        >
          <Text style={[styles.roleText, role === "buyer" && styles.roleTextActive]}>Покупатель</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "supplier" && styles.roleActive]}
          onPress={() => setRole("supplier")}
        >
          <Text style={[styles.roleText, role === "supplier" && styles.roleTextActive]}>Поставщик</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 12 }}
        onPress={() => setAgree((v) => !v)}
      >
        <View style={{
          width: 22, height: 22, borderRadius: 6, borderWidth: 2,
          borderColor: agree ? "#E8A017" : "#94a3b8",
          backgroundColor: agree ? "#E8A017" : "transparent",
          alignItems: "center", justifyContent: "center", marginTop: 1,
        }}>
          {agree ? <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text> : null}
        </View>
        <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: "#64748b" }}>
          Я согласен с{" "}
          <Text style={{ color: "#E8A017", fontWeight: "600" }} onPress={() => router.push("/(app)/legal/terms")}>
            Пользовательским соглашением
          </Text>
          {" "}и{" "}
          <Text style={{ color: "#E8A017", fontWeight: "600" }} onPress={() => router.push("/(app)/legal/privacy")}>
            Политикой персональных данных
          </Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btn, (!agree || loading) && styles.btnDisabled]} 
        onPress={onRegister} 
        disabled={!agree || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Создать аккаунт</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Уже есть аккаунт? Войти
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roleActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  roleText: { fontWeight: "600", color: "#0f172a" },
  roleTextActive: { color: "#fff" },
  btn: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#0f172a",
    fontWeight: "600",
  },
});