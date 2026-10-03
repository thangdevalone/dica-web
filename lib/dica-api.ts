/**
 * DICA Supply Chain & Inventory Management Platform
 * API Client, Types, and Mock Data Provider
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

// -------------------------------------------------------------
// Realistic Seed / Mock Data for Standalone & Offline Mode
// -------------------------------------------------------------

const INITIAL_FACILITIES: Facility[] = [
  {
    id: "fac-1",
    code: "WH-BINTAN",
    name: "Kho Tổng Trung Tâm Bình Tân",
    type: "CENTRAL_WAREHOUSE",
    address: "KCN Tân Tạo, Bình Tân, TP.HCM",
    active: true,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "fac-2",
    code: "CK-TANBINH",
    name: "Bếp Trung Tâm Sơ Chế Tân Bình",
    type: "CENTRAL_KITCHEN",
    address: "Đường Cộng Hòa, P.13, Tân Bình, TP.HCM",
    active: true,
    createdAt: "2026-01-12T09:30:00Z",
  },
  {
    id: "fac-3",
    code: "BR-Q1-NGUYENHUE",
    name: "DICA BBQ Premium — Nguyễn Huệ Q1",
    type: "BRANCH",
    address: "68 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM",
    active: true,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "fac-4",
    code: "BR-Q7-CRESCENT",
    name: "DICA Hotpot World — Crescent Mall Q7",
    type: "BRANCH",
    address: "101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM",
    active: true,
    createdAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "fac-5",
    code: "BR-Q2-THAODIEN",
    name: "DICA Grill & Bistro — Thảo Điền TP.Thủ Đức",
    type: "BRANCH",
    address: "24 Xuân Thủy, Thảo Điền, TP. Thủ Đức, TP.HCM",
    active: true,
    createdAt: "2026-02-18T14:20:00Z",
  },
];

const INITIAL_LOCATIONS: StockLocation[] = [
  {
    id: "loc-1",
    facility_id: "fac-1",
    facilityName: "Kho Tổng Trung Tâm Bình Tân",
    code: "LOC-WH-COLD",
    name: "Kho Lạnh Đông Sâu -18°C",
    type: "PHYSICAL",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "loc-2",
    facility_id: "fac-1",
    facilityName: "Kho Tổng Trung Tâm Bình Tân",
    code: "LOC-WH-DRY",
    name: "Kho Khô & Gia Vị Tầng 1",
    type: "PHYSICAL",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "loc-3",
    facility_id: "fac-1",
    facilityName: "Kho Tổng Trung Tâm Bình Tân",
    code: "LOC-WH-TRANSIT",
    name: "Khu Vực Hàng Trung Chuyển Dispatch",
    type: "IN_TRANSIT",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "loc-4",
    facility_id: "fac-2",
    facilityName: "Bếp Trung Tâm Sơ Chế Tân Bình",
    code: "LOC-CK-PREP",
    name: "Khu Trữ Nguyên Liệu Chờ Chế Biến",
    type: "PHYSICAL",
    createdAt: "2026-01-12T09:30:00Z",
  },
  {
    id: "loc-5",
    facility_id: "fac-3",
    facilityName: "DICA BBQ Premium — Nguyễn Huệ Q1",
    code: "LOC-BR-Q1-COOL",
    name: "Tủ Mát Bếp Chính Q1",
    type: "PHYSICAL",
    createdAt: "2026-01-15T10:00:00Z",
  },
];

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "dep-1",
    facility_id: "fac-3",
    facilityName: "DICA BBQ Premium — Nguyễn Huệ Q1",
    stock_location_id: "loc-5",
    code: "DEP-KITCHEN-Q1",
    name: "Bếp Nóng & Nướng Than",
    type: "KITCHEN",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "dep-2",
    facility_id: "fac-3",
    facilityName: "DICA BBQ Premium — Nguyễn Huệ Q1",
    code: "DEP-BAR-Q1",
    name: "Quầy Bar & Pha Chế Đồ Uống",
    type: "OTHER",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "dep-3",
    facility_id: "fac-2",
    facilityName: "Bếp Trung Tâm Sơ Chế Tân Bình",
    code: "DEP-BUTCHER",
    name: "Phòng Cắt Thịt & Định Lượng Chân Không",
    type: "KITCHEN",
    createdAt: "2026-01-12T09:30:00Z",
  },
];

const INITIAL_UNITS: Unit[] = [
  { id: "u-1", code: "KG", name: "Kilogram", symbol: "kg", description: "Đơn vị khối lượng tiêu chuẩn" },
  { id: "u-2", code: "GRAM", name: "Gram", symbol: "g", description: "Đơn vị khối lượng nhỏ" },
  { id: "u-3", code: "BOX", name: "Thùng", symbol: "thùng", description: "Đóng gói vận chuyển" },
  { id: "u-4", code: "CAN", name: "Lon", symbol: "lon", description: "Đồ uống đóng lon 330ml" },
  { id: "u-5", code: "BOTTLE", name: "Chai", symbol: "chai", description: "Chai thủy tinh hoặc nhựa" },
  { id: "u-6", code: "PACK", name: "Gói", symbol: "gói", description: "Gói hút chân không / gia vị" },
  { id: "u-7", code: "TRAY", name: "Khay", symbol: "khay", description: "Khay thực phẩm sơ chế" },
];

const INITIAL_CONVERSIONS: UnitConversion[] = [
  {
    id: "conv-1",
    from_unit_id: "u-1",
    fromUnitName: "Kilogram (kg)",
    to_unit_id: "u-2",
    toUnitName: "Gram (g)",
    factor: 1000,
  },
  {
    id: "conv-2",
    from_unit_id: "u-3",
    fromUnitName: "Thùng (thùng)",
    to_unit_id: "u-4",
    toUnitName: "Lon (lon)",
    factor: 24,
  },
  {
    id: "conv-3",
    from_unit_id: "u-3",
    fromUnitName: "Thùng (thùng)",
    to_unit_id: "u-6",
    toUnitName: "Gói (gói)",
    factor: 12,
  },
  {
    id: "conv-4",
    from_unit_id: "u-7",
    fromUnitName: "Khay (khay)",
    to_unit_id: "u-2",
    toUnitName: "Gram (g)",
    factor: 500,
  },
];

const INITIAL_GROUPS: IngredientGroup[] = [
  { id: "grp-1", code: "GRP-BEEF", name: "Thịt Bò Tươi & Nhập Khẩu", description: "Bò Mỹ, Úc, Wagyu cắt lát & tảng" },
  { id: "grp-2", code: "GRP-SEAFOOD", name: "Hải Sản Đông Lạnh & Tươi", description: "Tôm sú, mực nang, bạch tuộc, cá hồi" },
  { id: "grp-3", code: "GRP-VEG", name: "Rau Củ Quả Đà Lạt", description: "Nấm, rau nhúng lẩu, salad tươi" },
  { id: "grp-4", code: "GRP-SAUCE", name: "Sốt Ướp & Cốt Lẩu Bí Truyền", description: "Nước cốt lẩu Tomyum, sốt BBQ Teriyaki" },
  { id: "grp-5", code: "GRP-BEV", name: "Đồ Uống & Nước Giải Khát", description: "Bia tươi, nước ngọt, trà hoa quả" },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: "ing-1",
    code: "SKU-BEEF-001",
    name: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
    group_id: "grp-1",
    groupName: "Thịt Bò Tươi & Nhập Khẩu",
    base_unit_id: "u-1",
    baseUnitSymbol: "kg",
    cost_price: 380000,
    min_stock: 50,
    max_stock: 400,
    shelf_life_days: 90,
    barcode: "8938001001",
    active: true,
  },
  {
    id: "ing-2",
    code: "SKU-BEEF-002",
    name: "Ba Chỉ Bò Mỹ Cuộn Nấm Kim Châm Sơ Chế",
    group_id: "grp-1",
    groupName: "Thịt Bò Tươi & Nhập Khẩu",
    base_unit_id: "u-1",
    baseUnitSymbol: "kg",
    cost_price: 245000,
    min_stock: 30,
    max_stock: 250,
    shelf_life_days: 30,
    barcode: "8938001002",
    active: true,
  },
  {
    id: "ing-3",
    code: "SKU-SEA-001",
    name: "Tôm Sú Cấp Đông IQF Size 25-30 Con/Kg",
    group_id: "grp-2",
    groupName: "Hải Sản Đông Lạnh & Tươi",
    base_unit_id: "u-1",
    baseUnitSymbol: "kg",
    cost_price: 290000,
    min_stock: 40,
    max_stock: 300,
    shelf_life_days: 180,
    barcode: "8938002001",
    active: true,
  },
  {
    id: "ing-4",
    code: "SKU-SAUCE-001",
    name: "Cốt Lẩu Thái Tomyum Chua Cay DICA (Đóng Túi 1kg)",
    group_id: "grp-4",
    groupName: "Sốt Ướp & Cốt Lẩu Bí Truyền",
    base_unit_id: "u-6",
    baseUnitSymbol: "gói",
    cost_price: 85000,
    min_stock: 60,
    max_stock: 500,
    shelf_life_days: 60,
    barcode: "8938004001",
    active: true,
  },
  {
    id: "ing-5",
    code: "SKU-SAUCE-002",
    name: "Sốt Ướp Nướng Hàn Quốc Teriyaki Thượng Hạng",
    group_id: "grp-4",
    groupName: "Sốt Ướp & Cốt Lẩu Bí Truyền",
    base_unit_id: "u-6",
    baseUnitSymbol: "gói",
    cost_price: 65000,
    min_stock: 50,
    max_stock: 400,
    shelf_life_days: 45,
    barcode: "8938004002",
    active: true,
  },
  {
    id: "ing-6",
    code: "SKU-VEG-001",
    name: "Nấm Kim Châm Tươi Đà Lạt (Gói 150g)",
    group_id: "grp-3",
    groupName: "Rau Củ Quả Đà Lạt",
    base_unit_id: "u-6",
    baseUnitSymbol: "gói",
    cost_price: 12000,
    min_stock: 100,
    max_stock: 600,
    shelf_life_days: 7,
    barcode: "8938003001",
    active: true,
  },
  {
    id: "ing-7",
    code: "SKU-BEV-001",
    name: "Bia Heineken Sleek Lon 330ml (Thùng 24 lon)",
    group_id: "grp-5",
    groupName: "Đồ Uống & Nước Giải Khát",
    base_unit_id: "u-3",
    baseUnitSymbol: "thùng",
    cost_price: 430000,
    min_stock: 20,
    max_stock: 150,
    shelf_life_days: 365,
    barcode: "8938005001",
    active: true,
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    code: "NCC-MEAT-WORLD",
    name: "Công ty Cổ phần Thực phẩm Meat World",
    contact_person: "Trần Tuấn Anh",
    phone: "0908 123 456",
    email: "sales@meatworld.vn",
    address: "KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM",
    lead_time_days: 2,
    tax_code: "0314987654",
    rating: 4.8,
    active: true,
  },
  {
    id: "sup-2",
    code: "NCC-DALAT-FRESH",
    name: "Hợp tác xã Nông Sản Sạch Đà Lạt Green",
    contact_person: "Nguyễn Thị Mai",
    phone: "0918 654 321",
    email: "order@dalatgreen.com",
    address: "12 Hồ Xuân Hương, Phường 9, TP. Đà Lạt",
    lead_time_days: 1,
    tax_code: "5801234567",
    rating: 4.9,
    active: true,
  },
  {
    id: "sup-3",
    code: "NCC-SEAFOOD-MIENTAY",
    name: "Công ty TNHH Hải Sản Biển Tây Cà Mau",
    contact_person: "Lê Hoàng Phúc",
    phone: "0932 777 888",
    email: "contact@seafoodbientay.vn",
    address: "Cảng Cá Sông Đốc, Trần Văn Thời, Cà Mau",
    lead_time_days: 3,
    tax_code: "2000876543",
    rating: 4.7,
    active: true,
  },
];

const INITIAL_SUPPLY_REQUESTS: SupplyRequest[] = [
  {
    id: "req-101",
    code: "REQ-20261003-001",
    destination_facility_id: "fac-3",
    destinationFacilityName: "DICA BBQ Premium — Nguyễn Huệ Q1",
    source_type: "STOCK",
    source_facility_id: "fac-1",
    sourceFacilityName: "Kho Tổng Trung Tâm Bình Tân",
    status: "APPROVED",
    requested_by: "Nguyễn Văn Hùng (Bếp trưởng Q1)",
    approver: "Lê Minh Trí (Giám đốc Chuỗi Cung Ứng)",
    created_at: "2026-10-02T14:30:00Z",
    expected_delivery: "2026-10-03T16:00:00Z",
    total_items: 4,
    total_value: 18450000,
    notes: "Cấp bổ sung phục vụ cao điểm buffet cuối tuần",
    items: [
      {
        id: "ri-1",
        ingredient_id: "ing-1",
        ingredientName: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
        ingredientCode: "SKU-BEEF-001",
        unit: "kg",
        requested_quantity: 30,
        approved_quantity: 30,
        estimated_cost: 11400000,
      },
      {
        id: "ri-2",
        ingredient_id: "ing-2",
        ingredientName: "Ba Chỉ Bò Mỹ Cuộn Nấm Kim Châm Sơ Chế",
        ingredientCode: "SKU-BEEF-002",
        unit: "kg",
        requested_quantity: 20,
        approved_quantity: 20,
        estimated_cost: 4900000,
      },
      {
        id: "ri-3",
        ingredient_id: "ing-4",
        ingredientName: "Cốt Lẩu Thái Tomyum Chua Cay DICA",
        ingredientCode: "SKU-SAUCE-001",
        unit: "gói",
        requested_quantity: 15,
        approved_quantity: 15,
        estimated_cost: 1275000,
      },
      {
        id: "ri-4",
        ingredient_id: "ing-7",
        ingredientName: "Bia Heineken Sleek Lon 330ml",
        ingredientCode: "SKU-BEV-001",
        unit: "thùng",
        requested_quantity: 2,
        approved_quantity: 2,
        estimated_cost: 875000,
      },
    ],
  },
  {
    id: "req-102",
    code: "REQ-20261003-002",
    destination_facility_id: "fac-4",
    destinationFacilityName: "DICA Hotpot World — Crescent Mall Q7",
    source_type: "STOCK",
    source_facility_id: "fac-1",
    sourceFacilityName: "Kho Tổng Trung Tâm Bình Tân",
    status: "SUBMITTED",
    requested_by: "Phạm Thúy Vi (Quản lý Chi Nhánh Q7)",
    created_at: "2026-10-03T08:15:00Z",
    expected_delivery: "2026-10-04T10:00:00Z",
    total_items: 3,
    total_value: 12200000,
    notes: "Đặt gấp hải sản và sốt cốt lẩu tươi",
    items: [
      {
        id: "ri-5",
        ingredient_id: "ing-3",
        ingredientName: "Tôm Sú Cấp Đông IQF Size 25-30 Con/Kg",
        ingredientCode: "SKU-SEA-001",
        unit: "kg",
        requested_quantity: 25,
        approved_quantity: 25,
        estimated_cost: 7250000,
      },
      {
        id: "ri-6",
        ingredient_id: "ing-4",
        ingredientName: "Cốt Lẩu Thái Tomyum Chua Cay DICA",
        ingredientCode: "SKU-SAUCE-001",
        unit: "gói",
        requested_quantity: 30,
        approved_quantity: 30,
        estimated_cost: 2550000,
      },
      {
        id: "ri-7",
        ingredient_id: "ing-6",
        ingredientName: "Nấm Kim Châm Tươi Đà Lạt (Gói 150g)",
        ingredientCode: "SKU-VEG-001",
        unit: "gói",
        requested_quantity: 200,
        approved_quantity: 200,
        estimated_cost: 2400000,
      },
    ],
  },
  {
    id: "req-103",
    code: "REQ-20261003-003",
    destination_facility_id: "fac-5",
    destinationFacilityName: "DICA Grill & Bistro — Thảo Điền TP.Thủ Đức",
    source_type: "SUPPLIER",
    status: "DRAFT",
    requested_by: "Đỗ Quốc Bảo (Trưởng ca)",
    created_at: "2026-10-03T11:00:00Z",
    expected_delivery: "2026-10-05T09:00:00Z",
    total_items: 2,
    total_value: 5800000,
    notes: "Dự trù nguyên liệu cho sự kiện private party",
    items: [
      {
        id: "ri-8",
        ingredient_id: "ing-1",
        ingredientName: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
        ingredientCode: "SKU-BEEF-001",
        unit: "kg",
        requested_quantity: 10,
        approved_quantity: 0,
        estimated_cost: 3800000,
      },
      {
        id: "ri-9",
        ingredient_id: "ing-3",
        ingredientName: "Tôm Sú Cấp Đông IQF Size 25-30 Con/Kg",
        ingredientCode: "SKU-SEA-001",
        unit: "kg",
        requested_quantity: 6,
        approved_quantity: 0,
        estimated_cost: 2000000,
      },
    ],
  },
];

const INITIAL_ORDERS: FulfillmentOrder[] = [
  {
    id: "ord-1",
    code: "FO-20261002-008",
    request_id: "req-101",
    source_type: "STOCK",
    source_name: "Kho Tổng Bình Tân",
    destination_name: "DICA BBQ Q1",
    status: "RELEASED",
    order_date: "2026-10-02T15:00:00Z",
    expected_date: "2026-10-03T16:00:00Z",
    total_amount: 18450000,
    items_count: 4,
  },
  {
    id: "ord-2",
    code: "PO-20261001-014",
    source_type: "SUPPLIER",
    source_name: "Meat World Corporation",
    destination_name: "Kho Tổng Bình Tân",
    status: "COMPLETED",
    order_date: "2026-10-01T09:00:00Z",
    expected_date: "2026-10-02T10:00:00Z",
    total_amount: 114000000,
    items_count: 3,
  },
];

const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: "dsp-1",
    code: "DSP-20261003-01",
    order_id: "ord-1",
    orderCode: "FO-20261002-008",
    from_facility: "Kho Tổng Bình Tân",
    to_facility: "DICA BBQ Q1",
    driver_name: "Võ Văn Tài",
    license_plate: "51D-894.22",
    seal_code: "SEAL-DICA-9941",
    status: "POSTED",
    dispatched_at: "2026-10-03T09:45:00Z",
    total_items: 4,
  },
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: "rcp-1",
    code: "RCP-20261002-09",
    dispatch_code: "DSP-20261002-05",
    received_facility: "DICA BBQ Q1",
    received_by: "Nguyễn Văn Hùng",
    status: "PENDING_EXCESS_REVIEW",
    received_at: "2026-10-02T16:30:00Z",
    discrepancy_count: 1,
  },
];

const INITIAL_DISCREPANCIES: Discrepancy[] = [
  {
    id: "disc-1",
    receipt_id: "rcp-1",
    receipt_code: "RCP-20261002-09",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
    type: "SHORTAGE",
    expected_quantity: 30,
    actual_quantity: 28.5,
    difference: -1.5,
    unit: "kg",
    status: "OPEN",
    reported_at: "2026-10-02T16:45:00Z",
    resolution_note: "Chờ nhà xe và thủ kho xuất đối chiếu biên bản hao hụt nhiệt",
  },
];

const INITIAL_STOCK_BALANCES: StockBalance[] = [
  {
    id: "sb-1",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Trung Tâm Bình Tân",
    location_name: "Kho Lạnh Đông Sâu -18°C",
    ingredient_id: "ing-1",
    ingredient_code: "SKU-BEEF-001",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus",
    unit: "kg",
    quantity_on_hand: 245.5,
    allocated_quantity: 30.0,
    available_quantity: 215.5,
    unit_cost: 380000,
    total_value: 93290000,
    min_stock: 50,
    is_low_stock: false,
    batch_number: "BATCH-202609-01",
    expiry_date: "2026-12-25",
  },
  {
    id: "sb-2",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Trung Tâm Bình Tân",
    location_name: "Kho Lạnh Đông Sâu -18°C",
    ingredient_id: "ing-3",
    ingredient_code: "SKU-SEA-001",
    ingredient_name: "Tôm Sú Cấp Đông IQF",
    unit: "kg",
    quantity_on_hand: 34.0,
    allocated_quantity: 25.0,
    available_quantity: 9.0,
    unit_cost: 290000,
    total_value: 9860000,
    min_stock: 40,
    is_low_stock: true,
    batch_number: "BATCH-202609-08",
    expiry_date: "2027-03-15",
  },
  {
    id: "sb-3",
    facility_id: "fac-3",
    facility_name: "DICA BBQ Premium — Nguyễn Huệ Q1",
    location_name: "Tủ Mát Bếp Chính Q1",
    ingredient_id: "ing-2",
    ingredient_code: "SKU-BEEF-002",
    ingredient_name: "Ba Chỉ Bò Mỹ Cuộn Nấm Kim Châm",
    unit: "kg",
    quantity_on_hand: 14.5,
    allocated_quantity: 0,
    available_quantity: 14.5,
    unit_cost: 245000,
    total_value: 3552500,
    min_stock: 20,
    is_low_stock: true,
    batch_number: "BATCH-202610-01",
    expiry_date: "2026-10-15",
  },
  {
    id: "sb-4",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Trung Tâm Bình Tân",
    location_name: "Kho Khô & Gia Vị Tầng 1",
    ingredient_id: "ing-4",
    ingredient_code: "SKU-SAUCE-001",
    ingredient_name: "Cốt Lẩu Thái Tomyum Chua Cay DICA",
    unit: "gói",
    quantity_on_hand: 380,
    allocated_quantity: 45,
    available_quantity: 335,
    unit_cost: 85000,
    total_value: 32300000,
    min_stock: 60,
    is_low_stock: false,
    batch_number: "BATCH-202610-02",
    expiry_date: "2026-12-02",
  },
];

const INITIAL_LEDGER: StockLedgerEntry[] = [
  {
    id: "led-1",
    timestamp: "2026-10-03 09:45:10",
    facility_name: "Kho Tổng Bình Tân",
    location_name: "Khu Vực Hàng Trung Chuyển",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus",
    entry_type: "DISPATCH_OUT",
    quantity_change: -30.0,
    resulting_quantity: 215.5,
    reference_doc: "DSP-20261003-01",
    performed_by: "Trần Minh Thắng (Thủ kho)",
  },
  {
    id: "led-2",
    timestamp: "2026-10-02 14:10:00",
    facility_name: "Kho Tổng Bình Tân",
    location_name: "Kho Lạnh Đông Sâu",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus",
    entry_type: "SUPPLIER_RECEIPT_IN",
    quantity_change: +100.0,
    resulting_quantity: 245.5,
    reference_doc: "PO-20261001-014",
    performed_by: "Trần Minh Thắng (Thủ kho)",
  },
];

const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: "trf-1",
    code: "TRF-20261002-003",
    from_facility_name: "Bếp Trung Tâm Tân Bình",
    to_facility_name: "DICA BBQ Q1",
    status: "APPROVED",
    created_at: "2026-10-02T13:20:00Z",
    creator: "Trần Quốc Toản (Bếp phó)",
    items_count: 3,
    notes: "Điều chuyển sốt ướp Teriyaki sơ chế nóng",
  },
];

const INITIAL_STOCKTAKES: Stocktake[] = [
  {
    id: "stk-1",
    code: "STK-20260930-M09",
    facility_name: "Kho Tổng Trung Tâm Bình Tân",
    status: "SUBMITTED",
    created_at: "2026-09-30T18:00:00Z",
    total_items: 124,
    variance_count: 2,
  },
];

const INITIAL_ADJUSTMENTS: Adjustment[] = [
  {
    id: "adj-1",
    code: "ADJ-20261001-01",
    facility_name: "Kho Tổng Bình Tân",
    status: "POSTED",
    reason: "Bù trừ hao hụt rã đông dẻ sườn tự nhiên 1.5%",
    total_adjustment_value: -1520000,
    created_at: "2026-10-01T17:15:00Z",
  },
];

const INITIAL_DAMAGES: DamageReport[] = [
  {
    id: "dmg-1",
    code: "DMG-20261002-02",
    facility_name: "DICA Hotpot Q7",
    status: "CONFIRMED",
    reason: "Hỏng tủ bảo quản làm dập úng 5kg nấm kim châm",
    total_loss_value: 400000,
    created_at: "2026-10-02T22:30:00Z",
  },
];

const INITIAL_MENU_MAPPINGS: MenuItemMapping[] = [
  {
    id: "map-1",
    pos_item_id: "IPOS-PLU-1001",
    pos_item_name: "Set Lẩu Thái Tomyum Bò Mỹ Hải Sản 4 Khách",
    category: "LẨU TƯƠI",
    selling_price: 599000,
    active: true,
    bom_count: 4,
  },
  {
    id: "map-2",
    pos_item_id: "IPOS-PLU-1002",
    pos_item_name: "Dẻ Sườn Bò Nướng Tảng Sốt Teriyaki 250g",
    category: "NƯỚNG THƯỢNG HẠNG",
    selling_price: 249000,
    active: true,
    bom_count: 2,
  },
  {
    id: "map-3",
    pos_item_id: "IPOS-PLU-1003",
    pos_item_name: "Ba Chỉ Bò Cuộn Nấm Nướng Giòn 8 Cuộn",
    category: "NƯỚNG THƯỢNG HẠNG",
    selling_price: 139000,
    active: true,
    bom_count: 2,
  },
];

const INITIAL_VARIANCES: VarianceResult[] = [
  {
    id: "var-1",
    branch_name: "DICA BBQ Q1",
    date_range: "25/09/2026 - 02/10/2026",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus",
    theoretical_usage: 120.0,
    actual_usage: 128.4,
    variance_qty: +8.4,
    variance_pct: 7.0,
    financial_impact: 3192000,
    status: "WARNING",
  },
  {
    id: "var-2",
    branch_name: "DICA BBQ Q1",
    date_range: "25/09/2026 - 02/10/2026",
    ingredient_name: "Sốt Nướng Teriyaki Thượng Hạng",
    theoretical_usage: 45.0,
    actual_usage: 46.2,
    variance_qty: +1.2,
    variance_pct: 2.6,
    financial_impact: 78000,
    status: "NORMAL",
  },
  {
    id: "var-3",
    branch_name: "DICA Hotpot Q7",
    date_range: "25/09/2026 - 02/10/2026",
    ingredient_name: "Tôm Sú Cấp Đông IQF",
    theoretical_usage: 80.0,
    actual_usage: 92.0,
    variance_qty: +12.0,
    variance_pct: 15.0,
    financial_impact: 3480000,
    status: "CRITICAL",
  },
];

const INITIAL_USERS: User[] = [
  {
    id: "usr-1",
    username: "admin.scm",
    full_name: "Nguyễn Thế Thắng",
    email: "thang.admin@dica.vn",
    kind: "INTERNAL",
    role_name: "Tổng Quản Trị Hệ Thống (Super Admin)",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "usr-2",
    username: "director.supply",
    full_name: "Lê Minh Trí",
    email: "tri.le@dica.vn",
    kind: "INTERNAL",
    role_name: "Giám Đốc Chuỗi Cung Ứng (SCM Director)",
    active: true,
    created_at: "2026-01-05T08:00:00Z",
  },
  {
    id: "usr-3",
    username: "chef.q1",
    full_name: "Nguyễn Văn Hùng",
    email: "hung.chef@dica.vn",
    kind: "INTERNAL",
    role_name: "Bếp Trưởng Chi Nhánh Q1",
    facility_assigned: "DICA BBQ Premium Q1",
    active: true,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "usr-4",
    username: "supplier.meatworld",
    full_name: "Trần Tuấn Anh (MeatWorld)",
    email: "tuannanh@meatworld.vn",
    kind: "SUPPLIER",
    role_name: "Cổng Nhà Cung Cấp Đối Tác",
    active: true,
    created_at: "2026-01-20T11:00:00Z",
  },
];

const INITIAL_ROLES: Role[] = [
  {
    id: "role-1",
    code: "SUPER_ADMIN",
    name: "Tổng Quản Trị Hệ Thống",
    description: "Toàn quyền quản trị cơ sở, danh mục, phân quyền và cấu hình hệ thống",
    permissions_count: 36,
  },
  {
    id: "role-2",
    code: "SCM_MANAGER",
    name: "Quản Lý Chuỗi Cung Ứng",
    description: "Phê duyệt yêu cầu hàng, điều phối xuất nhập kho và theo dõi sai lệch",
    permissions_count: 24,
  },
  {
    id: "role-3",
    code: "BRANCH_CHEF",
    name: "Bếp Trưởng / Quản Lý Chi Nhánh",
    description: "Tạo yêu cầu cấp hàng, nhận hàng và tạo biên bản hủy hàng tại chi nhánh",
    permissions_count: 14,
  },
  {
    id: "role-4",
    code: "WAREHOUSE_LEAD",
    name: "Thủ Kho Trung Tâm",
    description: "Xuất kho, nhập hàng NCC, kiểm kê định kỳ và quản lý sổ cái kho",
    permissions_count: 18,
  },
];

const INITIAL_AUDITS: AuditEvent[] = [
  {
    id: "aud-1",
    action: "ORGANIZATION_CONFIG_UPDATE",
    resource: "Facility",
    performed_by: "Nguyễn Thế Thắng",
    user_email: "thang.admin@dica.vn",
    ip_address: "14.241.12.89",
    timestamp: "2026-10-03 11:42:15",
    summary: "Kích hoạt định tuyến tự động cho Chi nhánh Q1",
    changes: { active_routing: true, max_order_limit: 50000000 },
  },
  {
    id: "aud-2",
    action: "REQUEST_APPROVAL",
    resource: "SupplyRequest",
    performed_by: "Lê Minh Trí",
    user_email: "tri.le@dica.vn",
    ip_address: "115.78.23.41",
    timestamp: "2026-10-03 09:12:00",
    summary: "Duyệt phiếu cấp hàng REQ-20261003-001 (18,450,000 VND)",
    changes: { status: "APPROVED", approved_by: "usr-2" },
  },
  {
    id: "aud-3",
    action: "CATALOG_PRICE_UPDATE",
    resource: "SupplierIngredient",
    performed_by: "Nguyễn Thế Thắng",
    user_email: "thang.admin@dica.vn",
    ip_address: "14.241.12.89",
    timestamp: "2026-10-02 16:20:00",
    summary: "Cập nhật bảng giá cung ứng dẻ sườn bò từ NCC MeatWorld",
    changes: { old_price: 365000, new_price: 380000 },
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Cảnh báo mức tồn an toàn",
    message: "Nguyên liệu Tôm Sú Cấp Đông IQF tại Kho Tổng chỉ còn 9kg khả dụng (Mức tối thiểu: 40kg).",
    type: "ALERT",
    is_read: false,
    created_at: "10 phút trước",
    link: "/inventory",
  },
  {
    id: "notif-2",
    title: "Yêu cầu cấp hàng mới",
    message: "Chi nhánh Crescent Mall Q7 vừa gửi yêu cầu cấp hàng REQ-20261003-002 chờ duyệt.",
    type: "INFO",
    is_read: false,
    created_at: "45 phút trước",
    link: "/requests",
  },
  {
    id: "notif-3",
    title: "Sai lệch giao nhận cần xử lý",
    message: "Phiếu nhập RCP-20261002-09 phát hiện thiếu 1.5kg dẻ sườn bò Mỹ.",
    type: "WARNING",
    is_read: true,
    created_at: "2 giờ trước",
    link: "/delivery",
  },
];

const INITIAL_ALERT_RULES: AlertRule[] = [
  {
    id: "alt-1",
    name: "Cảnh báo tồn kho dưới ngưỡng an toàn",
    type: "LOW_STOCK",
    threshold_value: 100,
    unit: "% Min Stock",
    notification_channel: "IN_APP",
    active: true,
  },
  {
    id: "alt-2",
    name: "Cảnh báo nguyên liệu cận hạn sử dụng (< 7 ngày)",
    type: "EXPIRATION",
    threshold_value: 7,
    unit: "Ngày",
    notification_channel: "EMAIL",
    active: true,
  },
  {
    id: "alt-3",
    name: "Cảnh báo hao hụt nguyên vật liệu vượt định mức",
    type: "HIGH_VARIANCE",
    threshold_value: 5,
    unit: "% Sai lệch",
    notification_channel: "TELEGRAM",
    active: true,
  },
];

// -------------------------------------------------------------
// Storage & API Management Service
// -------------------------------------------------------------

class DicaDataStore {
  private getStorageKey(key: string): string {
    return `dica_store_${key}`;
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
    } catch {
      // storage error
    }
  }

  // Configuration
  getApiBaseUrl(): string {
    return this.getItem(
      "api_base_url",
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
    );
  }

  setApiBaseUrl(url: string): void {
    this.setItem("api_base_url", url);
  }

  getAuthToken(): string {
    return this.getItem("auth_token", "");
  }

  setAuthToken(token: string): void {
    this.setItem("auth_token", token);
  }

  // Entity accessors
  getFacilities(): Facility[] {
    return this.getItem("facilities", INITIAL_FACILITIES);
  }
  saveFacilities(list: Facility[]): void {
    this.setItem("facilities", list);
  }

  getLocations(): StockLocation[] {
    return this.getItem("locations", INITIAL_LOCATIONS);
  }
  saveLocations(list: StockLocation[]): void {
    this.setItem("locations", list);
  }

  getDepartments(): Department[] {
    return this.getItem("departments", INITIAL_DEPARTMENTS);
  }
  saveDepartments(list: Department[]): void {
    this.setItem("departments", list);
  }

  getUnits(): Unit[] {
    return this.getItem("units", INITIAL_UNITS);
  }
  saveUnits(list: Unit[]): void {
    this.setItem("units", list);
  }

  getConversions(): UnitConversion[] {
    return this.getItem("conversions", INITIAL_CONVERSIONS);
  }
  saveConversions(list: UnitConversion[]): void {
    this.setItem("conversions", list);
  }

  getGroups(): IngredientGroup[] {
    return this.getItem("groups", INITIAL_GROUPS);
  }
  saveGroups(list: IngredientGroup[]): void {
    this.setItem("groups", list);
  }

  getIngredients(): Ingredient[] {
    return this.getItem("ingredients", INITIAL_INGREDIENTS);
  }
  saveIngredients(list: Ingredient[]): void {
    this.setItem("ingredients", list);
  }

  getSuppliers(): Supplier[] {
    return this.getItem("suppliers", INITIAL_SUPPLIERS);
  }
  saveSuppliers(list: Supplier[]): void {
    this.setItem("suppliers", list);
  }

  getSupplyRequests(): SupplyRequest[] {
    return this.getItem("requests", INITIAL_SUPPLY_REQUESTS);
  }
  saveSupplyRequests(list: SupplyRequest[]): void {
    this.setItem("requests", list);
  }

  getOrders(): FulfillmentOrder[] {
    return this.getItem("orders", INITIAL_ORDERS);
  }
  saveOrders(list: FulfillmentOrder[]): void {
    this.setItem("orders", list);
  }

  getDispatches(): Dispatch[] {
    return this.getItem("dispatches", INITIAL_DISPATCHES);
  }
  saveDispatches(list: Dispatch[]): void {
    this.setItem("dispatches", list);
  }

  getReceipts(): Receipt[] {
    return this.getItem("receipts", INITIAL_RECEIPTS);
  }
  saveReceipts(list: Receipt[]): void {
    this.setItem("receipts", list);
  }

  getDiscrepancies(): Discrepancy[] {
    return this.getItem("discrepancies", INITIAL_DISCREPANCIES);
  }
  saveDiscrepancies(list: Discrepancy[]): void {
    this.setItem("discrepancies", list);
  }

  getStockBalances(): StockBalance[] {
    return this.getItem("stock_balances", INITIAL_STOCK_BALANCES);
  }
  saveStockBalances(list: StockBalance[]): void {
    this.setItem("stock_balances", list);
  }

  getLedger(): StockLedgerEntry[] {
    return this.getItem("ledger", INITIAL_LEDGER);
  }
  saveLedger(list: StockLedgerEntry[]): void {
    this.setItem("ledger", list);
  }

  getTransfers(): Transfer[] {
    return this.getItem("transfers", INITIAL_TRANSFERS);
  }
  saveTransfers(list: Transfer[]): void {
    this.setItem("transfers", list);
  }

  getStocktakes(): Stocktake[] {
    return this.getItem("stocktakes", INITIAL_STOCKTAKES);
  }
  saveStocktakes(list: Stocktake[]): void {
    this.setItem("stocktakes", list);
  }

  getAdjustments(): Adjustment[] {
    return this.getItem("adjustments", INITIAL_ADJUSTMENTS);
  }
  saveAdjustments(list: Adjustment[]): void {
    this.setItem("adjustments", list);
  }

  getDamages(): DamageReport[] {
    return this.getItem("damages", INITIAL_DAMAGES);
  }
  saveDamages(list: DamageReport[]): void {
    this.setItem("damages", list);
  }

  getMenuMappings(): MenuItemMapping[] {
    return this.getItem("menu_mappings", INITIAL_MENU_MAPPINGS);
  }
  saveMenuMappings(list: MenuItemMapping[]): void {
    this.setItem("menu_mappings", list);
  }

  getVariances(): VarianceResult[] {
    return this.getItem("variances", INITIAL_VARIANCES);
  }
  saveVariances(list: VarianceResult[]): void {
    this.setItem("variances", list);
  }

  getAlertRules(): AlertRule[] {
    return this.getItem("alert_rules", INITIAL_ALERT_RULES);
  }
  saveAlertRules(list: AlertRule[]): void {
    this.setItem("alert_rules", list);
  }

  getUsers(): User[] {
    return this.getItem("users", INITIAL_USERS);
  }
  saveUsers(list: User[]): void {
    this.setItem("users", list);
  }

  getRoles(): Role[] {
    return this.getItem("roles", INITIAL_ROLES);
  }

  getAudits(): AuditEvent[] {
    return this.getItem("audits", INITIAL_AUDITS);
  }
  saveAudits(list: AuditEvent[]): void {
    this.setItem("audits", list);
  }

  getNotifications(): Notification[] {
    return this.getItem("notifications", INITIAL_NOTIFICATIONS);
  }
  saveNotifications(list: Notification[]): void {
    this.setItem("notifications", list);
  }

  // Reset to default sample data
  resetAll(): void {
    if (typeof window === "undefined") return;
    const keys = [
      "facilities",
      "locations",
      "departments",
      "units",
      "conversions",
      "groups",
      "ingredients",
      "suppliers",
      "requests",
      "orders",
      "dispatches",
      "receipts",
      "discrepancies",
      "stock_balances",
      "ledger",
      "transfers",
      "stocktakes",
      "adjustments",
      "damages",
      "menu_mappings",
      "variances",
      "alert_rules",
      "users",
      "roles",
      "audits",
      "notifications",
    ];
    for (const k of keys) {
      localStorage.removeItem(this.getStorageKey(k));
    }
  }
}

export const dicaStore = new DicaDataStore();
