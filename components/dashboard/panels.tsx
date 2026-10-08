"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardSummary } from "@/lib/api/types";
import { FACILITY_TYPE_LABELS, SOURCE_TYPE_LABELS } from "@/constants/labels";
import { formatCompact, formatQty, num } from "@/lib/num";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function Panel({
  title,
  description,
  href,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("h-full gap-3 rounded-2xl border-border bg-card/90 p-5 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {href && (
          <Button asChild variant="ghost" size="xs" className="text-[11px] text-muted-foreground">
            <Link href={href}>
              Xem tất cả <ArrowRight className="size-3" />
            </Link>
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{text}</p>;
}

export function PendingRequestsPanel({ summary }: { summary: DashboardSummary }) {
  const requests = summary.requests;
  if (!requests) return null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Panel
      title="Yêu cầu chờ duyệt"
      description={`${requests.by_status.SUBMITTED} phiếu đang chờ · ${requests.overdue} quá hạn`}
      href="/requests"
    >
      {requests.pending.length === 0 ? (
        <Empty text="Không có yêu cầu nào đang chờ duyệt." />
      ) : (
        <div className="divide-y divide-border/60">
          {requests.pending.slice(0, 6).map((r) => {
            const overdue = r.required_date.slice(0, 10) < today;
            return (
              <Link
                key={r.id}
                href={`/requests?id=${r.id}`}
                className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    <span className="font-mono">{r.code}</span> · {r.department.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {r.facility.name} · {r.line_count} dòng · {r.created_by.displayName}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                    overdue ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"
                  )}
                >
                  <Clock className="size-3" />
                  {formatDate(r.required_date)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function RecentOrdersPanel({ summary }: { summary: DashboardSummary }) {
  const orders = summary.orders;
  if (!orders) return null;
  return (
    <Panel title="Đơn cấp hàng gần đây" description={`${orders.total} đơn · ${orders.open} đang mở`} href="/orders">
      {orders.recent.length === 0 ? (
        <Empty text="Chưa có đơn cấp hàng nào." />
      ) : (
        <div className="space-y-3">
          {orders.recent.slice(0, 6).map((o) => (
            <Link key={o.id} href={`/orders?id=${o.id}`} className="block space-y-1.5 rounded-lg p-1 transition-colors hover:bg-muted/40">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs">
                  <span className="font-mono font-semibold text-foreground">{o.code}</span>{" "}
                  <span className="text-muted-foreground">
                    {o.source_type === "SUPPLIER" ? o.supplier?.name : o.source_stock_location?.name} →{" "}
                    {o.destination_stock_location.name}
                  </span>
                </p>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(o.progress, 100)}%` }} />
                </div>
                <span className="w-10 text-right text-[10px] font-semibold text-muted-foreground">{o.progress}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {SOURCE_TYPE_LABELS[o.source_type]} · {formatDateTime(o.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function LowStockPanel({ summary }: { summary: DashboardSummary }) {
  const inventory = summary.inventory;
  if (!inventory) return null;
  return (
    <Panel
      title="Tồn kho dưới ngưỡng"
      description={
        inventory.threshold_rules > 0
          ? `${inventory.low_stock_total} mặt hàng dưới ngưỡng cảnh báo`
          : "Chưa có mức cảnh báo — cấu hình tại iPOS & Định lượng › Cảnh báo tự động"
      }
      href="/inventory"
    >
      {inventory.low_stock.length === 0 ? (
        <Empty text="Không có mặt hàng nào dưới ngưỡng." />
      ) : (
        <div className="divide-y divide-border/60">
          {inventory.low_stock.slice(0, 6).map((row) => {
            const ratio = num(row.threshold) > 0 ? Math.min(num(row.quantity) / num(row.threshold), 1) : 0;
            return (
              <div key={`${row.stock_location_id}-${row.ingredient_id}`} className="space-y-1 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-foreground">{row.ingredient_name}</span>
                  <span className="shrink-0 font-semibold text-destructive">
                    {formatQty(row.quantity)} / {formatQty(row.threshold, row.unit_code)}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-destructive" style={{ width: `${ratio * 100}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {row.stock_location_name} · {row.facility_name}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function OperationsPanel({ summary }: { summary: DashboardSummary }) {
  const ops = summary.operations;
  const transfers = summary.transfers;
  const delivery = summary.delivery;
  if (!ops && !transfers && !delivery) return null;
  const items: { label: string; value: number | null | undefined; href: string }[] = [
    { label: "Điều chỉnh nháp", value: ops?.adjustments_draft, href: "/inventory?tab=adjustments" },
    { label: "Điều chỉnh chờ cập nhật tồn", value: ops?.adjustments_awaiting_post, href: "/inventory?tab=adjustments" },
    { label: "Phiếu kiểm kê đang mở", value: ops?.stocktakes_open, href: "/inventory?tab=stocktakes" },
    { label: "Báo hỏng chờ xác nhận", value: ops?.damage_awaiting_confirm, href: "/inventory?tab=damage" },
    { label: "Điều chuyển chờ duyệt", value: transfers?.by_status.SUBMITTED, href: "/transfers" },
    { label: "Phiếu xuất nháp", value: delivery?.dispatches_draft, href: "/delivery" },
    { label: "Phiếu nhận nháp", value: delivery?.receipts_draft, href: "/delivery?tab=receipts" },
    { label: "Chênh lệch thiếu dữ liệu", value: ops?.variance_incomplete, href: "/operations?tab=variances" },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <Panel title="Việc cần xử lý" description="Chứng từ đang chờ thao tác tiếp theo">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "rounded-xl border border-border/70 p-2.5 transition-colors hover:border-foreground/30 hover:bg-muted/30",
              (item.value ?? 0) > 0 && "bg-muted/30"
            )}
          >
            <p className="text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">{item.label}</p>
          </Link>
        ))}
      </div>
      {ops?.top_variances && ops.top_variances.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Chênh lệch lớn nhất</p>
          {ops.top_variances.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-medium text-foreground">{v.ingredient.name}</span>{" "}
                <span className="text-[10px] text-muted-foreground">{v.stock_location.name}</span>
              </span>
              <span className={cn("shrink-0 font-semibold", num(v.variance_quantity) < 0 ? "text-destructive" : "text-foreground")}>
                {v.variance_rate != null ? `${num(v.variance_rate).toFixed(1)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function FacilitiesPanel({ summary }: { summary: DashboardSummary }) {
  if (summary.facilities.length === 0) return null;
  return (
    <Panel title="Tình hình theo cơ sở" description="Giá trị tồn, cảnh báo và chứng từ đang mở" href="/organization">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/70 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2 font-semibold">Cơ sở</th>
              <th className="py-2 pr-2 text-right font-semibold">Kho</th>
              <th className="py-2 pr-2 text-right font-semibold">Giá trị tồn</th>
              <th className="py-2 pr-2 text-right font-semibold">Dưới ngưỡng</th>
              <th className="py-2 pr-2 text-right font-semibold">YC chờ duyệt</th>
              <th className="py-2 text-right font-semibold">Đơn đến</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {summary.facilities.map((f) => (
              <tr key={f.id} className={cn(!f.active && "opacity-60")}>
                <td className="py-2 pr-2">
                  <p className="font-semibold text-foreground">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-mono">{f.code}</span> · {FACILITY_TYPE_LABELS[f.type] ?? f.type}
                  </p>
                </td>
                <td className="py-2 pr-2 text-right">{f.stock_locations}</td>
                <td className="py-2 pr-2 text-right font-semibold">{formatCompact(f.stock_value)} ₫</td>
                <td className={cn("py-2 pr-2 text-right", f.low_stock > 0 && "font-semibold text-destructive")}>{f.low_stock}</td>
                <td className="py-2 pr-2 text-right">{f.pending_requests}</td>
                <td className="py-2 text-right">{f.open_inbound_orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo",
  update: "Cập nhật",
  submit: "Gửi duyệt",
  approve: "Duyệt",
  reject: "Từ chối",
  cancel: "Hủy",
  post: "Cập nhật tồn kho",
  login: "Đăng nhập",
};

export function ActivityPanel({ summary }: { summary: DashboardSummary }) {
  const events = summary.recent_activity;
  if (!events) return null;
  return (
    <Panel title="Hoạt động gần đây" description="Nhật ký thao tác toàn tổ chức" href="/system">
      {events.length === 0 ? (
        <Empty text="Chưa có hoạt động nào." />
      ) : (
        <ol className="space-y-3">
          {events.map((e) => {
            const verb = e.action.split(".").pop() ?? e.action;
            return (
              <li key={e.id} className="flex gap-2.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                  <History className="size-3 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-foreground">
                    <span className="font-semibold">{e.actor?.displayName ?? "Hệ thống"}</span>{" "}
                    {ACTION_LABELS[verb] ?? e.action} <span className="text-muted-foreground">{e.resource_type}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">{formatDateTime(e.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
