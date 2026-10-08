import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/use-auth-store";
import type { ApiResult, LoginResponse, OffsetMeta, Paged, QueryParams } from "./types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

export const DEFAULT_ORGANIZATION_CODE =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE || "";

/** Lỗi chuẩn hoá từ envelope `{ success:false, code, message, details }` của backend. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(opts: {
    message: string;
    code: string;
    status: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
    this.requestId = opts.requestId;
  }

  /** Danh sách chi tiết lỗi validate (nếu có) để hiển thị cho người dùng. */
  get detailMessages(): string[] {
    if (Array.isArray(this.details)) {
      return this.details.filter((item): item is string => typeof item === "string");
    }
    return [];
  }
}

interface ErrorBody {
  success?: false;
  code?: string;
  message?: string;
  details?: unknown;
  request_id?: string;
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<{ data: LoginResponse }>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15_000 }
    );
    const { access_token, refresh_token } = res.data.data;
    setTokens(access_token, refresh_token);
    return access_token;
  } catch {
    return null;
  }
}

function forceLogout() {
  useAuthStore.getState().clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?next=${next}`);
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorBody>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes("/auth/");
    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return http.request(original);
      }
      forceLogout();
    }
    return Promise.reject(toApiError(error));
  }
);

function toApiError(error: AxiosError<ErrorBody>): ApiError {
  if (error.response) {
    const body = error.response.data ?? {};
    return new ApiError({
      message:
        body.message ||
        (error.response.status === 429
          ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."
          : `Yêu cầu thất bại (HTTP ${error.response.status}).`),
      code: body.code || (error.response.status === 429 ? "RATE_LIMITED" : "HTTP_ERROR"),
      status: error.response.status,
      details: body.details,
      requestId: body.request_id,
    });
  }
  return new ApiError({
    message:
      error.code === "ECONNABORTED"
        ? "Máy chủ phản hồi quá lâu. Vui lòng thử lại."
        : `Không kết nối được tới máy chủ (${API_BASE_URL}).`,
    code: "NETWORK_ERROR",
    status: 0,
  });
}

function cleanParams(params?: QueryParams) {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "ALL") continue;
    out[key] = value;
  }
  return out;
}

interface Envelope<T> {
  success: true;
  message?: string;
  data: T;
  meta?: ApiResult<T>["meta"];
}

export interface RequestOptions {
  idempotencyKey?: string | boolean;
  signal?: AbortSignal;
}

function headersFor(opts?: RequestOptions) {
  if (!opts?.idempotencyKey) return undefined;
  const key = opts.idempotencyKey === true ? newIdempotencyKey() : opts.idempotencyKey;
  return { "Idempotency-Key": key };
}

async function request<T>(config: AxiosRequestConfig, opts?: RequestOptions): Promise<ApiResult<T>> {
  const res = await http.request<Envelope<T>>({
    ...config,
    headers: { ...(config.headers ?? {}), ...headersFor(opts) },
    signal: opts?.signal,
  });
  const body = res.data;
  return {
    data: body.data,
    ...(body.meta ? { meta: body.meta } : {}),
    ...(body.message ? { message: body.message } : {}),
  };
}

export const api = {
  get<T>(path: string, params?: QueryParams, opts?: RequestOptions) {
    return request<T>({ method: "GET", url: path, params: cleanParams(params) }, opts);
  },
  post<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>({ method: "POST", url: path, data: body ?? {} }, opts);
  },
  put<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>({ method: "PUT", url: path, data: body ?? {} }, opts);
  },
  patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>({ method: "PATCH", url: path, data: body ?? {} }, opts);
  },
  delete<T>(path: string, opts?: RequestOptions) {
    return request<T>({ method: "DELETE", url: path }, opts);
  },
};

/** Một trang danh sách (offset pagination). */
export async function listPage<T>(path: string, params?: QueryParams): Promise<Paged<T>> {
  const res = await api.get<T[]>(path, { page: 1, page_size: 20, ...params });
  const meta = res.meta && res.meta.mode === "offset" ? (res.meta as OffsetMeta) : null;
  return { items: res.data ?? [], meta };
}

/**
 * Lấy toàn bộ bản ghi (dùng cho danh mục tra cứu/selector). Giới hạn số trang để
 * không vượt rate-limit của backend.
 */
export async function listAll<T>(path: string, params?: QueryParams, maxPages = 10): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await listPage<T>(path, { ...params, page, page_size: 100 });
    items.push(...res.items);
    if (!res.meta?.has_next) break;
  }
  return items;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `web:${crypto.randomUUID()}`;
  }
  return `web:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.detailMessages;
    return details.length ? `${error.message} ${details.slice(0, 3).join("; ")}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "Đã xảy ra lỗi không xác định.";
}
