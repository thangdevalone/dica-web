import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, ordersApi } from "@/services/requests.api";
import { toast } from "sonner";

export const REQUEST_KEYS = {
  all: (facilityId?: string) => ["supply-requests", { facilityId }] as const,
  detail: (id: string) => ["supply-requests", id] as const,
  orders: ["fulfillment-orders"] as const,
};

export function useSupplyRequestsQuery(facilityId?: string) {
  return useQuery({
    queryKey: REQUEST_KEYS.all(facilityId),
    queryFn: () => requestsApi.getSupplyRequests(facilityId),
  });
}

export function useSupplyRequestDetailQuery(id: string) {
  return useQuery({
    queryKey: REQUEST_KEYS.detail(id),
    queryFn: () => requestsApi.getSupplyRequestById(id),
    enabled: !!id,
  });
}

export function useCreateRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      destinationFacilityId: string;
      items: { ingredientId: string; quantity: number; note?: string }[];
      notes?: string;
    }) => requestsApi.createSupplyRequest(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["supply-requests"] });
      toast.success(`Đã gửi yêu cầu cấp hàng thành công: ${data.code}`);
    },
    onError: (err: Error) => {
      toast.error(`Gửi yêu cầu thất bại: ${err.message}`);
    },
  });
}

export function useApproveRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestsApi.approveSupplyRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-requests"] });
      toast.success("Đã phê duyệt yêu cầu cấp hàng");
    },
    onError: (err: Error) => {
      toast.error(`Duyệt yêu cầu thất bại: ${err.message}`);
    },
  });
}

export function useRejectRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      requestsApi.rejectSupplyRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-requests"] });
      toast.info("Đã từ chối yêu cầu cấp hàng");
    },
    onError: (err: Error) => {
      toast.error(`Từ chối yêu cầu thất bại: ${err.message}`);
    },
  });
}

// ==================== Fulfillment Orders & Purchase Orders ====================

export function useOrdersQuery() {
  return useQuery({
    queryKey: REQUEST_KEYS.orders,
    queryFn: () => ordersApi.getOrders(),
  });
}

export function useCreatePOMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      supplierId: string;
      supplierName: string;
      destinationName: string;
      totalAmount: number;
      expectedDate: string;
    }) => ordersApi.createPurchaseOrder(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.success(`Phát hành đơn đặt hàng PO thành công: ${data.code}`);
    },
    onError: (err: Error) => {
      toast.error(`Phát hành PO thất bại: ${err.message}`);
    },
  });
}

export function useCloseOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.closeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.success("Đã tất toán và đóng đơn hàng thành công");
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.info("Đã hủy đơn hàng");
    },
  });
}
