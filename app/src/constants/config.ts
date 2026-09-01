import { Platform } from "react-native";
import Constants from "expo-constants";

const DEV_API_HOST = Platform.select({
  android: "10.0.2.2",
  ios: "localhost",
  default: "localhost",
});

const DEV_API_PORT = "8090";

const PROD_API = "https://api.coucou-events.com/api/v1";

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (__DEV__
    ? `http://${DEV_API_HOST}:${DEV_API_PORT}/api/v1`
    : PROD_API);