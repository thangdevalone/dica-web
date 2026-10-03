"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  Search,
  Bell,
  Moon,
  Sun,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Command as CommandIcon,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { dicaStore, type Notification } from "@/lib/dica-api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  countKey?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
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

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [openCommand, setOpenCommand] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [backendStatus, setBackendStatus] = React.useState<"live" | "demo" | "checking">("checking");
  const [selectedFacility, setSelectedFacility] = React.useState<string>("Tất cả cơ sở");

  // Load notifications and status
  React.useEffect(() => {
    setNotifications(dicaStore.getNotifications());

    // Check backend health
    const checkHealth = async () => {
      try {
        const baseUrl = dicaStore.getApiBaseUrl();
        const res = await fetch(`${baseUrl}/health/live`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          setBackendStatus("live");
        } else {
          setBackendStatus("demo");
        }
      } catch {
        setBackendStatus("demo");
      }
    };

    checkHealth();
  }, []);

  // Keyboard shortcut for command palette (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    setNotifications(updated);
    dicaStore.saveNotifications(updated);
    toast.success("Đã đánh dấu đọc tất cả thông báo.");
  };

  const getPageTitle = () => {
    for (const sec of NAV_SECTIONS) {
      for (const item of sec.items) {
        if (item.href === pathname) return item.label;
      }
    }
    return "Quản trị hệ thống DICA";
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/80 bg-card/95 backdrop-blur-md transition-all duration-300">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-border/70 px-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/20">
            <Boxes className="size-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                DICA
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                PRO SCM
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Chuỗi Cung Ứng F&B</span>
          </div>
        </div>

        {/* Navigation list */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
                <div className="space-y-0.5 pt-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.countKey === "pendingRequests" && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            2
                          </span>
                        )}
                        {item.countKey === "lowStock" && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-bold text-red-600 dark:text-red-400">
                            2
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Card & Tenant Footer */}
        <div className="border-t border-border/80 p-3 bg-muted/30">
          <div className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-muted/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                  TT
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-semibold text-foreground">
                  Nguyễn Thế Thắng
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  Super Admin • DICA HQ
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                toast.info("Đã đăng xuất phiên làm việc hiện tại.");
              }}
              title="Đăng xuất"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md">
          {/* Left: Breadcrumbs & Page title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Hệ thống</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-heading text-sm font-bold text-foreground">
              {getPageTitle()}
            </span>
          </div>

          {/* Right: Quick actions, Status, Search, Notifications, Theme */}
          <div className="flex items-center gap-3">
            {/* Facility selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-medium">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  <span className="max-w-[140px] truncate">{selectedFacility}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel>Chọn phạm vi cơ sở</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  "Tất cả cơ sở",
                  "Kho Tổng Bình Tân",
                  "Bếp Trung Tâm Tân Bình",
                  "DICA BBQ Q1",
                  "DICA Hotpot Q7",
                  "DICA Grill Thảo Điền",
                ].map((fac) => (
                  <DropdownMenuItem
                    key={fac}
                    onClick={() => {
                      setSelectedFacility(fac);
                      toast.success(`Đã lọc phạm vi: ${fac}`);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>{fac}</span>
                    {selectedFacility === fac && <Check className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Backend Health Status Badge */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                    backendStatus === "live"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full animate-pulse",
                      backendStatus === "live" ? "bg-emerald-500" : "bg-blue-500"
                    )}
                  />
                  <span>
                    {backendStatus === "live" ? "API Live: 3000" : "Mock Engine (Demo)"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-semibold">Trạng thái kết nối API</h4>
                    <Badge variant={backendStatus === "live" ? "default" : "secondary"}>
                      {backendStatus === "live" ? "Đã kết nối" : "Nội bộ độc lập"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {backendStatus === "live"
                      ? "Kết nối trực tiếp tới DICA NestJS Backend API tại http://localhost:3000/api/v1. Toàn bộ dữ liệu được xác thực bằng JWT."
                      : "Backend đang ở chế độ dự phòng thông minh (Offline Mock Engine). Bạn có thể thao tác đầy đủ CRUD, dữ liệu lưu trữ tức thời trong local database."}
                  </p>
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      URL: {dicaStore.getApiBaseUrl()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={async () => {
                        toast.loading("Đang kiểm tra kết nối...");
                        try {
                          const res = await fetch(`${dicaStore.getApiBaseUrl()}/health/live`, {
                            signal: AbortSignal.timeout(2000),
                          });
                          if (res.ok) {
                            setBackendStatus("live");
                            toast.success("Kết nối Backend NestJS thành công!");
                          } else {
                            setBackendStatus("demo");
                            toast.info("Không nhận được phản hồi, giữ chế độ Demo.");
                          }
                        } catch {
                          setBackendStatus("demo");
                          toast.info("Backend chưa khởi chạy, đang chạy chế độ Mock hoàn chỉnh.");
                        }
                      }}
                    >
                      <RefreshCw className="size-3" />
                      Kiểm tra
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Global Search / Command Bar Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenCommand(true)}
              className="h-8 w-44 justify-between bg-muted/40 px-2.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <span className="flex items-center gap-1.5">
                <Search className="size-3.5" />
                <span>Tìm kiếm nhanh...</span>
              </span>
              <kbd className="pointer-events-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-8">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                  <span className="font-heading text-sm font-semibold">Thông báo hệ thống</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-72">
                  <div className="divide-y divide-border/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Không có thông báo mới.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                            !n.is_read && "bg-primary/5"
                          )}
                          onClick={() => {
                            if (n.link) router.push(n.link);
                          }}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === "ALERT" ? (
                              <AlertTriangle className="size-4 text-red-500" />
                            ) : n.type === "WARNING" ? (
                              <Activity className="size-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-semibold leading-tight text-foreground">
                              {n.title}
                            </p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 font-mono">
                              {n.created_at}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Dark / Light Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Chuyển chế độ sáng / tối"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {/* Command Palette (Dialog) */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Gõ lệnh hoặc tìm trang (ví dụ: kho, nguyên liệu, yêu cầu)..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>
          <CommandGroup heading="Điều hướng nhanh">
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/");
              }}
            >
              <LayoutDashboard className="mr-2 size-4" />
              <span>Bàn làm việc & KPI</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/organization");
              }}
            >
              <Building2 className="mr-2 size-4" />
              <span>Quản lý Cơ sở & Chi nhánh</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/catalog");
              }}
            >
              <Boxes className="mr-2 size-4" />
              <span>Danh mục Nguyên vật liệu & Đơn vị tính</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/requests");
              }}
            >
              <ClipboardList className="mr-2 size-4" />
              <span>Yêu cầu cấp hàng & Phê duyệt</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/orders");
              }}
            >
              <ShoppingCart className="mr-2 size-4" />
              <span>Đơn thực hiện Fulfillment & PO</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/delivery");
              }}
            >
              <Truck className="mr-2 size-4" />
              <span>Giao nhận & Xử lý sai lệch</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/inventory");
              }}
            >
              <Warehouse className="mr-2 size-4" />
              <span>Tồn kho tức thời & Sổ cái kho</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/operations");
              }}
            >
              <Utensils className="mr-2 size-4" />
              <span>Định lượng món ăn & Hao hụt iPOS</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/users");
              }}
            >
              <Users className="mr-2 size-4" />
              <span>Tài khoản & Phân quyền RBAC</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/system");
              }}
            >
              <Sliders className="mr-2 size-4" />
              <span>Nhật ký hệ thống & Cấu hình API</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Thao tác nhanh">
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/requests?action=create");
              }}
            >
              <Sparkles className="mr-2 size-4 text-amber-500" />
              <span>Tạo yêu cầu cấp hàng mới</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/catalog?action=create-ingredient");
              }}
            >
              <Boxes className="mr-2 size-4 text-emerald-500" />
              <span>Thêm mới nguyên vật liệu SKU</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                dicaStore.resetAll();
                toast.success("Đã nạp lại bộ dữ liệu mẫu chuẩn DICA.");
                window.location.reload();
              }}
            >
              <RefreshCw className="mr-2 size-4 text-blue-500" />
              <span>Nạp lại dữ liệu mẫu (Reset Data)</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
