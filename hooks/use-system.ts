"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useApiQuery } from "@/hooks/use-api"
import { api } from "@/lib/api/client"
import type { DashboardSummary } from "@/lib/api/types"
import { useFacilityFilter } from "@/stores/use-app-store"
import { useCan } from "@/stores/use-auth-store"

/** Tổng hợp dashboard từ `/dashboard/summary` theo bộ lọc cơ sở toàn cục. */
export function useDashboardSummary(days = 14) {
  const facilityId = useFacilityFilter()
  const can = useCan("dashboard.read")
  return useApiQuery<DashboardSummary>(
    "/dashboard/summary",
    { days, facility_id: facilityId },
    { enabled: can, staleTime: 60_000, refetchInterval: 120_000 }
  )
}

export interface HealthState {
  status: "ready" | "degraded" | "down"
  latencyMs: number | null
  message: string
  checkedAt: number
}

/** Kiểm tra `/health/ready` định kỳ (endpoint công khai). */
export function useHealth() {
  return useQuery<HealthState>({
    queryKey: ["health"],
    queryFn: async () => {
      const started = performance.now()
      try {
        const res = await api.get<{ status: string; database?: string }>(
          "/health/ready"
        )
        return {
          status: "ready",
          latencyMs: Math.round(performance.now() - started),
          message: res.message ?? "Dịch vụ sẵn sàng.",
          checkedAt: Date.now(),
        }
      } catch (error) {
        const status = (error as { status?: number }).status
        return {
          status: status && status >= 500 ? "degraded" : "down",
          latencyMs: null,
          message:
            error instanceof Error
              ? error.message
              : "Không kết nối được máy chủ.",
          checkedAt: Date.now(),
        }
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  })
}

/** Đọc một query param từ URL sau khi mount (tránh dùng useSearchParams ngoài Suspense). */
const URL_PARAM_CHANGE_EVENT = "dica:url-param-change"

function subscribeToUrl(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  window.addEventListener(URL_PARAM_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("popstate", onStoreChange)
    window.removeEventListener(URL_PARAM_CHANGE_EVENT, onStoreChange)
  }
}

export function useUrlParam(name: string): [string | null, () => void] {
  const value = React.useSyncExternalStore(
    subscribeToUrl,
    () => new URLSearchParams(window.location.search).get(name),
    () => null
  )
  const clear = React.useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete(name)
    window.history.replaceState(null, "", url.pathname + url.search)
    window.dispatchEvent(new Event(URL_PARAM_CHANGE_EVENT))
  }, [name])
  return [value, clear]
}
