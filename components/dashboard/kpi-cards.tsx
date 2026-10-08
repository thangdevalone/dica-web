"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  PackageSearch,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/api/types";
import { formatCompact, formatMoney, formatQty } from "@/lib/num";
import { cn } from "@/lib/utils";

function MiniBars({ values, highlightLast = true }: { values: number[]; highlightLast?: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-9 items-end justify-between gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "w-full rounded-full transition-all duration-300",
            highlightLast && i === values.length - 1
              ? "bg-foreground"
              : v > 0
                ? "bg-muted-foreground/40"
                : "bg-muted-foreground/15"
          )}
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

function KpiCard({
  title,
  subtitle,
  value,
  footer,
  icon: Icon,
  href,
  children,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: React.ReactNode;
  tone?: "default" | "alert";
}) {
  const body = (
    <Card
      className={cn(
        "h-full gap-0 rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-foreground/30 hover:shadow-xs",
        tone === "alert" && "border-destructive/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted text-foreground",
            tone === "alert" && "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-2 text-lg font-bold tracking-tight text-foreground">{value}</div>
      {children && <div className="mt-2">{children}</div>}
      {footer && <div className="mt-2 text-[10px] text-muted-foreground">{footer}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function KpiCards({ summary }: { summary: DashboardSummary }) {
  const { inventory, requests, orders, delivery, movements, period } = summary;
  const requestSeries = requests?.series.map((p) => p.created) ?? [];
  const movementSeries = movements?.series.map((p) => p.entries) ?? [];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {inventory && (
        <KpiCard
          title="Giá trị tồn kho"
          subtitle="Ước tính theo giá tham chiếu"
          value={`${formatCompact(inventory.estimated_value)} ₫`}
          icon={Wallet}
          href="/inventory"
          footer={
            <>
              Đang trung chuyển: <span className="font-semibold text-foreground">{formatMoney(inventory.in_transit_value)}</span>
              {inventory.unpriced_rows > 0 && <> · {inventory.unpriced_rows} dòng chưa có giá</>}
            </>
          }
        />
      )}
      {requests && (
        <KpiCard
          title="Yêu cầu chờ duyệt"
          subtitle={`${period.days} ngày qua: ${requests.created_in_period} phiếu mới`}
          value={`${requests.by_status.SUBMITTED} phiếu`}
          icon={ClipboardList}
          href="/requests"
          tone={requests.overdue > 0 ? "alert" : "default"}
          footer={requests.overdue > 0 ? `${requests.overdue} phiếu quá hạn cần xử lý` : "Không có phiếu quá hạn"}
        >
          <MiniBars values={requestSeries} />
        </KpiCard>
      )}
      {orders && (
        <KpiCard
          title="Đơn đang thực hiện"
          subtitle={`Nhà cung cấp: ${orders.by_source_type.SUPPLIER} · Kho nội bộ: ${orders.by_source_type.STOCK}`}
          value={`${orders.open} đơn`}
          icon={ShoppingCart}
          href="/orders"
          footer={
            <>
              Tỷ lệ đáp ứng {period.days} ngày:{" "}
              <span className="font-semibold text-foreground">
                {orders.period.fulfillment_rate != null ? `${orders.period.fulfillment_rate}%` : "—"}
              </span>
            </>
          }
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${Math.min(orders.period.fulfillment_rate ?? 0, 100)}%` }}
            />
          </div>
        </KpiCard>
      )}
      {delivery && (
        <KpiCard
          title="Chênh lệch giao nhận"
          subtitle="Đang mở cần xử lý"
          value={delivery.open_discrepancies != null ? `${delivery.open_discrepancies} ca` : "—"}
          icon={AlertTriangle}
          href="/delivery"
          tone={(delivery.open_discrepancies ?? 0) > 0 ? "alert" : "default"}
          footer={`Phiếu nhận chờ duyệt thừa: ${delivery.receipts_pending_review} · Nháp xuất: ${delivery.dispatches_draft}`}
        />
      )}
      {inventory && (
        <KpiCard
          title="Cảnh báo tồn thấp"
          subtitle={`${inventory.threshold_rules} quy tắc ngưỡng đang bật`}
          value={`${inventory.low_stock_total} mặt hàng`}
          icon={PackageSearch}
          href="/inventory"
          tone={inventory.low_stock_total > 0 ? "alert" : "default"}
          footer={`${inventory.zero_stock_rows} dòng tồn bằng 0 / ${inventory.balance_rows} dòng tồn`}
        />
      )}
      {movements && (
        <KpiCard
          title="Biến động kho"
          subtitle={`${movements.entries_total} bút toán · ${period.days} ngày`}
          value={
            <span className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center gap-0.5">
                <ArrowDownRight className="size-3.5 text-emerald-500" />
                {formatQty(movements.inbound_total)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                <ArrowUpRight className="size-3.5" />
                {formatQty(movements.outbound_total)}
              </span>
            </span>
          }
          icon={ArrowDownRight}
          href="/inventory?tab=ledger"
        >
          <MiniBars values={movementSeries} />
        </KpiCard>
      )}
    </div>
  );
}

export function hasAnyKpi(summary: DashboardSummary) {
  return Boolean(
    summary.inventory || summary.requests || summary.orders || summary.delivery || summary.movements
  );
}
