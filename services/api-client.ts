import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/use-auth-store";
import { useAppStore } from "@/stores/use-app-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach JWT Token & Active Facility Header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inject Auth Bearer token if present
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inject Active Facility Context header
    const facilityId = useAppStore.getState().selectedFacilityId;
    if (facilityId && facilityId !== "ALL" && config.headers) {
      config.headers["X-Facility-Id"] = facilityId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error and handle global 401/403
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Token expired or invalid
        console.warn("[API 401] Phiên đăng nhập hết hạn hoặc chưa xác thực.");
      } else if (status === 403) {
        console.warn("[API 403] Không có quyền thực hiện thao tác này.");
      } else if (status >= 500) {
        console.error(`[API ${status}] Lỗi máy chủ DICA Backend.`);
      }
    } else if (error.code === "ECONNABORTED") {
      console.warn("[API Timeout] Yêu cầu máy chủ quá thời gian chờ.");
    }
    return Promise.reject(error);
  }
);

/**
 * Universal wrapper for API calls with automatic fallback to mock store.
 * Ensures the admin panel stays fully interactive and responsive even if
 * backend service is offline, cold-starting, or under development.
 */
export async function executeApiRequest<T>(
  apiCall: () => Promise<{ data: T }>,
  mockFallback: () => T | Promise<T>
): Promise<T> {
  const isMockEnabled = useAppStore.getState().mockEngineEnabled;

  if (!isMockEnabled) {
    try {
      const res = await apiCall();
      return res.data;
    } catch (err) {
      console.warn("[API Call Failed, fallback is disabled]", err);
      throw err;
    }
  }

  try {
    const res = await apiCall();
    return res.data;
  } catch {
    // Fallback to local high-fidelity state store
    return await mockFallback();
  }
}
