import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type {
  Ingredient,
  IngredientGroup,
  Unit,
  UnitConversion,
  Supplier,
} from "@/types";

export const catalogApi = {
  // Ingredients
  getIngredients: async (groupId?: string): Promise<Ingredient[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<Ingredient[]>("/ingredients", {
          params: groupId ? { groupId } : undefined,
        }),
      () => {
        const items = useDataStore.getState().ingredients;
        return groupId ? items.filter((i) => i.group_id === groupId) : items;
      }
    );
  },

  createIngredient: async (payload: Omit<Ingredient, "id">): Promise<Ingredient> => {
    return executeApiRequest(
      () => apiClient.post<Ingredient>("/ingredients", payload),
      () => useDataStore.getState().addIngredient(payload)
    );
  },

  updateIngredient: async (
    id: string,
    payload: Partial<Ingredient>
  ): Promise<Ingredient> => {
    return executeApiRequest(
      () => apiClient.patch<Ingredient>(`/ingredients/${id}`, payload),
      () => {
        useDataStore.getState().updateIngredient(id, payload);
        return useDataStore.getState().ingredients.find((i) => i.id === id)!;
      }
    );
  },

  // Units
  getUnits: async (): Promise<Unit[]> => {
    return executeApiRequest(
      () => apiClient.get<Unit[]>("/units"),
      () => useDataStore.getState().units
    );
  },

  // Conversions
  getConversions: async (): Promise<UnitConversion[]> => {
    return executeApiRequest(
      () => apiClient.get<UnitConversion[]>("/units/conversions"),
      () => useDataStore.getState().conversions
    );
  },

  createConversion: async (
    payload: Omit<UnitConversion, "id">
  ): Promise<UnitConversion> => {
    return executeApiRequest(
      () => apiClient.post<UnitConversion>("/units/conversions", payload),
      () => useDataStore.getState().addConversion(payload)
    );
  },

  // Groups
  getGroups: async (): Promise<IngredientGroup[]> => {
    return executeApiRequest(
      () => apiClient.get<IngredientGroup[]>("/ingredient-groups"),
      () => useDataStore.getState().groups
    );
  },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    return executeApiRequest(
      () => apiClient.get<Supplier[]>("/suppliers"),
      () => useDataStore.getState().suppliers
    );
  },
};
