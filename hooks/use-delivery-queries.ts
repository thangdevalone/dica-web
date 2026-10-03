import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryApi } from "@/services/delivery.api";
import { toast } from "sonner";

export const DELIVERY_KEYS = {
  dispatches: ["dispatches"] as const,
  receipts: ["receipts"] as const,
  discrepancies: ["discrepancies"] as const,
};

export function useDispatchesQuery() {
  return useQuery({
    queryKey: DELIVERY_KEYS.dispatches,
    queryFn: () => deliveryApi.getDispatches(),
  });
}

export function useCreateDispatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      toFacility: string;
      driverName: string;
      licensePlate: string;
      sealCode: string;
    }) => deliveryApi.createDispatch(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_KEYS.dispatches });
      toast.success(`Tạo lệnh xuất kho thành công: ${data.code}`);
    },
    onError: (err: Error) => {
      toast.error(`Tạo lệnh xuất kho thất bại: ${err.message}`);
    },
  });
}

export function usePostDispatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryApi.postDispatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_KEYS.dispatches });
      toast.success("Đã xác nhận xuất kho và niêm phong xe tải");
    },
  });
}

export function useReceiptsQuery() {
  return useQuery({
    queryKey: DELIVERY_KEYS.receipts,
    queryFn: () => deliveryApi.getReceipts(),
  });
}

export function useDiscrepanciesQuery() {
  return useQuery({
    queryKey: DELIVERY_KEYS.discrepancies,
    queryFn: () => deliveryApi.getDiscrepancies(),
  });
}

export function useResolveDiscrepancyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      deliveryApi.resolveDiscrepancy(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_KEYS.discrepancies });
      toast.success("Đã giải quyết sai lệch thành công");
    },
    onError: (err: Error) => {
      toast.error(`Xử lý sai lệch thất bại: ${err.message}`);
    },
  });
}
