import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type { AuditEvent } from "@/types";

export const auditApi = {
  getAuditEvents: async (): Promise<AuditEvent[]> => {
    return executeApiRequest(
      () => apiClient.get<AuditEvent[]>("/audits"),
      () => useDataStore.getState().audits
    );
  },
};
