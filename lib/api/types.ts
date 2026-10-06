/**
 * Kiểu dữ liệu khớp với payload thực tế của DICA backend (`/api/v1`).
 * Bản ghi danh sách/chi tiết là model Prisma (camelCase), số thập phân trả về dạng chuỗi.
 */

export type Decimal = string;
export type ISODate = string;

// ---------------------------------------------------------------------------
// Envelope & pagination
// ---------------------------------------------------------------------------

export interface OffsetMeta {
  mode: "offset";
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CursorMeta {
  mode: "cursor";
  page_size: number;
  next_cursor: string | null;
  has_next: boolean;
}

export type PageMeta = OffsetMeta | CursorMeta;

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
  message?: string;
}

export interface Paged<T> {
  items: T[];
  meta: OffsetMeta | null;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserKind = "INTERNAL" | "SUPPLIER";
export type FacilityType = "CENTRAL_WAREHOUSE" | "CENTRAL_KITCHEN" | "BRANCH";
export type StockLocationType = "PHYSICAL" | "IN_TRANSIT";
export type DepartmentType = "KITCHEN" | "TABLE" | "WAREHOUSE" | "INVENTORY" | "OTHER";
export type ScopeType =
  | "ORGANIZATION"
  | "FACILITY"
  | "STOCK_LOCATION"
  | "DEPARTMENT"
  | "OWN"
  | "SUPPLIER";
export type SourceType = "STOCK" | "SUPPLIER";
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
export type AdjustmentStatus = "DRAFT" | "APPROVED" | "POSTED" | "REJECTED" | "CANCELLED";
export type StocktakeStatus = "DRAFT" | "SUBMITTED" | "REOPENED";
export type DamageStatus = "DRAFT" | "SUBMITTED" | "CONFIRMED" | "REJECTED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type NotificationStatus = "UNREAD" | "READ";
export type SalesImportStatus = "DRAFT" | "VALIDATED" | "DATA_INCOMPLETE" | "COMMITTED" | "FAILED";
export type VarianceDataStatus = "COMPLETE" | "DATA_INCOMPLETE";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; username: string; display_name: string; kind: UserKind };
}

