import { Platform } from "react-native";
import Constants from "expo-constants";

// Для локальной разработки:
// - Android эмулятор → 10.0.2.2
// - iOS симулятор → localhost
// - Реальное устройство → IP твоего компьютера в локальной сети
// - Production → твой домен / IP сервера

const DEV_API_HOST = Platform.select({
  android: "10.0.2.2",      // Android emulator
  ios: "localhost",         // iOS simulator
  default: "localhost",
});

const DEV_API_PORT = "8090";

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (__DEV__
    ? `http://${DEV_API_HOST}:${DEV_API_PORT}/api/v1`
    : "https://api.coucou-events.com");