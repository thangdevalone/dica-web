"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Check,
  RefreshCw,
  Sparkles,
  Monitor,
  Menu,
  X as XIcon,
  Loader2,
  ShieldX,
  BellRing,
  BookOpenCheck,
} from "lucide-react";
import { START_ADMIN_TOUR_EVENT } from "@/components/shared/admin-guided-tour";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAppStore } from "@/stores/use-app-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, type NavCountKey, type NavItem, type NavChildItem } from "@/constants";
import { useCurrentTab, TAB_CHANGE_EVENT, type TabChangeEventDetail } from "@/hooks/use-tab-sync";
import { ChevronDown } from "lucide-react";
import { API_BASE_URL, api, errorMessage } from "@/lib/api/client";
import { loadProfile, logout } from "@/lib/api/auth";
import type { DashboardSummary, Notification } from "@/lib/api/types";
import { useApiMutation, usePagedQuery } from "@/hooks/use-api";
import { useFacilities } from "@/hooks/use-lookups";
import { useDashboardSummary, useHealth } from "@/hooks/use-system";
import { formatDateTime } from "@/lib/formatters";
import { BrandLogo } from "@/components/shared/brand-logo";

function canSeeChild(child: NavChildItem, permissions: string[]) {
  if (!child.permission) return true;
  const required = Array.isArray(child.permission) ? child.permission : [child.permission];
  return required.some((code) => permissions.includes(code));
}

function canSee(item: NavItem, permissions: string[]) {
  if (item.permission) {
    const required = Array.isArray(item.permission) ? item.permission : [item.permission];
    if (required.some((code) => permissions.includes(code))) return true;
  }
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => canSeeChild(child, permissions));
  }
  return !item.permission;
}

function navCounts(summary: DashboardSummary | undefined): Partial<Record<NavCountKey, number>> {
  if (!summary) return {};
  return {
    pendingRequests: summary.requests?.by_status.SUBMITTED ?? 0,
    openOrders: summary.orders?.open ?? 0,
    pendingTransfers: summary.transfers?.by_status.SUBMITTED ?? 0,
    openDiscrepancies: summary.delivery?.open_discrepancies ?? 0,
    lowStock: summary.inventory?.low_stock_total ?? 0,
  };
}

interface NavigationListProps {
  pathname: string;
  onNavigate?: () => void;
}

