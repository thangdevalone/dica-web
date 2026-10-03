/**
 * DICA Supply Chain & Inventory Management Platform
 * Domain Types, Enums & API Contract Interfaces
 */

export type FacilityType = "CENTRAL_WAREHOUSE" | "CENTRAL_KITCHEN" | "BRANCH";
export type StockLocationType = "PHYSICAL" | "IN_TRANSIT";
export type DepartmentType = "KITCHEN" | "TABLE" | "WAREHOUSE" | "INVENTORY" | "OTHER";
export type DocumentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
export type OrderStatus = "DRAFT" | "RELEASED" | "PARTIAL" | "COMPLETED" | "CLOSED" | "CANCELLED";
export type DispatchStatus = "DRAFT" | "POSTED" | "CANCELLED";
export type ReceiptStatus = "DRAFT" | "POSTED" | "PENDING_EXCESS_REVIEW" | "CANCELLED";
export type DiscrepancyType = "SHORTAGE" | "EXCESS" | "DAMAGED";
export type DiscrepancyStatus = "OPEN" | "RESOLVED";
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface StockLocation {
  id: string;
  facility_id: string;
  facilityName?: string;
  code: string;
  name: string;
  type: StockLocationType;
  createdAt: string;
}

export interface Department {
  id: string;
  facility_id: string;
  facilityName?: string;
  stock_location_id?: string;
  code: string;
  name: string;
  type: DepartmentType;
  createdAt: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  symbol: string;
  description?: string;
}

export interface UnitConversion {
  id: string;
  ingredient_id?: string;
  ingredientName?: string;
  from_unit_id: string;
  fromUnitName: string;
  to_unit_id: string;
  toUnitName: string;
  factor: number;
}

export interface IngredientGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Ingredient {
  id: string;
  code: string;
  name: string;
  group_id: string;
  groupName?: string;
  base_unit_id: string;
  baseUnitSymbol?: string;
  cost_price: number;
  min_stock: number;
  max_stock: number;
  shelf_life_days: number;
  barcode?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  lead_time_days: number;
  tax_code: string;
  rating: number;
  active: boolean;
}

export interface SupplierIngredient {
  id: string;
  supplier_id: string;
  supplierName?: string;
  ingredient_id: string;
  ingredientName?: string;
  purchasing_unit_id: string;
  purchasingUnitSymbol?: string;
  price: number;
  moq: number;
  is_preferred: boolean;
}

export interface SupplyRequestItem {
  id: string;
  ingredient_id: string;
  ingredientName: string;
  ingredientCode: string;
  unit: string;
  requested_quantity: number;
  approved_quantity: number;
  estimated_cost: number;
  note?: string;
}

export interface SupplyRequest {
  id: string;
  code: string;
  destination_facility_id: string;
  destinationFacilityName: string;
  source_type: "STOCK" | "SUPPLIER";
  source_facility_id?: string;
  sourceFacilityName?: string;
  status: DocumentStatus;
  requested_by: string;
  approver?: string;
  created_at: string;
  expected_delivery: string;
  total_items: number;
  total_value: number;
  notes?: string;
  items: SupplyRequestItem[];
}

export interface FulfillmentOrder {
  id: string;
  code: string;
  request_id?: string;
  source_type: "STOCK" | "SUPPLIER";
  source_name: string;
  destination_name: string;
  status: OrderStatus;
  order_date: string;
  expected_date: string;
  total_amount: number;
  items_count: number;
}

export interface Dispatch {
  id: string;
  code: string;
  order_id: string;
  orderCode: string;
  from_facility: string;
  to_facility: string;
  driver_name: string;
  license_plate: string;
  seal_code: string;
  status: DispatchStatus;
  dispatched_at: string;
  total_items: number;
}

export interface Receipt {
  id: string;
  code: string;
  dispatch_code?: string;
  received_facility: string;
  received_by: string;
  status: ReceiptStatus;
  received_at: string;
  discrepancy_count: number;
}

export interface Discrepancy {
  id: string;
  receipt_id: string;
  receipt_code: string;
  ingredient_name: string;
  type: DiscrepancyType;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  unit: string;
  status: DiscrepancyStatus;
  reported_at: string;
  resolution_note?: string;
}

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
  status: "DRAFT" | "SUBMITTED" | "REOPENED";
  created_at: string;
  total_items: number;
  variance_count: number;
}

export interface Adjustment {
  id: string;
  code: string;
  facility_name: string;
  status: "DRAFT" | "APPROVED" | "POSTED" | "REJECTED";
  reason: string;
  total_adjustment_value: number;
  created_at: string;
}

export interface DamageReport {
  id: string;
  code: string;
  facility_name: string;
  status: "DRAFT" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
  reason: string;
  total_loss_value: number;
  created_at: string;
}

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
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface AlertRule {
  id: string;
  name: string;
  type: "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE";
  threshold_value: number;
  unit: string;
  notification_channel: "IN_APP" | "EMAIL" | "TELEGRAM";
  active: boolean;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  kind: "INTERNAL" | "SUPPLIER";
  role_name: string;
  facility_assigned?: string;
  active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions_count: number;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  performed_by: string;
  user_email: string;
  ip_address: string;
  timestamp: string;
  summary: string;
  changes?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ALERT" | "SUCCESS";
  is_read: boolean;
  created_at: string;
  link?: string;
}
