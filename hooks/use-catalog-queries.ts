import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "@/services/catalog.api";
import type { Ingredient, UnitConversion } from "@/types";
import { toast } from "sonner";

export const CATALOG_KEYS = {
  ingredients: (groupId?: string) => ["ingredients", { groupId }] as const,
  units: ["units"] as const,
  conversions: ["conversions"] as const,
  groups: ["groups"] as const,
  suppliers: ["suppliers"] as const,
};

export function useIngredientsQuery(groupId?: string) {
  return useQuery({
    queryKey: CATALOG_KEYS.ingredients(groupId),
    queryFn: () => catalogApi.getIngredients(groupId),
  });
}

export function useUnitsQuery() {
  return useQuery({
    queryKey: CATALOG_KEYS.units,
    queryFn: () => catalogApi.getUnits(),
  });
}

export function useConversionsQuery() {
  return useQuery({
    queryKey: CATALOG_KEYS.conversions,
    queryFn: () => catalogApi.getConversions(),
  });
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: CATALOG_KEYS.groups,
    queryFn: () => catalogApi.getGroups(),
  });
}

export function useSuppliersQuery() {
  return useQuery({
    queryKey: CATALOG_KEYS.suppliers,
    queryFn: () => catalogApi.getSuppliers(),
  });
}

export function useCreateIngredientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<Ingredient, "id">) =>
      catalogApi.createIngredient(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast.success(`Đã thêm mới nguyên liệu "${data.name}"`);
    },
    onError: (err: Error) => {
      toast.error(`Thêm nguyên liệu thất bại: ${err.message}`);
    },
  });
}

export function useCreateConversionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<UnitConversion, "id">) =>
      catalogApi.createConversion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.conversions });
      toast.success("Đã thiết lập hệ số quy đổi đơn vị mới");
    },
    onError: (err: Error) => {
      toast.error(`Thiết lập quy đổi thất bại: ${err.message}`);
    },
  });
}
