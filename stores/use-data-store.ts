import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Facility,
  StockLocation,
  Department,
  Unit,
  UnitConversion,
  IngredientGroup,
  Ingredient,
  Supplier,
  SupplierIngredient,
  SupplyRequest,
  SupplyRequestItem,
  FulfillmentOrder,
  Dispatch,
  Receipt,
  Discrepancy,
  StockBalance,
  StockLedgerEntry,
  Transfer,
  Stocktake,
  Adjustment,
  DamageReport,
  MenuItemMapping,
  Recipe,
  VarianceResult,
  AlertRule,
  User,
  Role,
  AuditEvent,
  Notification,
} from "@/types";

// Initial Datasets
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
        ingredient_id: "ing-4",
        ingredientName: "Cốt Lẩu Thái Tomyum Chua Cay DICA",
        ingredientCode: "SKU-SAUCE-001",
        unit: "gói",
        requested_quantity: 40,
        approved_quantity: 40,
        estimated_cost: 3400000,
      },
      {
        id: "ri-3",
        ingredient_id: "ing-6",
        ingredientName: "Nấm Kim Châm Tươi Đà Lạt (150g)",
        ingredientCode: "SKU-VEG-001",
        unit: "gói",
        requested_quantity: 150,
        approved_quantity: 150,
        estimated_cost: 1800000,
      },
      {
        id: "ri-4",
        ingredient_id: "ing-7",
        ingredientName: "Bia Heineken Sleek Lon 330ml",
        ingredientCode: "SKU-BEV-001",
        unit: "thùng",
        requested_quantity: 5,
        approved_quantity: 5,
        estimated_cost: 2150000,
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
    requested_by: "Trần Thị Lan (Bếp phó Q7)",
    created_at: "2026-10-03T09:15:00Z",
    expected_delivery: "2026-10-04T10:00:00Z",
    total_items: 2,
    total_value: 8700000,
    notes: "Xin hàng định kỳ tuần",
    items: [
      {
        id: "ri-5",
        ingredient_id: "ing-3",
        ingredientName: "Tôm Sú Cấp Đông IQF Size 25-30 Con/Kg",
        ingredientCode: "SKU-SEA-001",
        unit: "kg",
        requested_quantity: 20,
        approved_quantity: 20,
        estimated_cost: 5800000,
      },
      {
        id: "ri-6",
        ingredient_id: "ing-5",
        ingredientName: "Sốt Ướp Nướng Hàn Quốc Teriyaki",
        ingredientCode: "SKU-SAUCE-002",
        unit: "gói",
        requested_quantity: 40,
        approved_quantity: 40,
        estimated_cost: 2600000,
      },
    ],
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
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
    unit: "kg",
    quantity_on_hand: 280,
    allocated_quantity: 30,
    available_quantity: 250,
    unit_cost: 380000,
    total_value: 106400000,
    min_stock: 50,
    is_low_stock: false,
    batch_number: "BATCH-202609-08",
    expiry_date: "2026-12-10",
  },
  {
    id: "sb-2",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Trung Tâm Bình Tân",
    location_name: "Kho Lạnh Đông Sâu -18°C",
    ingredient_id: "ing-3",
    ingredient_code: "SKU-SEA-001",
    ingredient_name: "Tôm Sú Cấp Đông IQF Size 25-30 Con/Kg",
    unit: "kg",
    quantity_on_hand: 29,
    allocated_quantity: 20,
    available_quantity: 9,
    unit_cost: 290000,
    total_value: 8410000,
    min_stock: 40,
    is_low_stock: true,
    batch_number: "BATCH-202609-15",
    expiry_date: "2027-03-15",
  },
  {
    id: "sb-3",
    facility_id: "fac-3",
    facility_name: "DICA BBQ Premium — Nguyễn Huệ Q1",
    location_name: "Tủ Mát Bếp Chính Q1",
    ingredient_id: "ing-2",
    ingredient_code: "SKU-BEEF-002",
    ingredient_name: "Ba Chỉ Bò Mỹ Cuộn Nấm Kim Châm Sơ Chế",
    unit: "kg",
    quantity_on_hand: 12,
    allocated_quantity: 0,
    available_quantity: 12,
    unit_cost: 245000,
    total_value: 2940000,
    min_stock: 30,
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
    quantity_on_hand: 250,
    allocated_quantity: 40,
    available_quantity: 210,
    unit_cost: 85000,
    total_value: 21250000,
    min_stock: 60,
    is_low_stock: false,
    batch_number: "BATCH-202609-20",
    expiry_date: "2026-11-20",
  },
];

