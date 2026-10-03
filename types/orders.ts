/**
 * Orders & PO Fulfillment Domain Types
 */

export type OrderStatus = "DRAFT" | "RELEASED" | "PARTIAL" | "COMPLETED" | "CLOSED" | "CANCELLED";

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
