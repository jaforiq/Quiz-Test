import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const tokenStorage = {
  get: () => localStorage.getItem("token"),
  set: (t: string) => localStorage.setItem("token", t),
  clear: () => localStorage.removeItem("token"),
};

const api = axios.create({
  baseURL: BASE_URL,
});

// attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// auto-refresh on 401 once
let refreshing = false;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });

    if (!original || original._retry || (original.url ?? "").includes("/auth/refresh")) {
      throw error;
    }
    if (error.response?.status === 401) {
      if (refreshing) throw error; 
      original._retry = true;
      try {
        refreshing = true;
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        tokenStorage.set(data.token);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original); // retry original request
      } catch (e) {
        tokenStorage.clear();
        throw e;
      } finally {
        refreshing = false;
      }
    }
    throw error;
  }
);

export default api;

