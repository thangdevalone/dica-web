/**
 * Operations, POS Menu Mappings, Recipes, BOM, Variances & Alert Rules Domain Types
 */

export type VarianceStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type AlertType = "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE";
export type NotificationChannel = "IN_APP" | "EMAIL" | "TELEGRAM";

export interface MenuItemMapping {
  id: string;
  pos_item_id: string;
  pos_item_name: string;
  category: string;
  selling_price: number;
  active: boolean;
  bom_count: number;
}

export interface RecipeBOMItem {
  ingredient_id: string;
  ingredient_name: string;
  standard_quantity: number;
  unit: string;
  cost_estimate: number;
}

export interface Recipe {
  id: string;
  menu_item_name: string;
  serving_size: string;
  ingredients: RecipeBOMItem[];
  total_standard_cost: number;
  cost_percentage: number;
}

export interface VarianceResult {
  id: string;
  branch_name: string;
  date_range: string;
  ingredient_name: string;
  theoretical_usage: number;
  actual_usage: number;
  variance_qty: number;
  variance_pct: number;
  financial_impact: number;
  status: VarianceStatus;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  threshold_value: number;
  unit: string;
  notification_channel: NotificationChannel;
  active: boolean;
}