const INITIAL_DISCREPANCIES: Discrepancy[] = [
  {
    id: "disc-1",
    receipt_id: "rcp-101",
    receipt_code: "RCP-20261002-09",
    ingredient_name: "Dẻ Sườn Bò Mỹ Black Angus Cắt Lát 2mm",
    type: "SHORTAGE",
    expected_quantity: 30.0,
    actual_quantity: 28.5,
    difference: -1.5,
    unit: "kg",
    status: "OPEN",
    reported_at: "2026-10-02T17:35:00Z",
    resolution_note: "Đang chờ đối chiếu camera đóng gói tại Kho Tổng Bình Tân",
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
  },
];

interface DataState {
  facilities: Facility[];
  locations: StockLocation[];
  departments: Department[];
  units: Unit[];
  conversions: UnitConversion[];
  groups: IngredientGroup[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  supplyRequests: SupplyRequest[];
  stockBalances: StockBalance[];
  discrepancies: Discrepancy[];
  audits: AuditEvent[];

  // Facilities actions
  addFacility: (facility: Omit<Facility, "id" | "createdAt">) => Facility;
  updateFacility: (id: string, updates: Partial<Facility>) => void;
  deleteFacility: (id: string) => void;

  // Locations actions
  addLocation: (loc: Omit<StockLocation, "id" | "createdAt">) => StockLocation;

  // Catalog actions
  addIngredient: (item: Omit<Ingredient, "id">) => Ingredient;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  addConversion: (conv: Omit<UnitConversion, "id">) => UnitConversion;

  // Requests actions
  addSupplyRequest: (req: {
    destinationFacilityId: string;
    items: { ingredientId: string; quantity: number; note?: string }[];
    notes?: string;
  }) => SupplyRequest;
  approveSupplyRequest: (id: string) => void;
  rejectSupplyRequest: (id: string, reason?: string) => void;

  // Inventory actions
  adjustStock: (
    balanceId: string,
    newQuantity: number,
    reason: string
  ) => void;

  // Discrepancy actions
  resolveDiscrepancy: (id: string, note: string) => void;

  // Audit
  logAudit: (action: string, resource: string, summary: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      facilities: INITIAL_FACILITIES,
      locations: INITIAL_LOCATIONS,
      departments: INITIAL_DEPARTMENTS,
      units: INITIAL_UNITS,
      conversions: INITIAL_CONVERSIONS,
      groups: INITIAL_GROUPS,
      ingredients: INITIAL_INGREDIENTS,
      suppliers: INITIAL_SUPPLIERS,
      supplyRequests: INITIAL_SUPPLY_REQUESTS,
      stockBalances: INITIAL_STOCK_BALANCES,
      discrepancies: INITIAL_DISCREPANCIES,
      audits: INITIAL_AUDITS,

      addFacility: (facilityData) => {
        const newFacility: Facility = {
          ...facilityData,
          id: `fac-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ facilities: [newFacility, ...state.facilities] }));
        get().logAudit(
          "CREATE_FACILITY",
          "Facility",
          `Thêm mới cơ sở ${newFacility.name} (${newFacility.code})`
        );
        return newFacility;
      },

      updateFacility: (id, updates) => {
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
        get().logAudit(
          "UPDATE_FACILITY",
          "Facility",
          `Cập nhật cơ sở ID: ${id}`
        );
      },

      deleteFacility: (id) => {
        set((state) => ({
          facilities: state.facilities.filter((f) => f.id !== id),
        }));
        get().logAudit("DELETE_FACILITY", "Facility", `Xóa cơ sở ID: ${id}`);
      },

      addLocation: (locData) => {
        const fac = get().facilities.find((f) => f.id === locData.facility_id);
        const newLoc: StockLocation = {
          ...locData,
          id: `loc-${Date.now()}`,
          facilityName: fac?.name,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ locations: [newLoc, ...state.locations] }));
        return newLoc;
      },

      addIngredient: (itemData) => {
        const group = get().groups.find((g) => g.id === itemData.group_id);
        const unit = get().units.find((u) => u.id === itemData.base_unit_id);
        const newItem: Ingredient = {
          ...itemData,
          id: `ing-${Date.now()}`,
          groupName: group?.name,
          baseUnitSymbol: unit?.symbol,
        };
        set((state) => ({ ingredients: [newItem, ...state.ingredients] }));
        get().logAudit(
          "CREATE_INGREDIENT",
          "Ingredient",
          `Thêm mặt hàng mới: ${newItem.name} (${newItem.code})`
        );
        return newItem;
      },

      updateIngredient: (id, updates) => {
        set((state) => ({
          ingredients: state.ingredients.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        }));
      },

      addConversion: (convData) => {
        const fromUnit = get().units.find((u) => u.id === convData.from_unit_id);
        const toUnit = get().units.find((u) => u.id === convData.to_unit_id);
        const newConv: UnitConversion = {
          ...convData,
          id: `conv-${Date.now()}`,
          fromUnitName: fromUnit ? `${fromUnit.name} (${fromUnit.symbol})` : "",
          toUnitName: toUnit ? `${toUnit.name} (${toUnit.symbol})` : "",
        };
        set((state) => ({ conversions: [...state.conversions, newConv] }));
        return newConv;
      },

      addSupplyRequest: ({ destinationFacilityId, items, notes }) => {
        const destFac = get().facilities.find(
          (f) => f.id === destinationFacilityId
        );
        const sourceFac = get().facilities.find(
          (f) => f.type === "CENTRAL_WAREHOUSE"
        );

        let totalValue = 0;
        const requestItems: SupplyRequestItem[] = items.map((it, idx) => {
          const ing = get().ingredients.find((i) => i.id === it.ingredientId);
          const cost = (ing?.cost_price || 0) * it.quantity;
          totalValue += cost;
          return {
            id: `ri-${Date.now()}-${idx}`,
            ingredient_id: it.ingredientId,
            ingredientName: ing?.name || "Nguyên liệu",
            ingredientCode: ing?.code || "SKU-XXX",
            unit: ing?.baseUnitSymbol || "kg",
            requested_quantity: it.quantity,
            approved_quantity: it.quantity,
            estimated_cost: cost,
            note: it.note,
          };
        });

        const newReq: SupplyRequest = {
          id: `req-${Date.now()}`,
          code: `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
            100 + Math.random() * 900
          )}`,
          destination_facility_id: destinationFacilityId,
          destinationFacilityName: destFac?.name || "Chi nhánh",
          source_type: "STOCK",
          source_facility_id: sourceFac?.id,
          sourceFacilityName: sourceFac?.name || "Kho Tổng Bình Tân",
          status: "SUBMITTED",
          requested_by: "Quản trị viên (Admin)",
          created_at: new Date().toISOString(),
          expected_delivery: new Date(Date.now() + 86400000).toISOString(),
          total_items: requestItems.length,
          total_value: totalValue,
          notes,
          items: requestItems,
        };

        set((state) => ({ supplyRequests: [newReq, ...state.supplyRequests] }));
        get().logAudit(
          "CREATE_SUPPLY_REQUEST",
          "SupplyRequest",
          `Tạo phiếu cấp hàng ${newReq.code} tới ${newReq.destinationFacilityName}`
        );
        return newReq;
      },

      approveSupplyRequest: (id) => {
        set((state) => ({
          supplyRequests: state.supplyRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "APPROVED",
                  approver: "Tổng Quản Trị Hệ Thống",
                }
              : r
          ),
        }));
        get().logAudit(
          "APPROVE_SUPPLY_REQUEST",
          "SupplyRequest",
          `Phê duyệt thành công phiếu cấp hàng ${id}`
        );
      },

      rejectSupplyRequest: (id, reason) => {
        set((state) => ({
          supplyRequests: state.supplyRequests.map((r) =>
            r.id === id ? { ...r, status: "REJECTED", notes: reason } : r
          ),
        }));
        get().logAudit(
          "REJECT_SUPPLY_REQUEST",
          "SupplyRequest",
          `Từ chối phiếu cấp hàng ${id}: ${reason || "Không đạt điều kiện"}`
        );
      },

      adjustStock: (balanceId, newQuantity, reason) => {
        set((state) => ({
          stockBalances: state.stockBalances.map((sb) => {
            if (sb.id === balanceId) {
              const diff = newQuantity - sb.quantity_on_hand;
              return {
                ...sb,
                quantity_on_hand: newQuantity,
                available_quantity: newQuantity - sb.allocated_quantity,
                total_value: newQuantity * sb.unit_cost,
                is_low_stock: newQuantity <= sb.min_stock,
              };
            }
            return sb;
          }),
        }));
        get().logAudit(
          "ADJUST_STOCK",
          "StockBalance",
          `Điều chỉnh tồn kho mã ${balanceId} -> ${newQuantity} (${reason})`
        );
      },

      resolveDiscrepancy: (id, note) => {
        set((state) => ({
          discrepancies: state.discrepancies.map((d) =>
            d.id === id
              ? { ...d, status: "RESOLVED", resolution_note: note }
              : d
          ),
        }));
        get().logAudit(
          "RESOLVE_DISCREPANCY",
          "Discrepancy",
          `Giải quyết vụ việc sai lệch ${id}: ${note}`
        );
      },

      logAudit: (action, resource, summary) => {
        const newAudit: AuditEvent = {
          id: `aud-${Date.now()}`,
          action,
          resource,
          performed_by: "Nguyễn Thế Thắng",
          user_email: "thang.admin@dica.vn",
          ip_address: "127.0.0.1",
          timestamp: new Date().toLocaleString("vi-VN"),
          summary,
        };
        set((state) => ({ audits: [newAudit, ...state.audits].slice(0, 100) }));
      },
    }),
    {
      name: "dica_database_v2",
    }
  )
);