export interface MeProfile {
  id: string;
  username: string;
  display_name: string;
  kind: UserKind;
  organization_id: string;
  supplier_id: string | null;
  identity_number: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PermissionGrant {
  id: string;
  roleCode: string;
  permissions: string[];
  scopeType: ScopeType;
  facilityId: string | null;
  stockLocationId: string | null;
  departmentId: string | null;
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export interface Facility {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: FacilityType;
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface StockLocation {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  type: StockLocationType;
  active: boolean;
  createdAt?: ISODate;
  facility?: Facility;
}

export interface Department {
  id: string;
  facilityId: string;
  stockLocationId: string | null;
  code: string;
  name: string;
  type: DepartmentType;
  active: boolean;
  facility?: Facility;
  stockLocation?: StockLocation | null;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface Unit {
  id: string;
  code: string;
  name: string;
  decimalScale: number;
  active: boolean;
}

export interface IngredientGroup {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Ingredient {
  id: string;
  groupId: string | null;
  baseUnitId: string;
  code: string;
  name: string;
  active: boolean;
  group?: IngredientGroup | null;
  baseUnit?: Unit;
}

export interface UnitConversion {
  id: string;
  ingredientId: string;
  unitId: string;
  factorToBase: Decimal;
  version: number;
  effectiveFrom: ISODate;
  effectiveTo: ISODate | null;
  ingredient?: Ingredient;
  unit?: Unit;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface SupplierIngredient {
  id: string;
  supplierId: string;
  ingredientId: string;
  supplierSku: string | null;
  referencePrice: Decimal | null;
  active: boolean;
  supplier?: Supplier;
  ingredient?: Ingredient;
}

// ---------------------------------------------------------------------------
// Sourcing
// ---------------------------------------------------------------------------

export interface ItemEligibility {
  id: string;
  facilityId: string;
  departmentId: string;
  ingredientId: string;
  maxQuantityPerRequest: Decimal | null;
  active: boolean;
  facility?: Facility;
  department?: Department;
  ingredient?: Ingredient;
}

export interface SourceRule {
  id: string;
  facilityId: string;
  ingredientId: string;
  sourceType: SourceType;
  sourceStockLocationId: string | null;
  supplierId: string | null;
  revision: number;
  active: boolean;
  effectiveFrom: ISODate;
  facility?: Facility;
  ingredient?: Ingredient;
  sourceStockLocation?: StockLocation | null;
  supplier?: Supplier | null;
}

export interface SourceRuleRevision {
  id: string;
  sourceRuleId: string;
  revision: number;
  beforeData: unknown;
  afterData: unknown;
  changedById: string;
  changedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Requests & transfers
// ---------------------------------------------------------------------------

export interface UserRef {
  id: string;
  displayName: string;
  username?: string;
}

export interface RequestLine {
  id: string;
  requestId: string;
  ingredientId: string;
  requestedUnitId: string;
  requestedQuantity: Decimal;
  baseQuantity: Decimal;
  ingredientNameSnapshot: string;
  unitCodeSnapshot: string;
  conversionFactorSnapshot: Decimal;
  sourceTypeSnapshot: SourceType | null;
  sourceRuleRevision: number | null;
  sourceStockLocationId: string | null;
  supplierId: string | null;
  ingredient?: Ingredient;
}

export interface ApprovalEvent {
  id: string;
  actorId: string;
  decision: "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  policy: string;
  note: string | null;
  createdAt: ISODate;
}

export interface SupplyRequest {
  id: string;
  facilityId: string;
  departmentId: string;
  createdById: string;
  code: string;
  status: DocumentStatus;
  requiredDate: ISODate;
  note: string | null;
  version: number;
  submittedAt: ISODate | null;
  decidedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  facility?: Facility;
  department?: Department;
  createdBy?: UserRef;
  lines?: RequestLine[];
  approvals?: ApprovalEvent[];
  orders?: FulfillmentOrder[];
  _count?: { lines?: number };
}

export interface TransferLine {
  id: string;
  ingredientId: string;
  quantity: Decimal;
  ingredientNameSnapshot: string;
  unitCodeSnapshot: string;
  ingredient?: Ingredient;
}

export interface Transfer {
  id: string;
  organizationId: string;
  code: string;
  fromStockLocationId: string;
  toStockLocationId: string;
  createdById: string;
  status: DocumentStatus;
  version: number;
  note: string | null;
  expectedArrivalAt: ISODate | null;
  submittedAt: ISODate | null;
  decidedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  fromStockLocation?: StockLocation;
  toStockLocation?: StockLocation;
  createdBy?: UserRef;
  lines?: TransferLine[];
  approvals?: ApprovalEvent[];
  orders?: FulfillmentOrder[];
  _count?: { lines?: number };
}

// ---------------------------------------------------------------------------
// Orders & delivery
// ---------------------------------------------------------------------------

export interface FulfillmentLine {
  id: string;
  orderId: string;
  requestLineId: string | null;
  transferLineId: string | null;
  ingredientId: string;
  approvedQuantity: Decimal;
  dispatchedQuantity: Decimal;
  receivedQuantity: Decimal;
  acceptedExcessQuantity: Decimal;
  closedRemainingQuantity: Decimal;
  unitCodeSnapshot: string;
  unitPriceSnapshot: Decimal | null;
  version: number;
  ingredient?: Ingredient;
}

export interface PaymentTracking {
  id: string;
  orderId: string;
  reconciledValue: Decimal;
  paidValue: Decimal;
  status: PaymentStatus;
  version: number;
  updatedAt: ISODate;
  order?: FulfillmentOrder;
}

export interface PaymentTrackingView {
  orderId: string;
  orderCode: string;
  reconciledValue: Decimal;
  paidValue: Decimal;
  status: PaymentStatus;
  version: number;
}

export interface FulfillmentOrder {
  id: string;
  requestId: string | null;
  transferId: string | null;
  code: string;
  sourceType: SourceType;
  sourceStockLocationId: string | null;
  supplierId: string | null;
  destinationStockLocationId: string;
  status: OrderStatus;
  version: number;
  releasedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  supplier?: Supplier | null;
  sourceStockLocation?: StockLocation | null;
  destinationStockLocation?: StockLocation;
  request?: SupplyRequest | null;
  transfer?: Transfer | null;
  lines?: FulfillmentLine[];
  dispatches?: Dispatch[];
  receipts?: Receipt[];
  paymentTracking?: PaymentTracking | null;
  _count?: { lines?: number; dispatches?: number; receipts?: number };
}

export interface DispatchLine {
  id: string;
  dispatchId: string;
  orderLineId: string;
  quantity: Decimal;
  orderLine?: FulfillmentLine;
}

export interface Dispatch {
  id: string;
  orderId: string;
  code: string;
  status: DispatchStatus;
  version: number;
  createdById: string;
  postedById: string | null;
  postedAt: ISODate | null;
  note: string | null;
  createdAt: ISODate;
  order?: FulfillmentOrder;
  lines?: DispatchLine[];
  _count?: { lines?: number; receipts?: number };
}

export interface ReceiptLine {
  id: string;
  receiptId: string;
  orderLineId: string;
  reportedQuantity: Decimal;
  acceptedQuantity: Decimal;
  excessQuantity: Decimal;
  note: string | null;
  orderLine?: FulfillmentLine;
}

export interface DiscrepancyCase {
  id: string;
  receiptId: string;
  receiptLineId: string;
  type: DiscrepancyType;
  status: DiscrepancyStatus;
  expectedQuantity: Decimal;
  actualQuantity: Decimal;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: ISODate | null;
  createdAt: ISODate;
  receipt?: Receipt;
  receiptLine?: ReceiptLine;
}

export interface Receipt {
  id: string;
  orderId: string;
  dispatchId: string | null;
  code: string;
  status: ReceiptStatus;
  version: number;
  createdById: string;
  postedById: string | null;
  postedAt: ISODate | null;
  note: string | null;
  createdAt: ISODate;
  order?: FulfillmentOrder;
  dispatch?: Dispatch | null;
  lines?: ReceiptLine[];
  discrepancies?: DiscrepancyCase[];
  _count?: { lines?: number; discrepancies?: number };
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface StockBalance {
  id: string;
  stockLocationId: string;
  ingredientId: string;
  quantity: Decimal;
  version: number;
  updatedAt: ISODate;
  stockLocation?: StockLocation;
  ingredient?: Ingredient;
}

export interface StockLedgerEntry {
  id: string;
  stockLocationId: string;
  ingredientId: string;
  entryType: LedgerEntryType;
  quantity: Decimal;
  sourceType: string;
  sourceId: string;
  sourceLineId: string;
  postingKey: string;
  reversalOfId: string | null;
  postedById: string;
  postedAt: ISODate;
  stockLocation?: StockLocation;
  ingredient?: Ingredient;
}

export interface InventoryAdjustment {
  id: string;
  stockLocationId: string;
  ingredientId: string;
  quantity: Decimal;
  reason: string;
  sourceType: string | null;
  sourceId: string | null;
  status: AdjustmentStatus;
  version: number;
  createdById: string;
  approvedAt: ISODate | null;
  postedAt: ISODate | null;
  createdAt: ISODate;
  stockLocation?: StockLocation;
  ingredient?: Ingredient;
}

export interface StocktakeLine {
  id: string;
  ingredientId: string;
  countedQuantity: Decimal;
  expectedQuantitySnapshot: Decimal | null;
  varianceQuantity: Decimal | null;
  countedAt: ISODate;
  ingredient?: Ingredient;
}

export interface Stocktake {
  id: string;
  stockLocationId: string;
  businessDate: ISODate;
  cutoffAt: ISODate;
  status: StocktakeStatus;
  version: number;
  createdById: string;
  createdAt: ISODate;
  submittedAt: ISODate | null;
  stockLocation?: StockLocation;
  lines?: StocktakeLine[];
  _count?: { lines?: number };
}

export interface DamageLine {
  id: string;
  ingredientId: string;
  quantity: Decimal;
  unitCode: string;
  reason: string | null;
  ingredient?: Ingredient;
}

export interface DamageReport {
  id: string;
  stockLocationId: string;
  code: string;
  status: DamageStatus;
  version: number;
  reason: string;
  createdById: string;
  createdAt: ISODate;
  submittedAt: ISODate | null;
  confirmedAt: ISODate | null;
  stockLocation?: StockLocation;
  lines?: DamageLine[];
  _count?: { lines?: number };
}

// ---------------------------------------------------------------------------
// iPOS & variance
// ---------------------------------------------------------------------------

export interface MenuItemMapping {
  id: string;
  facilityId: string;
  source: string;
  externalItemKey: string;
  menuItemName: string;
  active: boolean;
  facility?: Facility;
  recipeVersions?: RecipeVersion[];
  _count?: { recipeVersions?: number };
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  baseQuantity: Decimal;
  ingredient?: Ingredient;
}

export interface RecipeVersion {
  id: string;
  mappingId: string;
  stockLocationId: string;
  version: number;
  effectiveFrom: ISODate;
  effectiveTo: ISODate | null;
  createdAt: ISODate;
  mapping?: MenuItemMapping;
  stockLocation?: StockLocation;
  ingredients?: RecipeIngredient[];
}

export interface SalesRecord {
  id: string;
  externalKey: string;
  externalItemKey: string;
  soldAt: ISODate;
  quantity: Decimal;
  validationError: string | null;
  mappingId: string | null;
}

export interface SalesImportBatch {
  id: string;
  facilityId: string;
  source: string;
  externalKey: string;
  status: SalesImportStatus;
  errorSummary: unknown;
  createdAt: ISODate;
  committedAt: ISODate | null;
  facility?: Facility;
  records?: SalesRecord[];
  _count?: { records?: number };
}

export interface VarianceResult {
  id: string;
  stocktakeId: string;
  stockLocationId: string;
  ingredientId: string;
  version: number;
  dataStatus: VarianceDataStatus;
  openingStockSnapshot: Decimal | null;
  postedMovementSnapshot: Decimal | null;
  expectedUsageSnapshot: Decimal | null;
  expectedClosingSnapshot: Decimal | null;
  actualClosingSnapshot: Decimal;
  varianceQuantity: Decimal | null;
  varianceRate: Decimal | null;
  missingData: unknown;
  calculatedAt: ISODate;
  stockLocation?: StockLocation;
  ingredient?: Ingredient;
  stocktake?: Stocktake;
}

export interface AlertRule {
  id: string;
  facilityId: string | null;
  ingredientId: string | null;
  thresholdType: string;
  thresholdValue: Decimal;
  testOnly: boolean;
  active: boolean;
  facility?: Facility | null;
  ingredient?: Ingredient | null;
}

// ---------------------------------------------------------------------------
// Users & system
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  supplierId: string | null;
  kind: UserKind;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt: ISODate | null;
  createdAt: ISODate;
  supplier?: Supplier | null;
  grants?: RoleGrant[];
}

export interface Permission {
  code: string;
  description: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  system: boolean;
  active: boolean;
  permissions?: { permissionCode: string; permission?: Permission }[];
}

export interface RoleGrant {
  id: string;
  userId: string;
  roleId: string;
  scopeType: ScopeType;
  facilityId: string | null;
  stockLocationId: string | null;
  departmentId: string | null;
  createdAt: ISODate;
  revokedAt: ISODate | null;
  user?: UserRef & { username?: string };
  role?: Role;
  facility?: Facility | null;
  stockLocation?: StockLocation | null;
  department?: Department | null;
}

export interface AuditEvent {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeData: unknown;
  afterData: unknown;
  requestId: string;
  createdAt: ISODate;
  actor?: { id: string; username: string; displayName: string } | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
  status: NotificationStatus;
  readAt: ISODate | null;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Dashboard (/dashboard/summary)
// ---------------------------------------------------------------------------

export interface CodeNameRef {
  id: string;
  code: string;
  name: string;
}

export interface DashboardSummary {
  generated_at: ISODate;
  time_zone: string;
  period: { days: number; from: ISODate; to: ISODate; keys: string[] };
  facility_id: string | null;
  counts: {
    facilities: number | null;
    stock_locations: number | null;
    departments: number | null;
    ingredients: number | null;
    suppliers: number | null;
    active_users: number | null;
  };
  inventory: {
    balance_rows: number;
    total_quantity: Decimal;
    estimated_value: Decimal;
    in_transit_quantity: Decimal;
    in_transit_value: Decimal;
    zero_stock_rows: number;
    unpriced_rows: number;
    threshold_rules: number;
    low_stock_total: number;
    low_stock: {
      stock_location_id: string;
      stock_location_code: string;
      stock_location_name: string;
      facility_id: string;
      facility_name: string;
      ingredient_id: string;
      ingredient_code: string;
      ingredient_name: string;
      unit_code: string;
      quantity: Decimal;
      threshold: Decimal;
    }[];
    by_group: { group_id: string | null; name: string; rows: number; quantity: Decimal; value: Decimal }[];
    top_items: {
      ingredient_id: string;
      code: string;
      name: string;
      unit_code: string;
      quantity: Decimal;
      value: Decimal;
    }[];
  } | null;
  movements: {
    inbound_total: Decimal;
    outbound_total: Decimal;
    entries_total: number;
    series: { date: string; inbound: Decimal; outbound: Decimal; entries: number }[];
    by_type: { entry_type: LedgerEntryType; inbound: Decimal; outbound: Decimal; entries: number }[];
  } | null;
  requests: {
    total: number;
    by_status: Record<DocumentStatus, number>;
    overdue: number;
    created_in_period: number;
    pending: {
      id: string;
      code: string;
      status: DocumentStatus;
      required_date: ISODate;
      submitted_at: ISODate | null;
      facility: CodeNameRef;
      department: CodeNameRef;
      created_by: { id: string; displayName: string };
      line_count: number;
    }[];
    series: { date: string; created: number; approved: number; rejected: number }[];
  } | null;
  orders: {
    total: number;
    by_status: Record<OrderStatus, number>;
    by_source_type: Record<SourceType, number>;
    open: number;
    period: {
      lines: number;
      approved_quantity: Decimal;
      dispatched_quantity: Decimal;
      received_quantity: Decimal;
      closed_remaining_quantity: Decimal;
      fulfillment_rate: number | null;
    };
    recent: {
      id: string;
      code: string;
      status: OrderStatus;
      source_type: SourceType;
      supplier: CodeNameRef | null;
      source_stock_location: CodeNameRef | null;
      destination_stock_location: CodeNameRef;
      created_at: ISODate;
      progress: number;
    }[];
  } | null;
  delivery: {
    dispatches_draft: number;
    dispatches_posted_in_period: number;
    receipts_draft: number;
    receipts_posted_in_period: number;
    receipts_pending_review: number;
    open_discrepancies: number | null;
    open_discrepancies_by_type: Partial<Record<DiscrepancyType, number>>;
  } | null;
  transfers: { total: number; by_status: Record<DocumentStatus, number> } | null;
  operations: {
    adjustments_draft: number | null;
    adjustments_awaiting_post: number | null;
    stocktakes_open: number | null;
    damage_awaiting_confirm: number | null;
    damage_confirmed_in_period: number | null;
    variance_incomplete: number | null;
    top_variances:
      | {
          id: string;
          ingredient: { id: string; code: string; name: string; unit_code: string };
          stock_location: StockLocation;
          variance_quantity: Decimal | null;
          variance_rate: Decimal | null;
          data_status: VarianceDataStatus;
          calculated_at: ISODate;
        }[]
      | null;
  } | null;
  notifications: { unread: number; latest: Notification[] } | null;
  recent_activity:
    | {
        id: string;
        action: string;
        resource_type: string;
        resource_id: string;
        actor: { id: string; username: string; displayName: string } | null;
        created_at: ISODate;
      }[]
    | null;
  facilities: {
    id: string;
    code: string;
    name: string;
    type: FacilityType;
    active: boolean;
    stock_locations: number;
    stock_rows: number;
    stock_value: Decimal;
    low_stock: number;
    pending_requests: number;
    open_inbound_orders: number;
  }[];
}
