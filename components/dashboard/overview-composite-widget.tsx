"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  DollarSign,
  Wallet,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BarDataPoint {
  label: string;
  value: number;
  displayValue: string;
  isPeak?: boolean;
}

const WEEKLY_TRANSACTIONS: BarDataPoint[] = [
  { label: "T2", value: 38, displayValue: "38K" },
  { label: "T3", value: 52, displayValue: "52K", isPeak: true },
  { label: "T4", value: 32, displayValue: "32K" },
  { label: "T5", value: 12, displayValue: "12K" },
  { label: "T6", value: 35, displayValue: "35K" },
  { label: "T7", value: 28, displayValue: "28K" },
  { label: "CN", value: 33, displayValue: "33K" },
  { label: "TB", value: 25, displayValue: "25K" },
];

export function OverviewCompositeWidget() {
  return (
    <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* Left Section: Total Transaction - Weekly Overview (8 cols)  */}
        {/* ============================================================ */}
        <div className="p-6 lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Tổng Lượt Giao Dịch Kho
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Luân chuyển điều phối hàng tuần (Weekly overview)
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-4" />
            </Button>
          </div>

          {/* Prominent Bar Chart in Pure Black & White Monochrome */}
          <div className="mt-8 flex items-end justify-between gap-2 sm:gap-4 h-56 pt-6 pb-2 px-2">
            {WEEKLY_TRANSACTIONS.map((item, idx) => {
              const heightPercent = (item.value / 55) * 100;
              return (
                <div
                  key={idx}
                  className="flex flex-1 flex-col items-center justify-end h-full gap-2 group"
                >
                  {/* Value on top of bar */}
                  <span
                    className={cn(
                      "text-[11px] font-semibold transition-colors duration-200",
                      item.isPeak
                        ? "text-foreground font-bold"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.displayValue}
                  </span>

                  {/* Rounded Bar */}
                  <div className="w-full max-w-[42px] h-full flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-xl transition-all duration-300",
                        item.isPeak
                          ? "bg-foreground shadow-sm shadow-foreground/20"
                          : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Right Section: Report & Performance (4 cols)                 */}
        {/* ============================================================ */}
        <div className="p-6 lg:col-span-5 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between bg-muted/15">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  Báo Cáo Đối Soát
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Giao dịch tháng qua: <span className="font-semibold text-foreground">234.5M ₫</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="size-4" />
              </Button>
            </div>

            {/* Two Stat Cards Side by Side in Pure Monochrome */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {/* Box 1: Inbound / Income */}
              <div className="rounded-xl border border-border/80 bg-card p-3 flex flex-col justify-between">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground mb-2">
                  <DollarSign className="size-3.5" />
                </div>
                <span className="text-[11px] text-muted-foreground">Tuần này</span>
                <span className="text-sm font-bold text-foreground mt-0.5">
                  +82.46%
                </span>
              </div>

              {/* Box 2: Outbound / Expense */}
              <div className="rounded-xl border border-border/80 bg-card p-3 flex flex-col justify-between">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground mb-2">
                  <Wallet className="size-3.5" />
                </div>
                <span className="text-[11px] text-muted-foreground">Tuần này</span>
                <span className="text-sm font-bold text-muted-foreground mt-0.5">
                  -24.8%
                </span>
              </div>
            </div>
          </div>

          {/* Performance & Action Button in Pure Monochrome */}
          <div className="mt-8 pt-4 border-t border-border/60">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Chỉ số hoàn thành kế hoạch
                </p>
                <div className="text-2xl font-black tracking-tight text-foreground">
                  +94.13%
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                <ArrowUpRight className="size-3.5" /> Hoàn thành
              </span>
            </div>

            <Button
              className="w-full h-9 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs shadow-xs"
              onClick={() => {
                window.location.href = "/delivery";
              }}
            >
              <FileText className="mr-1.5 size-3.5" />
              Xem Báo Cáo Chi Tiết
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
