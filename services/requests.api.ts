import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type { SupplyRequest } from "@/types";

export const requestsApi = {
  getSupplyRequests: async (facilityId?: string): Promise<SupplyRequest[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<SupplyRequest[]>("/supply-requests", {
          params: facilityId && facilityId !== "ALL" ? { facilityId } : undefined,
        }),
      () => {
        const reqs = useDataStore.getState().supplyRequests;
        return facilityId && facilityId !== "ALL"
          ? reqs.filter(
              (r) =>
                r.destination_facility_id === facilityId ||
                r.source_facility_id === facilityId
            )
          : reqs;
      }
    );
  },

  getSupplyRequestById: async (
    id: string
  ): Promise<SupplyRequest | undefined> => {
    return executeApiRequest(
      () => apiClient.get<SupplyRequest>(`/supply-requests/${id}`),
      () => useDataStore.getState().supplyRequests.find((r) => r.id === id)
    );
  },

  createSupplyRequest: async (payload: {
    destinationFacilityId: string;
    items: { ingredientId: string; quantity: number; note?: string }[];
    notes?: string;
  }): Promise<SupplyRequest> => {
    return executeApiRequest(
      () => apiClient.post<SupplyRequest>("/supply-requests", payload),
      () => useDataStore.getState().addSupplyRequest(payload)
    );
  },

  approveSupplyRequest: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post(`/supply-requests/${id}/approve`),
      () => {
        useDataStore.getState().approveSupplyRequest(id);
        return { success: true, message: "Phê duyệt thành công" };
      }
    );
  },

  rejectSupplyRequest: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post(`/supply-requests/${id}/reject`, { reason }),
      () => {
        useDataStore.getState().rejectSupplyRequest(id, reason);
        return { success: true, message: "Từ chối thành công" };
      }
    );
  },
};
