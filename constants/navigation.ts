import type * as React from "react";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ClipboardList,
  ShoppingCart,
  Truck,
  Warehouse,
  Utensils,
  Users,
  UserCircle,
  Sliders,
  GitBranch,
  ArrowLeftRight,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavCountKey = "pendingRequests" | "openDiscrepancies" | "lowStock" | "openOrders" | "pendingTransfers";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  countKey?: NavCountKey;
  /** Hiển thị khi người dùng có ít nhất một quyền trong danh sách. */
  permission?: string | string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "TỔNG QUAN",
    items: [
      {
        href: "/",
        label: "Bàn làm việc & KPI",
        icon: LayoutDashboard,
        badge: "Live",
        permission: "dashboard.read",
      },
      {
        href: "/reports",
        label: "Báo cáo",
        icon: BarChart3,
        permission: ["report.stock", "report.fulfillment", "report.damage", "report.variance", "report.payment"],
      },
    ],
  },
  {
    title: "CƠ CẤU & TỔ CHỨC",
    items: [
      {
        href: "/organization",
        label: "Cơ sở & Chi nhánh",
        icon: Building2,
        permission: ["facility.read", "stock_location.read", "department.read"],
      },
    ],
  },
  {
    title: "DANH MỤC & NHÀ CUNG CẤP",
    items: [
      {
        href: "/catalog",
        label: "Nguyên liệu & Đơn vị",
        icon: Boxes,
        permission: ["ingredient.read", "unit.read", "supplier.read", "conversion.read"],
      },
      {
        href: "/sourcing",
        label: "Định tuyến nguồn hàng",
        icon: GitBranch,
        permission: ["eligibility.read", "source_rule.read"],
      },
    ],
  },
  {
    title: "YÊU CẦU & ĐƠN HÀNG",
    items: [
      {
        href: "/requests",
        label: "Yêu cầu cấp hàng",
        icon: ClipboardList,
        countKey: "pendingRequests",
        permission: "request.read",
      },
      {
        href: "/orders",
        label: "Đơn thực hiện",
        icon: ShoppingCart,
        countKey: "openOrders",
        permission: "order.read",
      },
      {
        href: "/transfers",
        label: "Điều chuyển kho",
        icon: ArrowLeftRight,
        countKey: "pendingTransfers",
        permission: "transfer.read",
      },
    ],
  },
  {
    title: "GIAO NHẬN & VẬN CHUYỂN",
    items: [
      {
        href: "/delivery",
        label: "Xuất - Nhập & Sai lệch",
        icon: Truck,
        countKey: "openDiscrepancies",
        permission: ["dispatch.read", "receipt.read", "discrepancy.read"],
      },
    ],
  },
  {
    title: "KHO & VẬN HÀNH TỒN KHO",
    items: [
      {
        href: "/inventory",
        label: "Tồn kho & Sổ cái",
        icon: Warehouse,
        countKey: "lowStock",
        permission: ["stock.read", "stock_ledger.read", "adjustment.read", "stocktake.read", "damage.read"],
      },
    ],
  },
  {
    title: "iPOS & ĐỊNH LƯỢNG",
    items: [
      {
        href: "/operations",
        label: "Công thức & Hao hụt",
        icon: Utensils,
        permission: ["ipos_mapping.read", "recipe.read", "sales_import.read", "variance.read", "alert_rule.manage"],
      },
    ],
  },
  {
    title: "PHÂN QUYỀN & HỆ THỐNG",
    items: [
      {
        href: "/profile",
        label: "Hồ sơ của tôi",
        icon: UserCircle,
      },
      {
        href: "/users",
        label: "Tài khoản & Phân quyền",
        icon: Users,
        permission: ["user.read", "role.read", "grant.read"],
      },
      {
        href: "/system",
        label: "Nhật ký & Trạng thái API",
        icon: Sliders,
      },
    ],
  },
];
