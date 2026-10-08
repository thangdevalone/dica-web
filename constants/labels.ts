/**
 * Nhãn tiếng Việt cho các enum của backend.
 */

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  CENTRAL_WAREHOUSE: "Kho trung tâm",
  CENTRAL_KITCHEN: "Bếp trung tâm",
  BRANCH: "Chi nhánh",
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  PHYSICAL: "Kho vật lý",
  IN_TRANSIT: "Kho trung chuyển",
};

export const DEPARTMENT_TYPE_LABELS: Record<string, string> = {
  KITCHEN: "Bếp",
  TABLE: "Bàn / Phục vụ",
  WAREHOUSE: "Kho",
  INVENTORY: "Kiểm kê",
  OTHER: "Khác",
};

export const SCOPE_TYPE_LABELS: Record<string, string> = {
  ORGANIZATION: "Toàn tổ chức",
  FACILITY: "Cơ sở",
  STOCK_LOCATION: "Kho",
  DEPARTMENT: "Bộ phận",
  OWN: "Của chính mình",
  SUPPLIER: "Nhà cung cấp",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  STOCK: "Xuất từ kho",
  SUPPLIER: "Nhà cung cấp",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  RELEASED: "Đã phát hành",
  PARTIAL: "Đang thực hiện",
  COMPLETED: "Hoàn tất",
  CLOSED: "Đã đóng",
  POSTED: "Đã cập nhật tồn kho",
  PENDING_EXCESS_REVIEW: "Chờ duyệt thừa",
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  REOPENED: "Mở lại",
  CONFIRMED: "Đã xác nhận",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  UNREAD: "Chưa đọc",
  READ: "Đã đọc",
  VALIDATED: "Đã kiểm tra",
  DATA_INCOMPLETE: "Thiếu dữ liệu",
  COMMITTED: "Đã ghi nhận",
  FAILED: "Lỗi",
  COMPLETE: "Đủ dữ liệu",
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  RELEASED: "secondary",
  PARTIAL: "secondary",
  COMPLETED: "default",
  CLOSED: "outline",
  POSTED: "default",
  PENDING_EXCESS_REVIEW: "destructive",
  OPEN: "destructive",
  RESOLVED: "default",
  REOPENED: "secondary",
  CONFIRMED: "default",
  UNPAID: "outline",
  PAID: "default",
  VALIDATED: "secondary",
  DATA_INCOMPLETE: "destructive",
  COMMITTED: "default",
  FAILED: "destructive",
  COMPLETE: "default",
};

export const LEDGER_ENTRY_LABELS: Record<string, string> = {
  DISPATCH_OUT: "Xuất giao hàng",
  TRANSIT_IN: "Vào trung chuyển",
  TRANSIT_OUT: "Ra trung chuyển",
  RECEIPT_IN: "Nhập nhận hàng",
  SUPPLIER_RECEIPT_IN: "Nhập từ nhà cung cấp",
  ADJUSTMENT: "Điều chỉnh",
  DAMAGE: "Hư hỏng",
  REVERSAL: "Đảo bút toán",
};

export const DISCREPANCY_TYPE_LABELS: Record<string, string> = {
  SHORTAGE: "Thiếu hàng",
  EXCESS: "Thừa hàng",
  DAMAGED: "Hư hỏng",
};

export const APPROVAL_DECISION_LABELS: Record<string, string> = {
  APPROVED: "Duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Tự động duyệt",
};

export function labelOf(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}
