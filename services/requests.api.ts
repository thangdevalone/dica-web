import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import { dicaStore, type FulfillmentOrder, type OrderStatus } from "@/lib/dica-api";
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

export const ordersApi = {
  getOrders: async (): Promise<FulfillmentOrder[]> => {
    return executeApiRequest(
      () => apiClient.get<FulfillmentOrder[]>("/orders"),
      () => dicaStore.getOrders()
    );
  },

  createPurchaseOrder: async (payload: {
    supplierId: string;
    supplierName: string;
    destinationName: string;
    totalAmount: number;
    expectedDate: string;
  }): Promise<FulfillmentOrder> => {
    return executeApiRequest(
      () => apiClient.post<FulfillmentOrder>("/orders/po", payload),
      () => {
        const current = dicaStore.getOrders();
        const newOrder: FulfillmentOrder = {
          id: `ord-${Date.now()}`,
          code: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          source_type: "SUPPLIER",
          source_name: payload.supplierName,
          destination_name: payload.destinationName || "Kho Tổng Bình Tân",
          status: "RELEASED",
          order_date: new Date().toISOString(),
          expected_date: payload.expectedDate,
          total_amount: payload.totalAmount,
          items_count: 5,
        };
        const updated = [newOrder, ...current];
        dicaStore.saveOrders(updated);
        return newOrder;
      }
    );
  },

  closeOrder: async (orderId: string): Promise<{ success: boolean }> => {
    return executeApiRequest(
      () => apiClient.post(`/orders/${orderId}/close`),
      () => {
        const current = dicaStore.getOrders();
        const updated = current.map((o) =>
          o.id === orderId ? { ...o, status: "CLOSED" as OrderStatus } : o
        );
        dicaStore.saveOrders(updated);
        return { success: true };
      }
    );
  },

  cancelOrder: async (orderId: string): Promise<{ success: boolean }> => {
    return executeApiRequest(
      () => apiClient.post(`/orders/${orderId}/cancel`),
      () => {
        const current = dicaStore.getOrders();
        const updated = current.map((o) =>
          o.id === orderId ? { ...o, status: "CANCELLED" as OrderStatus } : o
        );
        dicaStore.saveOrders(updated);
        return { success: true };
      }
    );
  },
};
