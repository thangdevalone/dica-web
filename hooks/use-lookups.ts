"use client";

import { useAllQuery } from "@/hooks/use-api";
import { useCan } from "@/stores/use-auth-store";
import type {
  Department,
  Facility,
  Ingredient,
  IngredientGroup,
  Permission,
  Role,
  StockLocation,
  Supplier,
  Unit,
  User,
} from "@/lib/api/types";

/** Danh mục tra cứu dùng chung cho selector/bộ lọc. Chỉ gọi khi có quyền đọc. */

export function useFacilities() {
  const can = useCan("facility.read");
  return useAllQuery<Facility>("/facilities", undefined, { enabled: can });
}

export function useStockLocations(facilityId?: string) {
  const can = useCan("stock_location.read");
  return useAllQuery<StockLocation>(
    "/stock-locations",
    facilityId ? { facility_id: facilityId } : undefined,
    { enabled: can }
  );
}

export function useDepartments(facilityId?: string) {
  const can = useCan("department.read");
  return useAllQuery<Department>(
    "/departments",
    facilityId ? { facility_id: facilityId } : undefined,
    { enabled: can }
  );
}

export function useUnits() {
  const can = useCan("unit.read");
  return useAllQuery<Unit>("/units", undefined, { enabled: can });
}

export function useIngredientGroups() {
  const can = useCan("ingredient.read");
  return useAllQuery<IngredientGroup>("/ingredient-groups", undefined, { enabled: can });
}

export function useIngredients() {
  const can = useCan("ingredient.read");
  return useAllQuery<Ingredient>("/ingredients", undefined, { enabled: can });
}

export function useSuppliers() {
  const can = useCan("supplier.read");
  return useAllQuery<Supplier>("/suppliers", undefined, { enabled: can });
}

export function useRoles() {
  const can = useCan("role.read");
  return useAllQuery<Role>("/roles", undefined, { enabled: can });
}

export function usePermissionCatalog() {
  const can = useCan("role.read");
  return useAllQuery<Permission>("/permissions", undefined, { enabled: can });
}

export function useUsersLookup() {
  const can = useCan("user.read");
  return useAllQuery<User>("/users", undefined, { enabled: can });
}
