/**
 * Inventory, Stock Balances, Ledger, Transfers, Stocktake & Adjustments Domain Types
 */

export type LedgerEntryType =
  | "DISPATCH_OUT"
  | "TRANSIT_IN"
  | "TRANSIT_OUT"
  | "RECEIPT_IN"
  | "SUPPLIER_RECEIPT_IN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "REVERSAL";

export type TransferStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
export type StocktakeStatus = "DRAFT" | "SUBMITTED" | "REOPENED";
export type AdjustmentStatus = "DRAFT" | "APPROVED" | "POSTED" | "REJECTED";
export type DamageReportStatus = "DRAFT" | "SUBMITTED" | "CONFIRMED" | "REJECTED";

export interface StockBalance {
  id: string;
  facility_id: string;
  facility_name: string;
  location_name: string;
  ingredient_id: string;
  ingredient_code: string;
  ingredient_name: string;
  unit: string;
  quantity_on_hand: number;
  allocated_quantity: number;
  available_quantity: number;
  unit_cost: number;
  total_value: number;
  min_stock: number;
  is_low_stock: boolean;
  batch_number: string;
  expiry_date: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  facility_name: string;
  location_name: string;
  ingredient_name: string;
  entry_type: LedgerEntryType;
  quantity_change: number;
  resulting_quantity: number;
  reference_doc: string;
  performed_by: string;
}

export interface Transfer {
  id: string;
  code: string;
  from_facility_name: string;
  to_facility_name: string;
  status: TransferStatus;
  created_at: string;
  creator: string;
  items_count: number;
  notes?: string;
}

export interface Stocktake {
  id: string;
  code: string;
  facility_name: string;
  status: StocktakeStatus;
  created_at: string;
  total_items: number;
  variance_count: number;
}

export interface Adjustment {
  id: string;
  code: string;
  facility_name: string;
  status: AdjustmentStatus;
  reason: string;
  total_adjustment_value: number;
  created_at: string;
}

export interface DamageReport {
  id: string;
  code: string;
  facility_name: string;
  status: DamageReportStatus;
  reason: string;
  total_loss_value: number;
  created_at: string;
}
