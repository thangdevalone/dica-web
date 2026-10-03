/**
 * Delivery, Dispatch, Receipts & Discrepancies Domain Types
 */

export type DispatchStatus = "DRAFT" | "POSTED" | "CANCELLED";
export type ReceiptStatus = "DRAFT" | "POSTED" | "PENDING_EXCESS_REVIEW" | "CANCELLED";
export type DiscrepancyType = "SHORTAGE" | "EXCESS" | "DAMAGED";
export type DiscrepancyStatus = "OPEN" | "RESOLVED";

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
