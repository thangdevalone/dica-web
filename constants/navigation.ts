import type * as React from "react"
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
  BookOpenCheck,
  Tags,
  Ruler,
  Repeat,
  Link2,
  ListChecks,
  PackageCheck,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ClipboardCheck,
  AlertOctagon,
  ChefHat,
  Receipt,
  Scale,
  BellRing,
  CheckCircle2,
  CreditCard,
  Shield,
  KeyRound,
  Flame,
  type LucideIcon,
} from "lucide-react"

export type NavCountKey =
  | "pendingRequests"
  | "openDiscrepancies"
  | "lowStock"
  | "openOrders"
  | "pendingTransfers"

export interface NavChildItem {
  href: string
  tabKey: string
  label: string
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  badge?: string
  countKey?: NavCountKey
  permission?: string | string[]
}

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  badge?: string
  countKey?: NavCountKey
  /** Hiển thị khi người dùng có ít nhất một quyền trong danh sách. */
  permission?: string | string[]
  children?: NavChildItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "TỔNG QUAN",
    items: [
      {
        href: "/",
        label: "Tổng quan vận hành",
        icon: LayoutDashboard,
        badge: "Trực tiếp",
        permission: "dashboard.read",
      },
      {
        href: "/reports",
        label: "Báo cáo",
        icon: BarChart3,
        permission: [
          "report.stock",
          "report.fulfillment",
          "report.damage",
          "report.variance",
          "report.payment",
        ],
        children: [
          {
            href: "/reports?tab=stock",
            tabKey: "stock",
            label: "Tồn kho",
            icon: BarChart3,
            permission: "report.stock",
          },
          {
            href: "/reports?tab=fulfillment",
            tabKey: "fulfillment",
            label: "Hoàn tất đơn",
            icon: CheckCircle2,
            permission: "report.fulfillment",
          },
          {
            href: "/reports?tab=damage",
            tabKey: "damage",
            label: "Hỏng & Hao hụt",
            icon: AlertOctagon,
            permission: "report.damage",
          },
          {
            href: "/reports?tab=variance",
            tabKey: "variance",
            label: "So sánh tiêu hao iPOS",
            icon: Scale,
            permission: "report.variance",
          },
          {
            href: "/reports?tab=payment",
            tabKey: "payment",
            label: "Đối soát thanh toán",
            icon: CreditCard,
            permission: "report.payment",
          },
        ],
      },
      {
        href: "/guide",
        label: "Hướng dẫn quản trị",
        icon: BookOpenCheck,
        permission: "role.read",
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
        children: [
          {
            href: "/organization?tab=facilities",
            tabKey: "facilities",
            label: "Cơ sở",
            icon: Building2,
            permission: "facility.read",
          },
          {
            href: "/organization?tab=locations",
            tabKey: "locations",
            label: "Điểm lưu kho",
            icon: Warehouse,
            permission: "stock_location.read",
          },
          {
            href: "/organization?tab=departments",
            tabKey: "departments",
            label: "Bộ phận",
            icon: Flame,
            permission: "department.read",
          },
        ],
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
        permission: [
          "ingredient.read",
          "unit.read",
          "supplier.read",
          "conversion.read",
          "supplier_ingredient.read",
        ],
        children: [
          {
            href: "/catalog?tab=ingredients",
            tabKey: "ingredients",
            label: "Nguyên liệu",
            icon: Boxes,
            permission: "ingredient.read",
          },
          {
            href: "/catalog?tab=groups",
            tabKey: "groups",
            label: "Nhóm nguyên liệu",
            icon: Tags,
            permission: "ingredient.read",
          },
          {
            href: "/catalog?tab=units",
            tabKey: "units",
            label: "Đơn vị tính",
            icon: Ruler,
            permission: "unit.read",
          },
          {
            href: "/catalog?tab=conversions",
            tabKey: "conversions",
            label: "Quy đổi đơn vị",
            icon: Repeat,
            permission: "conversion.read",
          },
          {
            href: "/catalog?tab=suppliers",
            tabKey: "suppliers",
            label: "Nhà cung cấp",
            icon: Truck,
            permission: "supplier.read",
          },
          {
            href: "/catalog?tab=links",
            tabKey: "links",
            label: "Hàng & giá nhà cung cấp",
            icon: Link2,
            permission: "supplier_ingredient.read",
          },
        ],
      },
      {
        href: "/sourcing",
        label: "Nguồn hàng & hàng được xin",
        icon: GitBranch,
        permission: ["eligibility.read", "source_rule.read"],
        children: [
          {
            href: "/sourcing?tab=rules",
            tabKey: "rules",
            label: "Nguồn cấp hàng",
            icon: GitBranch,
            permission: "source_rule.read",
          },
          {
            href: "/sourcing?tab=group-eligibility",
            tabKey: "group-eligibility",
            label: "Nhóm hàng được phép xin",
            icon: ListChecks,
            permission: "eligibility.read",
          },
          {
            href: "/sourcing?tab=eligibility",
            tabKey: "eligibility",
            label: "Ngoại lệ từng mặt hàng",
            icon: ListChecks,
            permission: "eligibility.read",
          },
        ],
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
        label: "Đơn cấp hàng",
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
        label: "Giao nhận hàng",
        icon: Truck,
        countKey: "openDiscrepancies",
        permission: ["dispatch.read", "receipt.read", "discrepancy.read"],
        children: [
          {
            href: "/delivery?tab=dispatches",
            tabKey: "dispatches",
            label: "Phiếu xuất kho",
            icon: Truck,
            permission: "dispatch.read",
          },
          {
            href: "/delivery?tab=receipts",
            tabKey: "receipts",
            label: "Phiếu nhận hàng",
            icon: PackageCheck,
            permission: "receipt.read",
          },
          {
            href: "/delivery?tab=discrepancies",
            tabKey: "discrepancies",
            label: "Chênh lệch giao nhận",
            icon: AlertTriangle,
            countKey: "openDiscrepancies",
            permission: "discrepancy.read",
          },
        ],
      },
    ],
  },
  {
    title: "KHO & VẬN HÀNH TỒN KHO",
    items: [
      {
        href: "/inventory",
        label: "Tồn kho & lịch sử kho",
        icon: Warehouse,
        countKey: "lowStock",
        permission: [
          "stock.read",
          "stock_ledger.read",
          "adjustment.read",
          "stocktake.read",
          "damage.read",
        ],
        children: [
          {
            href: "/inventory?tab=balances",
            tabKey: "balances",
            label: "Số dư tồn kho",
            icon: Boxes,
            countKey: "lowStock",
            permission: "stock.read",
          },
          {
            href: "/inventory?tab=ledger",
            tabKey: "ledger",
            label: "Lịch sử nhập xuất",
            icon: FileText,
            permission: "stock_ledger.read",
          },
          {
            href: "/inventory?tab=adjustments",
            tabKey: "adjustments",
            label: "Điều chỉnh kho",
            icon: SlidersHorizontal,
            permission: "adjustment.read",
          },
          {
            href: "/inventory?tab=stocktakes",
            tabKey: "stocktakes",
            label: "Phiếu kiểm kê",
            icon: ClipboardCheck,
            permission: "stocktake.read",
          },
          {
            href: "/inventory?tab=damage",
            tabKey: "damage",
            label: "Hỏng & Hao hụt",
            icon: AlertOctagon,
            permission: "damage.read",
          },
        ],
      },
    ],
  },
  {
    title: "iPOS & ĐỊNH MỨC",
    items: [
      {
        href: "/operations",
        label: "iPOS & định mức",
        icon: Utensils,
        permission: [
          "ipos_mapping.read",
          "recipe.read",
          "sales_import.read",
          "variance.read",
          "alert_rule.manage",
        ],
        children: [
          {
            href: "/operations?tab=mappings",
            tabKey: "mappings",
            label: "Liên kết món iPOS",
            icon: Utensils,
            permission: "ipos_mapping.read",
          },
          {
            href: "/operations?tab=recipes",
            tabKey: "recipes",
            label: "Định mức nguyên liệu",
            icon: ChefHat,
            permission: "recipe.read",
          },
          {
            href: "/operations?tab=sales",
            tabKey: "sales",
            label: "Dữ liệu bán hàng",
            icon: Receipt,
            permission: "sales_import.read",
          },
          {
            href: "/operations?tab=variance",
            tabKey: "variance",
            label: "So sánh tiêu hao",
            icon: Scale,
            permission: "variance.read",
          },
          {
            href: "/operations?tab=alerts",
            tabKey: "alerts",
            label: "Cảnh báo tự động",
            icon: BellRing,
            permission: "alert_rule.manage",
          },
        ],
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
        children: [
          {
            href: "/users?tab=users",
            tabKey: "users",
            label: "Tài khoản người dùng",
            icon: Users,
            permission: "user.read",
          },
          {
            href: "/users?tab=roles",
            tabKey: "roles",
            label: "Vai trò & Quyền hạn",
            icon: Shield,
            permission: "role.read",
          },
          {
            href: "/users?tab=grants",
            tabKey: "grants",
            label: "Phân quyền tài khoản",
            icon: KeyRound,
            permission: "grant.read",
          },
        ],
      },
      {
        href: "/system",
        label: "Nhật ký & tình trạng hệ thống",
        icon: Sliders,
      },
    ],
  },
]
