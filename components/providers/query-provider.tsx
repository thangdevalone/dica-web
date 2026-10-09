"use client"

import * as React from "react"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { errorMessage } from "@/lib/api/client"
import { useAuthStore } from "@/stores/use-auth-store"

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            toast.error(errorMessage(error), {
              id: `query-error:${query.queryHash}`,
              description: "Không thể tải dữ liệu. Vui lòng thử lại.",
            })
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  React.useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.sessionEpoch !== previous.sessionEpoch) {
          void queryClient.cancelQueries()
          queryClient.clear()
        }
      }),
    [queryClient]
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