function NavigationList({ pathname, onNavigate }: NavigationListProps) {
  const permissions = useAuthStore((state) => state.permissions);
  const { data: summary } = useDashboardSummary();
  const counts = navCounts(summary);
  const currentTab = useCurrentTab();

  const expandedItems = useAppStore((state) => state.expandedNavItems);
  const setNavItemExpanded = useAppStore((state) => state.setNavItemExpanded);

  // A direct/deep link reveals its group, without closing any group the user opened.
  React.useEffect(() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.children && item.children.length > 0) {
          if (pathname === item.href || pathname.startsWith(item.href + "/")) {
            setNavItemExpanded(item.href, true);
          }
        }
      }
    }
  }, [pathname, setNavItemExpanded]);

  React.useEffect(() => {
    const handleExpand = (e: Event) => {
      const detail = (e as CustomEvent<{ route: string }>).detail;
      if (detail && detail.route) {
        setNavItemExpanded(detail.route, true);
      }
    };
    window.addEventListener("dica:expand-sidebar", handleExpand);
    return () => window.removeEventListener("dica:expand-sidebar", handleExpand);
  }, [setNavItemExpanded]);

  const toggleExpand = (href: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const isExpanded = expandedItems[href] ?? (pathname === href || pathname.startsWith(href + "/"));
    setNavItemExpanded(href, !isExpanded);
  };

  const handleChildClick = (itemHref: string, child: NavChildItem, e: React.MouseEvent) => {
    if (pathname === itemHref) {
      e.preventDefault();
      // On same page: update URL search param directly and notify tab sync listeners
      const url = new URL(window.location.href);
      url.searchParams.set("tab", child.tabKey);
      window.history.replaceState(null, "", url.pathname + url.search);
      window.dispatchEvent(
        new CustomEvent<TabChangeEventDetail>(TAB_CHANGE_EVENT, {
          detail: { pathname: url.pathname, tab: child.tabKey },
        })
      );
      onNavigate?.();
    } else {
      onNavigate?.();
    }
  };

  return (
    <nav className="space-y-6" data-tour="navigation">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((item) => canSee(item, permissions));
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-1 pt-1">
              {items.map((item) => {
                const Icon = item.icon;
                const visibleChildren = item.children?.filter((child) => canSeeChild(child, permissions)) ?? [];
                const hasChildren = visibleChildren.length > 0;
                const isCurrentRoute = pathname === item.href;
                const isExpanded = expandedItems[item.href] ?? isCurrentRoute;
                const parentCount = item.countKey ? counts[item.countKey] : undefined;

                if (!hasChildren) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                        isCurrentRoute
                          ? "bg-foreground text-background font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isCurrentRoute ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isCurrentRoute
                                ? "bg-background/20 text-background"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {parentCount !== undefined && parentCount > 0 && (
                          <span
                            className={cn(
                              "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold",
                              isCurrentRoute
                                ? "bg-background/20 text-background"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {parentCount > 99 ? "99+" : parentCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                }

                // Item has children (sidebar con)
                return (
                  <div key={item.href} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(item.href, e)}
                      data-tour={`sidebar-parent-${item.href}`}
                      className={cn(
                        "group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 select-none text-left",
                        isCurrentRoute
                          ? "bg-muted/80 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isCurrentRoute ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                        {parentCount !== undefined && parentCount > 0 && (
                          <span
                            className={cn(
                              "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                              isCurrentRoute
                                ? "bg-background text-foreground border border-border/80"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {parentCount > 99 ? "99+" : parentCount}
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                            isExpanded ? "rotate-0" : "-rotate-90"
                          )}
                        />
                      </div>
                    </button>

                    {/* Children: sidebar con */}
                    <div
                      className={cn(
                        "grid transition-all duration-200 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-4 pl-3 border-l border-border/70 my-1 space-y-0.5">
                          {visibleChildren.map((child, childIdx) => {
                            const ChildIcon = child.icon;
                            const isActiveChild =
                              isCurrentRoute &&
                              (currentTab === child.tabKey || (!currentTab && childIdx === 0));
                            const childCount = child.countKey ? counts[child.countKey] : undefined;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={(e) => handleChildClick(item.href, child, e)}
                                data-tour={`sidebar-sub-${child.tabKey}`}
                                data-tour-tab={child.tabKey}
                                data-state={isActiveChild ? "active" : "inactive"}
                                className={cn(
                                  "group relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                                  isActiveChild
                                    ? "bg-foreground text-background font-semibold shadow-xs"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <ChildIcon
                                    className={cn(
                                      "size-3.5 shrink-0 transition-colors",
                                      isActiveChild
                                        ? "text-background"
                                        : "text-muted-foreground/80 group-hover:text-foreground"
                                    )}
                                  />
                                  <span className="truncate">{child.label}</span>
                                </div>
                                {childCount !== undefined && childCount > 0 && (
                                  <span
                                    className={cn(
                                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                                      isActiveChild
                                        ? "bg-background/25 text-background"
                                        : "bg-muted text-muted-foreground border border-border"
                                    )}
                                  >
                                    {childCount > 99 ? "99+" : childCount}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function UserFooter({ onLogout }: { onLogout?: () => void } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const grants = useAuthStore((state) => state.grants);
  const organizationCode = useAuthStore((state) => state.organizationCode);

  const displayName = user?.display_name || user?.username || "—";
  const roles = [...new Set(grants.map((g) => g.roleCode))].join(", ");
  const displayRole = `${roles || (user?.kind === "SUPPLIER" ? "Nhà cung cấp" : "Nội bộ")}${
    organizationCode ? ` • ${organizationCode}` : ""
  }`;
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    onLogout?.();
    toast.info("Đã đăng xuất phiên làm việc.");
    router.replace("/login");
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
          <span className="truncate text-xs font-semibold text-foreground">{displayName}</span>
          <span className="truncate text-[10px] text-muted-foreground font-mono" title={displayRole}>
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

const NOTIFICATION_ROUTES: Record<string, string> = {
  SupplyRequest: "/requests",
  FulfillmentOrder: "/orders",
  Transfer: "/transfers",
  DamageReport: "/inventory?tab=damage",
};

function NotificationsPopover() {
  const router = useRouter();
  const canRead = useAuthStore((state) => state.permissions.includes("notification.read_own"));
  const canMark = useAuthStore((state) => state.permissions.includes("notification.mark_own"));
  const latest = usePagedQuery<Notification>(
    "/notifications",
    { page_size: 8 },
    { enabled: canRead, refetchInterval: 60_000 }
  );
  const unread = usePagedQuery<Notification>(
    "/notifications",
    { status: "UNREAD", page_size: 1 },
    { enabled: canRead, refetchInterval: 60_000 }
  );
  const unreadCount = unread.data?.meta?.total ?? 0;

  const markAll = useApiMutation({
    mutationFn: () => api.post("/notifications/read-all"),
  });
  const markOne = useApiMutation<string>({
    mutationFn: (id) => api.post(`/notifications/${id}/read`),
    successMessage: false,
  });

  if (!canRead) return null;

  const open = (n: Notification) => {
    if (n.status === "UNREAD" && canMark) markOne.mutate(n.id);
    const base = NOTIFICATION_ROUTES[n.resourceType];
    if (base) {
      const sep = base.includes("?") ? "&" : "?";
      router.push(`${base}${sep}id=${n.resourceId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-muted-foreground hover:text-foreground"
          aria-label="Thông báo"
          data-tour="notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-heading text-sm font-semibold">Thông báo</span>
          {unreadCount > 0 && canMark && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="text-xs text-foreground hover:underline font-medium disabled:opacity-50"
            >
              Đọc tất cả
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border/60">
            {latest.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Đang tải...
              </div>
            ) : latest.error ? (
              <div className="p-4 text-center text-xs text-destructive">{errorMessage(latest.error)}</div>
            ) : (latest.data?.items.length ?? 0) === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Không có thông báo.</div>
            ) : (
              latest.data?.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                    n.status === "UNREAD" && "bg-muted/50"
                  )}
                  onClick={() => open(n)}
                >
                  <BellRing
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      n.status === "UNREAD" ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-xs leading-tight text-foreground", n.status === "UNREAD" && "font-semibold")}>
                      {n.title}
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/80 font-mono">{formatDateTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function HealthPopover() {
  const { data: health, refetch, isFetching } = useHealth();
  const status = health?.status ?? "checking";
  const label =
    status === "ready" ? "Máy chủ sẵn sàng" : status === "degraded" ? "Lỗi cơ sở dữ liệu" : status === "down" ? "Mất kết nối" : "Đang kiểm tra";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 px-2.5 sm:px-3 text-xs font-medium rounded-xl border-border bg-card/90 text-foreground hover:bg-accent transition-colors"
          data-tour="health"
        >
          <span
            className={cn(
              "size-2 rounded-full shrink-0",
              status === "ready"
                ? "bg-emerald-500 animate-pulse"
                : status === "checking"
                  ? "bg-muted-foreground/60"
                  : "bg-destructive"
            )}
          />
          <span className="hidden md:inline">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-sm font-semibold">Tình trạng kết nối hệ thống</h4>
            <Badge variant={status === "ready" ? "default" : "destructive"}>{label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{health?.message ?? "Đang kiểm tra kết nối..."}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-border/70 p-2">
              <p className="text-muted-foreground">Độ trễ</p>
              <p className="font-semibold text-foreground">
                {health?.latencyMs != null ? `${health.latencyMs} ms` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 p-2">
              <p className="text-muted-foreground">Kiểm tra lúc</p>
              <p className="font-semibold text-foreground">
                {health ? new Date(health.checkedAt).toLocaleTimeString("vi-VN") : "—"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="truncate text-[11px] text-muted-foreground font-mono" title={API_BASE_URL}>
              {API_BASE_URL}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs gap-1"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
              Kiểm tra
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FacilityScopeMenu() {
  const selectedFacilityId = useAppStore((state) => state.selectedFacilityId);
  const setSelectedFacilityId = useAppStore((state) => state.setSelectedFacilityId);
  const { data: facilities = [] } = useFacilities();

  React.useEffect(() => {
    if (
      selectedFacilityId !== "ALL" &&
      facilities.length > 0 &&
      !facilities.some((f) => f.id === selectedFacilityId)
    ) {
      setSelectedFacilityId("ALL");
    }
  }, [facilities, selectedFacilityId, setSelectedFacilityId]);

  const current =
    selectedFacilityId === "ALL"
      ? "Tất cả cơ sở"
      : (facilities.find((f) => f.id === selectedFacilityId)?.name ?? "Tất cả cơ sở");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="size-9 gap-2 p-0 text-xs font-medium sm:h-9 sm:w-auto sm:max-w-[190px] sm:px-3"
          aria-label={`Phạm vi cơ sở: ${current}`}
          title={current}
          data-tour="facility"
        >
          <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="hidden truncate sm:inline">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 text-xs">
        <DropdownMenuLabel>Phạm vi cơ sở</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSelectedFacilityId("ALL")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span>Tất cả cơ sở</span>
          {selectedFacilityId === "ALL" && <Check className="size-3.5 text-foreground" />}
        </DropdownMenuItem>
        {facilities.map((fac) => (
          <DropdownMenuItem
            key={fac.id}
            onClick={() => setSelectedFacilityId(fac.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">
              {fac.name} <span className="font-mono text-[10px] text-muted-foreground">{fac.code}</span>
            </span>
            {selectedFacilityId === fac.id && <Check className="size-3.5 text-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <BrandLogo size={36} priority className="size-9 border border-border bg-white shadow-xs" />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-base font-bold tracking-tight text-foreground">DICA</span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            SCM
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground truncate">Chuỗi Cung Ứng F&B</span>
      </div>
    </div>
  );
}

function FullScreenState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-xs text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminLayout({
  children,
  permission,
}: {
  children: React.ReactNode;
  /** Quyền tối thiểu để xem trang (một trong các quyền). */
  permission?: string | string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openCommand, setOpenCommand] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Bảo vệ route: chưa đăng nhập thì chuyển về /login
  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?next=${next}`);
    }
  }, [hasHydrated, accessToken, router]);

  // Làm mới hồ sơ & quyền mỗi lần vào ứng dụng
  React.useEffect(() => {
    if (!hasHydrated || !accessToken) return;
    let cancelled = false;
    loadProfile()
      .then(() => !cancelled && setProfileError(null))
      .catch((error) => {
        if (cancelled) return;
        const message = errorMessage(error);
        setProfileError(message);
        toast.error(message, { id: "profile-load-error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, Boolean(accessToken)]);

  // Phím tắt command palette (Ctrl+K hoặc Cmd+K)
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

  const visibleItems = React.useMemo(
    () => NAV_SECTIONS.flatMap((sec) => sec.items).filter((item) => canSee(item, permissions)),
    [permissions]
  );

  const pageTitle =
    NAV_SECTIONS.flatMap((s) => s.items).find((item) => item.href === pathname)?.label ??
    "Quản trị hệ thống DICA";

  if (!hasHydrated || !accessToken || (!user && !profileError)) {
    return (
      <FullScreenState>
        <Loader2 className="mr-2 size-4 animate-spin" /> Đang xác thực phiên làm việc...
      </FullScreenState>
    );
  }

  if (!user && profileError) {
    return (
      <FullScreenState>
        <Card className="max-w-sm gap-3 p-6 text-center">
          <ShieldX className="mx-auto size-6 text-destructive" />
          <p className="text-sm font-semibold text-foreground">Không tải được hồ sơ người dùng</p>
          <p className="text-xs text-muted-foreground">{profileError}</p>
          <Button
            size="sm"
            className="text-xs"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Đăng nhập lại
          </Button>
        </Card>
      </FullScreenState>
    );
  }

  const currentNavItem = NAV_SECTIONS.flatMap((s) => s.items).find((item) => item.href === pathname);
  const routePermission = permission ?? currentNavItem?.permission;
  const required = routePermission ? (Array.isArray(routePermission) ? routePermission : [routePermission]) : [];
  const allowed = required.length === 0 || required.some((code) => permissions.includes(code));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground h-full select-none">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
          <BrandBlock />
        </div>
        <ScrollArea className="flex-1 min-h-0 px-3 py-4">
          <NavigationList pathname={pathname} />
        </ScrollArea>
        <div className="shrink-0 border-t border-border p-3 bg-muted/20">
          <UserFooter />
        </div>
      </aside>

      {/* 2. Mobile / Tablet Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-border"
          showCloseButton={false}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
            <BrandBlock />
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
          <ScrollArea className="flex-1 min-h-0 px-3 py-4">
            <NavigationList pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
          </ScrollArea>
          <div className="shrink-0 border-t border-border p-3 bg-muted/20">
            <UserFooter onLogout={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* 3. Main Column */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-2 sm:h-16 sm:px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3" data-tour="navigation-entry">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
              <span>Hệ thống</span>
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
            </div>
            <span className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
              {pageTitle}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2 lg:gap-3">
            {permissions.includes("facility.read") && <FacilityScopeMenu />}
            <HealthPopover />

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event(START_ADMIN_TOUR_EVENT))}
              className="h-9 gap-1.5 px-2.5 sm:px-3 text-xs font-medium rounded-xl border-border bg-card/90 text-foreground hover:bg-accent transition-colors shrink-0"
              title="Bắt đầu hướng dẫn sử dụng hệ thống"
            >
              <BookOpenCheck className="size-3.5 text-primary" />
              <span className="hidden lg:inline">Bắt đầu hướng dẫn</span>
            </Button>

            <div className="shrink-0" data-tour="quick-search">
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
                className="size-9 text-muted-foreground hover:text-foreground xl:hidden"
                title="Tìm kiếm nhanh (⌘K)"
              >
                <Search className="size-4" />
              </Button>
            </div>

            <NotificationsPopover />

            <div className="hidden sm:block">
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
                  {[
                    { key: "light", label: "Sáng (Light)", icon: Sun },
                    { key: "dark", label: "Tối (Dark)", icon: Moon },
                    { key: "system", label: "Hệ thống (Auto)", icon: Monitor },
                  ].map((opt) => (
                    <DropdownMenuItem
                      key={opt.key}
                      onClick={() => setTheme(opt.key)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="size-3.5 text-muted-foreground" />
                        <span>{opt.label}</span>
                      </div>
                      {theme === opt.key && <Check className="size-3.5 text-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6">
          <div
            className="mx-auto max-w-7xl space-y-4 sm:space-y-6"
            data-tour="page-content"
            data-tour-page={pathname}
          >
            {allowed ? (
              children
            ) : (
              <Card className="mx-auto mt-10 max-w-md gap-3 p-8 text-center">
                <ShieldX className="mx-auto size-7 text-muted-foreground" />
                <p className="font-heading text-base font-bold text-foreground">Không có quyền truy cập</p>
                <p className="text-xs text-muted-foreground">
                  Tài khoản của bạn chưa được cấp quyền cho trang này. Liên hệ quản trị viên để được phân quyền.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Gõ để tìm trang (ví dụ: kho, nguyên liệu, yêu cầu)..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>
          <CommandGroup heading="Điều hướng nhanh">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const visibleChildren = item.children?.filter((child) => canSeeChild(child, permissions)) ?? [];
              return (
                <React.Fragment key={item.href}>
                  <CommandItem
                    onSelect={() => {
                      setOpenCommand(false);
                      router.push(item.href);
                    }}
                  >
                    <Icon className="mr-2 size-4 text-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </CommandItem>
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <CommandItem
                        key={child.href}
                        onSelect={() => {
                          setOpenCommand(false);
                          router.push(child.href);
                        }}
                        className="pl-6"
                      >
                        <ChildIcon className="mr-2 size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{item.label} &rarr;</span>
                        <span className="font-medium text-foreground ml-1">{child.label}</span>
                      </CommandItem>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Thao tác nhanh">
            {permissions.includes("request.create") && (
              <CommandItem
                onSelect={() => {
                  setOpenCommand(false);
                  router.push("/requests?action=create");
                }}
              >
                <Sparkles className="mr-2 size-4 text-foreground" />
                <span>Tạo yêu cầu cấp hàng mới</span>
              </CommandItem>
            )}
            {permissions.includes("ingredient.manage") && (
              <CommandItem
                onSelect={() => {
                  setOpenCommand(false);
                  router.push("/catalog?action=create-ingredient");
                }}
              >
                <Sparkles className="mr-2 size-4 text-foreground" />
                <span>Thêm nguyên liệu mới</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
