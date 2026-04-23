import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;
export type ResponseConfig<TData = unknown> = AxiosResponse<TData>;
export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>;

export type Client = <TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>;

const client: Client = async (config) => {
  return axiosInstance.request(config);
};

export default client;
