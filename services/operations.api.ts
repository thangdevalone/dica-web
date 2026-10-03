import { apiClient, executeApiRequest } from "./api-client";
import {
  dicaStore,
  type MenuItemMapping,
  type VarianceResult,
  type AlertRule,
} from "@/lib/dica-api";

export const operationsApi = {
  getMenuItems: async (): Promise<MenuItemMapping[]> => {
    return executeApiRequest(
      () => apiClient.get<MenuItemMapping[]>("/operations/menu-items"),
      () => dicaStore.getMenuMappings()
    );
  },

  createMenuItem: async (payload: {
    posItemName: string;
    category: string;
    sellingPrice: number;
  }): Promise<MenuItemMapping> => {
    return executeApiRequest(
      () => apiClient.post<MenuItemMapping>("/operations/menu-items", payload),
      () => {
        const current = dicaStore.getMenuMappings();
        const newMap: MenuItemMapping = {
          id: `map-${Date.now()}`,
          pos_item_id: `IPOS-PLU-${Math.floor(1000 + Math.random() * 9000)}`,
          pos_item_name: payload.posItemName,
          category: payload.category || "MÓN MỚI",
          selling_price: payload.sellingPrice,
          active: true,
          bom_count: 2,
        };
        const updated = [newMap, ...current];
        dicaStore.saveMenuMappings(updated);
        return newMap;
      }
    );
  },

  getVariances: async (branchName?: string): Promise<VarianceResult[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<VarianceResult[]>("/operations/variances", {
          params: branchName ? { branchName } : undefined,
        }),
      () => dicaStore.getVariances()
    );
  },

  getAlertRules: async (): Promise<AlertRule[]> => {
    return executeApiRequest(
      () => apiClient.get<AlertRule[]>("/operations/alert-rules"),
      () => dicaStore.getAlertRules()
    );
  },

  createAlertRule: async (payload: {
    name: string;
    type: "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE";
    threshold_percent: number;
    channel: "IN_APP" | "EMAIL" | "TELEGRAM";
  }): Promise<AlertRule> => {
    return executeApiRequest(
      () => apiClient.post<AlertRule>("/operations/alert-rules", payload),
      () => {
        const current = dicaStore.getAlertRules();
        const newRule: AlertRule = {
          id: `rule-${Date.now()}`,
          name: payload.name,
          type: payload.type,
          threshold_value: payload.threshold_percent,
          unit: "%",
          notification_channel: payload.channel,
          active: true,
        };
        const updated = [newRule, ...current];
        dicaStore.saveAlertRules(updated);
        return newRule;
      }
    );
  },

  syncIpos: async (): Promise<{ success: boolean; message: string }> => {
    return executeApiRequest(
      () => apiClient.post("/operations/ipos/sync"),
      () => ({
        success: true,
        message: "Đồng bộ hóa 148 hóa đơn bán lẻ từ iPOS thành công!",
      })
    );
  },
};
