import { apiClient, executeApiRequest } from "./api-client";
import type { MenuItemMapping, Recipe, VarianceResult } from "@/types";

export const operationsApi = {
  getMenuItems: async (): Promise<MenuItemMapping[]> => {
    return executeApiRequest(
      () => apiClient.get<MenuItemMapping[]>("/operations/menu-items"),
      () => []
    );
  },

  getRecipes: async (): Promise<Recipe[]> => {
    return executeApiRequest(
      () => apiClient.get<Recipe[]>("/operations/recipes"),
      () => []
    );
  },

  getVariances: async (branchName?: string): Promise<VarianceResult[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<VarianceResult[]>("/operations/variances", {
          params: branchName ? { branchName } : undefined,
        }),
      () => []
    );
  },
};
