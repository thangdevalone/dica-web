"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Boxes,
  Building2,
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
  Monitor,
  Menu,
  X as XIcon,
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
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { dicaStore, type Notification } from "@/lib/dica-api";
import { useAppStore } from "@/stores/use-app-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, type NavItem, type NavSection } from "@/constants";

interface NavigationListProps {
  pathname: string;
  onNavigate?: () => void;
}

function NavigationList({ pathname, onNavigate }: NavigationListProps) {
  return (
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
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-foreground text-background font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-background"
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
                          ? "bg-background/20 text-background"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.countKey === "pendingRequests" && (
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                        isActive
                          ? "bg-background/20 text-background"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      2
                    </span>
                  )}
                  {item.countKey === "lowStock" && (
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                        isActive
                          ? "bg-background/20 text-background"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
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
  );
}

function UserFooter({ onLogout }: { onLogout?: () => void } = {}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const displayName = user?.full_name || "Nguyễn Thế Thắng";
  const displayRole = user?.role_name ? `${user.role_name} • DICA HQ` : "Super Admin • DICA HQ";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join("") || "AD";

  const handleLogout = () => {
    logout();
    onLogout?.();
    toast.info("Đã đăng xuất phiên làm việc.");
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-muted/60">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Avatar className="size-8 border border-border">
          <AvatarFallback className="bg-muted font-bold text-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col truncate">
          <span className="truncate text-xs font-semibold text-foreground">
            {displayName}
          </span>
          <span className="truncate text-[10px] text-muted-foreground font-mono">
            {displayRole}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleLogout}
        title="Đăng xuất"
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Zustand app store
  const selectedFacilityId = useAppStore((state) => state.selectedFacilityId);
  const setSelectedFacilityId = useAppStore((state) => state.setSelectedFacilityId);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openCommand, setOpenCommand] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to /login if unauthenticated after mount
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [backendStatus, setBackendStatus] = React.useState<"live" | "demo" | "checking">("checking");
  const [facilitiesList, setFacilitiesList] = React.useState<{ id: string; name: string }[]>([]);

  // Load facilities, notifications, and health status
  React.useEffect(() => {
    setNotifications(dicaStore.getNotifications());
    try {
      const facs = dicaStore.getFacilities();
      setFacilitiesList(facs.map((f) => ({ id: f.id, name: f.name })));
    } catch {
      // fallback
    }

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

  const currentFacilityLabel = React.useMemo(() => {
    if (!selectedFacilityId || selectedFacilityId === "ALL") {
      return "Tất cả cơ sở";
    }
    const found = facilitiesList.find((f) => f.id === selectedFacilityId);
    return found ? found.name : "Tất cả cơ sở";
  }, [selectedFacilityId, facilitiesList]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ============================================================ */}
      {/* 1. Desktop Sidebar (Hidden on < lg, fixed h-full) */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground h-full select-none">
        {/* Sidebar Header: EXACTLY h-16 shrink-0 border-b border-border to align with top header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-xs">
            <Boxes className="size-4.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                DICA
              </span>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                SCM
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground truncate">
              Chuỗi Cung Ứng F&B
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items with smooth scroll */}
        <ScrollArea className="flex-1 px-3 py-4">
          <NavigationList pathname={pathname} />
        </ScrollArea>

        {/* Sidebar Footer with current user */}
        <div className="shrink-0 border-t border-border p-3 bg-muted/20">
          <UserFooter />
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. Mobile / Tablet Drawer (Sheet) for < lg screens */}
      {/* ============================================================ */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-border"
          showCloseButton={false}
        >
          {/* Mobile Header: EXACTLY h-16 shrink-0 border-b border-border */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-xs">
                <Boxes className="size-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-base font-bold tracking-tight text-foreground">
                    DICA
                  </span>
                  <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    SCM
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  Chuỗi Cung Ứng F&B
                </span>
              </div>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="Đóng menu"
              >
                <XIcon className="size-4" />
              </Button>
            </SheetClose>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <NavigationList
              pathname={pathname}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </ScrollArea>

          <div className="shrink-0 border-t border-border p-3 bg-muted/20">
            <UserFooter onLogout={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ============================================================ */}
      {/* 3. Main Column (Top Header + Scrollable Content Container) */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Dashboard Top Header: EXACTLY h-16 shrink-0 border-b border-border matching sidebar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          {/* Left: Hamburger menu on mobile/tablet + Clear Breadcrumb navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
              <span>Hệ thống</span>
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
            </div>
            <span className="font-heading text-sm sm:text-base font-bold text-foreground truncate">
              {getPageTitle()}
            </span>
          </div>

          {/* Right: Facility selector, Health status, Search, Notifications, Theme */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Facility Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 px-2.5 sm:px-3 text-xs font-medium max-w-[130px] sm:max-w-[190px]"
                >
                  <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{currentFacilityLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel>Chọn phạm vi cơ sở</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedFacilityId("ALL");
                    toast.success("Đã lọc: Tất cả cơ sở");
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Tất cả cơ sở</span>
                  {selectedFacilityId === "ALL" && (
                    <Check className="size-3.5 text-foreground" />
                  )}
                </DropdownMenuItem>
                {facilitiesList.map((fac) => (
                  <DropdownMenuItem
                    key={fac.id}
                    onClick={() => {
                      setSelectedFacilityId(fac.id);
                      toast.success(`Đã lọc phạm vi: ${fac.name}`);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{fac.name}</span>
                    {selectedFacilityId === fac.id && (
                      <Check className="size-3.5 text-foreground" />
                    )}
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
                  className="h-9 gap-1.5 px-2.5 sm:px-3 text-xs font-medium rounded-xl border-border bg-card/90 text-foreground hover:bg-accent transition-colors"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      backendStatus === "live" ? "bg-foreground animate-pulse" : "bg-muted-foreground/60"
                    )}
                  />
                  <span className="hidden md:inline">
                    {backendStatus === "live" ? "API Live: 3000" : "Mock Engine (Demo)"}
                  </span>
                  <span className="md:hidden">
                    {backendStatus === "live" ? "Live" : "Demo"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-semibold">
                      Trạng thái kết nối API
                    </h4>
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
                          const res = await fetch(
                            `${dicaStore.getApiBaseUrl()}/health/live`,
                            { signal: AbortSignal.timeout(2000) }
                          );
                          if (res.ok) {
                            setBackendStatus("live");
                            toast.success("Kết nối Backend NestJS thành công!");
                          } else {
                            setBackendStatus("demo");
                            toast.info("Không nhận được phản hồi, giữ chế độ Demo.");
                          }
                        } catch {
                          setBackendStatus("demo");
                          toast.info(
                            "Backend chưa khởi chạy, đang chạy chế độ Mock hoàn chỉnh."
                          );
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
              className="hidden xl:flex h-9 w-44 justify-between bg-muted/30 px-3 text-xs text-muted-foreground hover:bg-muted/60"
            >
              <span className="flex items-center gap-1.5">
                <Search className="size-3.5" />
                <span>Tìm kiếm nhanh...</span>
              </span>
              <kbd className="pointer-events-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenCommand(true)}
              className="xl:hidden size-9 text-muted-foreground hover:text-foreground"
              title="Tìm kiếm nhanh (⌘K)"
            >
              <Search className="size-4" />
            </Button>

            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-9 text-muted-foreground hover:text-foreground"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-heading text-sm font-semibold">
                    Thông báo hệ thống
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-foreground hover:underline font-medium"
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
                            !n.is_read && "bg-muted/50 font-medium"
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

            {/* Theme Mode Configurator Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-foreground"
                  title="Tùy chỉnh giao diện: Sáng / Tối / Hệ thống"
                >
                  <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Chuyển đổi giao diện</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuLabel>Chế độ hiển thị</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("light");
                    toast.info("Đã chuyển sang giao diện Sáng");
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sun className="size-3.5 text-amber-500" />
                    <span>Sáng (Light)</span>
                  </div>
                  {theme === "light" && <Check className="size-3.5 text-foreground" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("dark");
                    toast.info("Đã chuyển sang giao diện Tối");
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Moon className="size-3.5 text-blue-400" />
                    <span>Tối (Dark)</span>
                  </div>
                  {theme === "dark" && <Check className="size-3.5 text-foreground" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme("system");
                    toast.info("Đã đặt theo giao diện Hệ thống");
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="size-3.5 text-muted-foreground" />
                    <span>Hệ thống (Auto)</span>
                  </div>
                  {theme === "system" && <Check className="size-3.5 text-foreground" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Viewport with independent scroll */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Gõ lệnh hoặc tìm trang (ví dụ: kho, nguyên liệu, yêu cầu)..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>
          <CommandGroup heading="Điều hướng nhanh">
            {NAV_SECTIONS.flatMap((sec) => sec.items).map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    setOpenCommand(false);
                    router.push(item.href);
                  }}
                >
                  <Icon className="mr-2 size-4 text-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Thao tác nhanh">
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/requests?action=create");
              }}
            >
              <Sparkles className="mr-2 size-4 text-foreground" />
              <span>Tạo yêu cầu cấp hàng mới</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false);
                router.push("/catalog?action=create-ingredient");
              }}
            >
              <Sparkles className="mr-2 size-4 text-foreground" />
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
              <RefreshCw className="mr-2 size-4 text-foreground" />
              <span>Nạp lại dữ liệu mẫu (Reset Data)</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
