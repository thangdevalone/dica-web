/**
 * Role-Based Access Control (RBAC) Permission Definitions & Groups
 */

export interface PermissionDefinition {
  code: string;
  desc: string;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: "Cơ Cấu Tổ Chức",
    permissions: [
      { code: "facility.read", desc: "Xem danh sách chi nhánh & kho" },
      { code: "facility.manage", desc: "Tạo và cấu hình cơ sở" },
      { code: "stock_location.manage", desc: "Quản lý điểm lưu kho" },
    ],
  },
  {
    module: "Danh Mục & Nhà Cung CẤp",
    permissions: [
      { code: "ingredient.read", desc: "Xem danh mục nguyên vật liệu SKU" },
      { code: "ingredient.manage", desc: "Thêm sửa xóa nguyên vật liệu" },
      { code: "conversion.manage", desc: "Cấu hình tỷ lệ quy đổi đơn vị" },
      { code: "supplier.manage", desc: "Quản lý đối tác cung ứng" },
    ],
  },
  {
    module: "Yêu Cầu & Đơn Hàng",
    permissions: [
      { code: "request.create", desc: "Lập phiếu xin cấp hàng" },
      { code: "request.approve", desc: "Phê duyệt yêu cầu cấp hàng" },
      { code: "order.close_outstanding", desc: "Tất toán đơn đặt hàng thiếu" },
    ],
  },
  {
    module: "Giao Nhận & Kho Vận",
    permissions: [
      { code: "dispatch.post", desc: "Xuất kho và niêm phong xe tải" },
      { code: "receipt.post", desc: "Xác nhận nhận hàng tại chi nhánh" },
      { code: "discrepancy.resolve", desc: "Xử lý sai lệch thiếu / thừa" },
      { code: "stock.read", desc: "Xem số dư tồn kho tức thời" },
    ],
  },
  {
    module: "iPOS & Định Mức Món",
    permissions: [
      { code: "recipe.manage", desc: "Thiết lập định lượng món ăn (BOM)" },
      { code: "variance.recalculate", desc: "Tính toán hao hụt thực tế" },
      { code: "alert_rule.manage", desc: "Cấu hình quy tắc cảnh báo" },
    ],
  },
  {
    module: "Quản Trị Hệ Thống",
    permissions: [
      { code: "user.create", desc: "Tạo và phân quyền tài khoản" },
      { code: "user.deactivate", desc: "Đình chỉ tài khoản nhân viên" },
      { code: "audit.read", desc: "Tra cứu nhật ký thao tác hệ thống" },
    ],
  },
];
