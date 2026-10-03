/**
 * Supply Requests & Order Demands Domain Types
 */

export type DocumentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";

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
