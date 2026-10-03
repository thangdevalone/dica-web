import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "@/services/operations.api";
import { toast } from "sonner";

export const OPERATIONS_KEYS = {
  menuItems: ["menu-items"] as const,
  variances: (branchName?: string) => ["variances", { branchName }] as const,
  alertRules: ["alert-rules"] as const,
};

export function useMenuItemsQuery() {
  return useQuery({
    queryKey: OPERATIONS_KEYS.menuItems,
    queryFn: () => operationsApi.getMenuItems(),
  });
}

export function useCreateMenuItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      posItemName: string;
      category: string;
      sellingPrice: number;
    }) => operationsApi.createMenuItem(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: OPERATIONS_KEYS.menuItems });
      toast.success(`Đã liên kết món ăn iPOS: ${data.pos_item_name}`);
    },
    onError: (err: Error) => {
      toast.error(`Liên kết món thất bại: ${err.message}`);
    },
  });
}

export function useVariancesQuery(branchName?: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.variances(branchName),
    queryFn: () => operationsApi.getVariances(branchName),
  });
}

export function useAlertRulesQuery() {
  return useQuery({
    queryKey: OPERATIONS_KEYS.alertRules,
    queryFn: () => operationsApi.getAlertRules(),
  });
}

export function useCreateAlertRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      type: "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE";
      threshold_percent: number;
      channel: "IN_APP" | "EMAIL" | "TELEGRAM";
    }) => operationsApi.createAlertRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATIONS_KEYS.alertRules });
      toast.success("Đã thiết lập quy tắc cảnh báo tự động");
    },
  });
}

export function useSyncIposMutation() {
  return useMutation({
    mutationFn: () => operationsApi.syncIpos(),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (err: Error) => {
      toast.error(`Đồng bộ iPOS thất bại: ${err.message}`);
    },
  });
}
