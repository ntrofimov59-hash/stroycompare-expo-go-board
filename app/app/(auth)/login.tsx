import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { authApi } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  // Настройка Google Auth с вашим Client ID
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "337435307488-s83l9va1ksg8r3s1rfufdirt2ruvj3o2.apps.googleusercontent.com",
    iosClientId: "337435307488-s83l9va1ksg8r3s1rfufdirt2ruvj3o2.apps.googleusercontent.com",
    androidClientId: "337435307488-s83l9va1ksg8r3s1rfufdirt2ruvj3o2.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleOAuthLogin("google", authentication.accessToken);
      }
    }
  }, [response]);

  const handleOAuthLogin = async (provider: string, token: string) => {
    setLoading(true);
    try {
      const { data } = await authApi.oauth({ provider, token });
      await setAuth(data.access_token, data.user);
      router.replace("/(app)");
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || `Ошибка входа через ${provider}`;
      Alert.alert("Ошибка", msg);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Ошибка", "Введите email и пароль");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.login(email.trim(), password);
      await setAuth(data.access_token, data.user);
      router.replace("/(app)");
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || "Неверный логин или пароль";
      Alert.alert("Ошибка входа", msg);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик для Apple Sign In
  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        handleOAuthLogin("apple", credential.identityToken);
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Ошибка Apple", e.message);
      }
    }
  };

  // Обработчик для Telegram (открытие виджета или ссылки на бота авторизации)
  const handleTelegramLogin = () => {
    Alert.alert(
      "Telegram Login",
      "Здесь можно настроить редирект на Telegram бота аутентификации."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>StroyCompare</Text>
        <Text style={styles.subtitle}>Сравнение цен на стройматериалы</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={onLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Войти</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, !request && styles.btnDisabled]}
          disabled={!request || loading}
          onPress={() => promptAsync()}
        >
          <Text style={styles.socialText}>Войти через Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={handleAppleLogin}
        >
          <Text style={styles.socialText}>Войти через Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialBtn, styles.telegramBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={handleTelegramLogin}
        >
          <Text style={[styles.socialText, { color: "#fff" }]}>
            Войти через Telegram
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Нет аккаунта? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: { marginBottom: 32, alignItems: "center" },
  logo: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#64748b" },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  btn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { marginHorizontal: 10, color: "#94a3b8", fontSize: 13 },
  socialBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  telegramBtn: { backgroundColor: "#229ED9", borderColor: "#229ED9" },
  socialText: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { color: "#64748b" },
  link: { color: "#0f172a", fontWeight: "700" },
});