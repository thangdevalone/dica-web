import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type { Dispatch, Receipt, Discrepancy } from "@/types";

export const deliveryApi = {
  getDispatches: async (): Promise<Dispatch[]> => {
    return executeApiRequest(
      () => apiClient.get<Dispatch[]>("/dispatches"),
      () => []
    );
  },

  getReceipts: async (): Promise<Receipt[]> => {
    return executeApiRequest(
      () => apiClient.get<Receipt[]>("/receipts"),
      () => []
    );
  },

  getDiscrepancies: async (): Promise<Discrepancy[]> => {
    return executeApiRequest(
      () => apiClient.get<Discrepancy[]>("/discrepancies"),
      () => useDataStore.getState().discrepancies
    );
  },

  resolveDiscrepancy: async (
    id: string,
    note: string
  ): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post(`/discrepancies/${id}/resolve`, { note }),
      () => {
        useDataStore.getState().resolveDiscrepancy(id, note);
        return { success: true, message: "Đã giải quyết sai lệch thành công" };
      }
    );
  },
};
