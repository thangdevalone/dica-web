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
  Sliders,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  countKey?: string;
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
      },
      {
        href: "/orders",
        label: "Đơn thực hiện (PO)",
        icon: ShoppingCart,
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
        countKey: "discrepancies",
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
      },
    ],
  },
  {
    title: "PHÂN QUYỀN & HỆ THỐNG",
    items: [
      {
        href: "/users",
        label: "Tài khoản & Phân quyền",
        icon: Users,
      },
      {
        href: "/system",
        label: "Nhật ký & Cấu hình API",
        icon: Sliders,
      },
    ],
  },
];
