import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { requestErrorMessage } from "@/lib/request-error";

export class ApiClient {
  private static instance: ApiClient;
  private readonly http: AxiosInstance;
  private token: string | null = null;
  onUnauthorized?: () => void;

  private constructor() {
    this.http = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
      timeout: 30_000,
    });
    this.http.interceptors.request.use((config) => {
      if (this.token) config.headers.Authorization = "Bearer " + this.token;
      return config;
    });
    this.http.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          this.onUnauthorized?.();
        }
        if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
          return Promise.reject(new Error(requestErrorMessage(error, "تعذّر الاتصال بخادم المنصة.")));
        }
        return Promise.reject(error);
      },
    );
  }

  static getInstance(): ApiClient {
    return (ApiClient.instance ??= new ApiClient());
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.http.get<T>(url, config).then((response) => response.data);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.http.post<T>(url, data, config).then((response) => response.data);
  }

  patch<T>(url: string, data?: unknown): Promise<T> {
    return this.http.patch<T>(url, data).then((response) => response.data);
  }

  delete<T>(url: string): Promise<T> {
    return this.http.delete<T>(url).then((response) => response.data);
  }
}
