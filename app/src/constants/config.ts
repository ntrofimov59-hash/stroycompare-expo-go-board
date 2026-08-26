import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8080/api/v1"
    : "http://192.168.0.100:8080/api/v1"; // ← свой IP