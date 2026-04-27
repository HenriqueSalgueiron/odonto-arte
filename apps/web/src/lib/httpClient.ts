import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getAuthTokens, useAuthStore } from "@/stores/authStore";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const REFRESH_PATH = "/auth/refresh";
const LOGIN_PATH = "/auth/login";
const PUBLIC_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, REFRESH_PATH]);

export const AUTH_LOGOUT_EVENT = "auth:logout";

type RetriableAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

export const axiosInstance: AxiosInstance = axios.create({ baseURL });

const refreshAxios: AxiosInstance = axios.create({ baseURL });

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;
export type ResponseConfig<TData = unknown> = AxiosResponse<TData>;
export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>;

export type Client = <TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>;

function isPublicPath(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.has(url);
}

axiosInstance.interceptors.request.use((config) => {
  if (isPublicPath(config.url)) return config;
  const { accessToken } = getAuthTokens();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const { accessToken, refreshToken } = getAuthTokens();
  if (!accessToken || !refreshToken) return null;
  try {
    const { data } = await refreshAxios.post<{
      accessToken: string;
      refreshToken: string;
    }>(REFRESH_PATH, { accessToken, refreshToken });
    useAuthStore.getState().setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return data.accessToken;
  } catch {
    return null;
  }
}

function refreshSingleFlight(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function dispatchLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (
      !original ||
      status !== 401 ||
      original._retried ||
      isPublicPath(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    const newAccessToken = await refreshSingleFlight();

    if (!newAccessToken) {
      useAuthStore.getState().clear();
      dispatchLogout();
      return Promise.reject(error);
    }

    original.headers.set("Authorization", `Bearer ${newAccessToken}`);
    return axiosInstance.request(original);
  },
);

const client: Client = async (config) => {
  return axiosInstance.request(config);
};

export default client;
