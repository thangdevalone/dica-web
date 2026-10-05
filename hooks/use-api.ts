"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage, listAll, listPage } from "@/lib/api/client";
import type { ApiResult, Paged, QueryParams } from "@/lib/api/types";
import { useAuthStore } from "@/stores/use-auth-store";

interface QueryOpts {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  keepPreviousData?: boolean;
}

function useSessionReady() {
  return useAuthStore((state) => state.hasHydrated && Boolean(state.accessToken));
}

function useSessionEpoch() {
  return useAuthStore((state) => state.sessionEpoch);
}

/** GET một tài nguyên (không phân trang). */
export function useApiQuery<T>(path: string | null | undefined, params?: QueryParams, opts?: QueryOpts) {
  const ready = useSessionReady();
  const sessionEpoch = useSessionEpoch();
  return useQuery({
    queryKey: [path, "one", params ?? {}, sessionEpoch],
    queryFn: async ({ signal }) => (await api.get<T>(path as string, params, { signal })).data,
    enabled: ready && Boolean(path) && (opts?.enabled ?? true),
    ...(opts?.staleTime !== undefined ? { staleTime: opts.staleTime } : {}),
    ...(opts?.refetchInterval !== undefined ? { refetchInterval: opts.refetchInterval } : {}),
  });
}

/** Một trang danh sách có meta phân trang. */
export function usePagedQuery<T>(path: string | null | undefined, params?: QueryParams, opts?: QueryOpts) {
  const ready = useSessionReady();
  const sessionEpoch = useSessionEpoch();
  return useQuery<Paged<T>>({
    queryKey: [path, "page", params ?? {}, sessionEpoch],
    queryFn: () => listPage<T>(path as string, params),
    enabled: ready && Boolean(path) && (opts?.enabled ?? true),
    placeholderData: keepPreviousData,
    ...(opts?.staleTime !== undefined ? { staleTime: opts.staleTime } : {}),
    ...(opts?.refetchInterval !== undefined ? { refetchInterval: opts.refetchInterval } : {}),
  });
}

/** Toàn bộ bản ghi (dùng cho danh mục tra cứu). Cache 5 phút. */
export function useAllQuery<T>(path: string | null | undefined, params?: QueryParams, opts?: QueryOpts) {
  const ready = useSessionReady();
  const sessionEpoch = useSessionEpoch();
  return useQuery<T[]>({
    queryKey: [path, "all", params ?? {}, sessionEpoch],
    queryFn: () => listAll<T>(path as string, params),
    enabled: ready && Boolean(path) && (opts?.enabled ?? true),
    staleTime: opts?.staleTime ?? 5 * 60 * 1000,
  });
}

export function invalidatePaths(client: QueryClient, prefixes: string[]) {
  const all = [...prefixes, "/dashboard/summary", "/notifications"];
  return client.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === "string" && all.some((prefix) => key.startsWith(prefix));
    },
  });
}

interface MutationOpts<TVars, TData> {
  mutationFn: (vars: TVars) => Promise<ApiResult<TData>>;
  /** Tiền tố đường dẫn cần làm mới sau khi thành công (vd. ["/requests", "/orders"]). */
  invalidate?: string[];
  /** Ghi đè thông báo thành công (mặc định dùng `message` của backend). */
  successMessage?: string | ((data: TData) => string) | false;
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: unknown) => void;
}

/** Mutation chuẩn: toast thông điệp backend, làm mới cache liên quan. */
export function useApiMutation<TVars = void, TData = unknown>(opts: MutationOpts<TVars, TData>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: opts.mutationFn,
    onSuccess: async (res, vars) => {
      if (opts.successMessage !== false) {
        const message =
          typeof opts.successMessage === "function"
            ? opts.successMessage(res.data)
            : opts.successMessage || res.message || "Thao tác thành công.";
        toast.success(message);
      }
      await invalidatePaths(client, opts.invalidate ?? []);
      opts.onSuccess?.(res.data, vars);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      opts.onError?.(error);
    },
  });
}
