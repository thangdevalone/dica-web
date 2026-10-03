import { apiClient } from "./api-client";

export const systemApi = {
  pingBackend: async (): Promise<{
    status: "online" | "offline";
    latencyMs: number;
    url: string;
    details?: unknown;
  }> => {
    const startTime = performance.now();
    const url =
      apiClient.defaults.baseURL || "http://localhost:3000/api/v1";

    try {
      // Try calling health check or base endpoint
      const res = await apiClient.get("/health", { timeout: 3000 });
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: "online",
        latencyMs,
        url,
        details: res.data,
      };
    } catch {
      // If /health doesn't respond, try root /
      try {
        const res = await apiClient.get("/", { timeout: 3000 });
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          status: "online",
          latencyMs,
          url,
          details: res.data,
        };
      } catch {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          status: "offline",
          latencyMs,
          url,
        };
      }
    }
  },
};
