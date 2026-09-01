import axios from "axios";
import { API_URL } from "../constants/config";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Добавляем Bearer токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Единый интерцептор ответа для обработки 401 ошибки и авто-обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка не 401 или запрос уже пытались повторить — пробрасываем ошибку дальше
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Запрос на обновление пары токенов (используем чистый axios, чтобы избежать циклических вызовов через api)
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      // Сохраняем новые токены и данные пользователя
      await useAuthStore.getState().setAuth(
        data.access_token, 
        data.user, 
        data.refresh_token || refreshToken
      );

      // Повторяем исходный запрос с новым токеном
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Если обновить токен не удалось (refresh истёк или невалиден) — разлогиниваем
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

export const authApi = {
  login: (login: string, password: string) =>
    api.post("/auth/login", { login, password }),

  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
    role?: string;
  }) => api.post("/auth/register", data),

  me: () => api.get("/users/me"),

  oauth: (data: { provider: string; token: string }) =>
    api.post("/auth/oauth", data),
};