import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/services/inventory.api";
import { toast } from "sonner";

export const INVENTORY_KEYS = {
  balances: (facilityId?: string) => ["stock-balances", { facilityId }] as const,
  ledger: (facilityId?: string) => ["stock-ledger", { facilityId }] as const,
  transfers: ["transfers"] as const,
};

export function useStockBalancesQuery(facilityId?: string) {
  return useQuery({
    queryKey: INVENTORY_KEYS.balances(facilityId),
    queryFn: () => inventoryApi.getStockBalances(facilityId),
  });
}

export function useStockLedgerQuery(facilityId?: string) {
  return useQuery({
    queryKey: INVENTORY_KEYS.ledger(facilityId),
    queryFn: () => inventoryApi.getStockLedger(facilityId),
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { balanceId: string; newQuantity: number; reason: string }) =>
      inventoryApi.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      toast.success("Đã cập nhật số lượng tồn kho");
    },
    onError: (err: Error) => {
      toast.error(`Cập nhật tồn kho thất bại: ${err.message}`);
    },
  });
}
