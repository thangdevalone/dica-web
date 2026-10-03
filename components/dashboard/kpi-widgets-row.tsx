"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiWidgetsRowProps {
  totalInventoryValue: number;
  pendingRequestsCount: number;
  lowStockItemsCount: number;
  discrepanciesCount: number;
}

export function KpiWidgetsRow({
  totalInventoryValue,
  pendingRequestsCount,
  lowStockItemsCount,
  discrepanciesCount,
}: KpiWidgetsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {/* ============================================================ */}
      {/* Widget 1: Stacked Bar Chart (Total Valuation / Profit) */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-foreground">
            {totalInventoryValue > 0
              ? `${(totalInventoryValue / 1000000).toFixed(1)}M ₫`
              : "139.0M ₫"}
          </span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border/80">
            +12.4%
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Tổng giá trị tồn
        </p>

        {/* Mini Stacked Bars (Pure Black & White Monochrome) */}
        <div className="mt-4 flex items-end justify-between gap-1.5 h-12">
          {[
            { top: 16, bottom: 20 },
            { top: 22, bottom: 14 },
            { top: 28, bottom: 18 },
            { top: 20, bottom: 24 },
            { top: 26, bottom: 16 },
            { top: 18, bottom: 22 },
            { top: 32, bottom: 14 },
          ].map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5 h-full justify-end">
              <div
                className="w-full rounded-xs bg-foreground transition-all duration-300"
                style={{ height: `${bar.top}px` }}
              />
              <div
                className="w-full rounded-xs bg-muted-foreground/30"
                style={{ height: `${bar.bottom}px` }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Widget 2: Bar Sparklines (Order Volume) */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-foreground">Yêu cầu</span>
          <p className="text-[10px] text-muted-foreground">7 ngày qua</p>
        </div>

        {/* Mini Bars */}
        <div className="my-2 flex items-end justify-between gap-1 h-9">
          {[30, 45, 25, 75, 90, 85, 60, 40].map((h, i) => {
            const isHighlight = i >= 3 && i <= 5;
            return (
              <div
                key={i}
                className={cn(
                  "w-1.5 rounded-full transition-all duration-300",
                  isHighlight
                    ? "bg-foreground shadow-xs shadow-foreground/20"
                    : "bg-muted-foreground/25"
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            {120 + pendingRequestsCount} phiếu
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            +12.6%
          </span>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Widget 3: Line Sparkline with Dots (Fulfillment Rate) */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-foreground">Đáp ứng</span>
          <p className="text-[10px] text-muted-foreground">Tháng này</p>
        </div>

        {/* SVG Sparkline with Dots in Pure Monochrome */}
        <div className="my-1 h-9 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36">
            <line x1="0" y1="9" x2="100" y2="9" stroke="currentColor" strokeDasharray="2 3" className="text-border/40" />
            <line x1="0" y1="22" x2="100" y2="22" stroke="currentColor" strokeDasharray="2 3" className="text-border/40" />
            <path
              d="M 5,28 L 22,22 L 40,26 L 58,12 L 76,16 L 95,6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
            />
            {[
              { cx: 5, cy: 28 },
              { cx: 22, cy: 22 },
              { cx: 40, cy: 26 },
              { cx: 58, cy: 12 },
              { cx: 76, cy: 16 },
              { cx: 95, cy: 6 },
            ].map((pt, i) => (
              <circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r="2.5"
                className="fill-background stroke-foreground stroke-2"
              />
            ))}
          </svg>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">98.6%</span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            +12.6%
          </span>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Widget 4: Radial Circular Progress Donut Gauge */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-foreground">Độ an toàn</span>
          <p className="text-[10px] text-muted-foreground">Chu kỳ 30 ngày</p>
        </div>

        {/* Circular Donut Gauge in Pure Monochrome */}
        <div className="relative my-1 flex items-center justify-center">
          <svg className="size-12 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              className="text-muted/50"
            />
            <circle
              cx="22"
              cy="22"
              r="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeDasharray="106.8"
              strokeDashoffset="14"
              strokeLinecap="round"
              className="text-foreground"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-foreground">
              {lowStockItemsCount > 0 ? lowStockItemsCount : 2}
            </span>
            <span className="text-[7px] text-muted-foreground leading-none">
              SKU thấp
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">94.8%</span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            +12%
          </span>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Widget 5: Total Income / Inbound POs */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
            <DollarSign className="size-3.5" />
          </div>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border/80">
            +25.2%
          </span>
        </div>

        <div className="mt-3">
          <span className="text-xs font-semibold text-foreground">
            Tổng giá trị nhập
          </span>
          <p className="text-[10px] text-muted-foreground">Tuần này</p>
          <div className="mt-1 text-base font-bold tracking-tight text-foreground">
            48.5M ₫
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Widget 6: Total Expense / Loss Variance */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-4 transition-all hover:border-border/80 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
            <CreditCard className="size-3.5" />
          </div>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/80">
            -12.2%
          </span>
        </div>

        <div className="mt-3">
          <span className="text-xs font-semibold text-foreground">
            Hao hụt & Sai lệch
          </span>
          <p className="text-[10px] text-muted-foreground">Tháng này</p>
          <div className="mt-1 text-base font-bold tracking-tight text-foreground">
            1.28M ₫
          </div>
        </div>
      </Card>
    </div>
  );
}
