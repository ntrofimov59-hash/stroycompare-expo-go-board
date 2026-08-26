import axios from "axios";
import { API_URL } from "../constants/config";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
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
};