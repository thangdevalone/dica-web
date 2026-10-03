import { apiClient, executeApiRequest } from "./api-client";
import { dicaStore, type Dispatch, type Receipt, type Discrepancy } from "@/lib/dica-api";

export const deliveryApi = {
  getDispatches: async (): Promise<Dispatch[]> => {
    return executeApiRequest(
      () => apiClient.get<Dispatch[]>("/dispatches"),
      () => dicaStore.getDispatches()
    );
  },

  createDispatch: async (payload: {
    toFacility: string;
    driverName: string;
    licensePlate: string;
    sealCode: string;
  }): Promise<Dispatch> => {
    return executeApiRequest(
      () => apiClient.post<Dispatch>("/dispatches", payload),
      () => {
        const current = dicaStore.getDispatches();
        const newDsp: Dispatch = {
          id: `dsp-${Date.now()}`,
          code: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
          order_id: `ord-${Math.floor(100 + Math.random() * 900)}`,
          orderCode: `FO-2026-${Math.floor(100 + Math.random() * 900)}`,
          from_facility: "Kho Tổng Bình Tân",
          to_facility: payload.toFacility,
          driver_name: payload.driverName,
          license_plate: payload.licensePlate,
          seal_code: payload.sealCode,
          status: "DRAFT",
          dispatched_at: new Date().toISOString(),
          total_items: 4,
        };
        const updated = [newDsp, ...current];
        dicaStore.saveDispatches(updated);
        return newDsp;
      }
    );
  },

  postDispatch: async (id: string): Promise<{ success: boolean }> => {
    return executeApiRequest(
      () => apiClient.post(`/dispatches/${id}/post`),
      () => {
        const current = dicaStore.getDispatches();
        const updated = current.map((d) =>
          d.id === id ? { ...d, status: "POSTED" as const } : d
        );
        dicaStore.saveDispatches(updated);
        return { success: true };
      }
    );
  },

  getReceipts: async (): Promise<Receipt[]> => {
    return executeApiRequest(
      () => apiClient.get<Receipt[]>("/receipts"),
      () => dicaStore.getReceipts()
    );
  },

  getDiscrepancies: async (): Promise<Discrepancy[]> => {
    return executeApiRequest(
      () => apiClient.get<Discrepancy[]>("/discrepancies"),
      () => dicaStore.getDiscrepancies()
    );
  },

  resolveDiscrepancy: async (
    id: string,
    note: string
  ): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post(`/discrepancies/${id}/resolve`, { note }),
      () => {
        const current = dicaStore.getDiscrepancies();
        const updated = current.map((d) =>
          d.id === id
            ? { ...d, status: "RESOLVED" as const, resolution_note: note }
            : d
        );
        dicaStore.saveDiscrepancies(updated);
        return { success: true, message: "Đã giải quyết sai lệch thành công" };
      }
    );
  },
};
