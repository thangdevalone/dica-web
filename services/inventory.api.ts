import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type { StockBalance, StockLedgerEntry, Transfer } from "@/types";

export const inventoryApi = {
  getStockBalances: async (facilityId?: string): Promise<StockBalance[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<StockBalance[]>("/inventory/balances", {
          params: facilityId && facilityId !== "ALL" ? { facilityId } : undefined,
        }),
      () => {
        const balances = useDataStore.getState().stockBalances;
        return facilityId && facilityId !== "ALL"
          ? balances.filter((b) => b.facility_id === facilityId)
          : balances;
      }
    );
  },

  adjustStock: async (payload: {
    balanceId: string;
    newQuantity: number;
    reason: string;
  }): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post("/inventory/adjustments", payload),
      () => {
        useDataStore
          .getState()
          .adjustStock(payload.balanceId, payload.newQuantity, payload.reason);
        return { success: true, message: "Điều chỉnh tồn kho thành công" };
      }
    );
  },

  getStockLedger: async (facilityId?: string): Promise<StockLedgerEntry[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<StockLedgerEntry[]>("/inventory/ledger", {
          params: facilityId && facilityId !== "ALL" ? { facilityId } : undefined,
        }),
      () => []
    );
  },

  getTransfers: async (): Promise<Transfer[]> => {
    return executeApiRequest(
      () => apiClient.get<Transfer[]>("/inventory/transfers"),
      () => []
    );
  },
};
