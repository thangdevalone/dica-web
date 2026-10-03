import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryApi } from "@/services/delivery.api";
import { toast } from "sonner";

export const DELIVERY_KEYS = {
  dispatches: ["dispatches"] as const,
  receipts: ["receipts"] as const,
  discrepancies: ["discrepancies"] as const,
};

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
      toast.success("Đã ghi nhận giải quyết sai lệch thành công");
    },
    onError: (err: Error) => {
      toast.error(`Xử lý sai lệch thất bại: ${err.message}`);
    },
  });
}
