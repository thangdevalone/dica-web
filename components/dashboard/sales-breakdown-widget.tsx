"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Warehouse,
  Store,
  Truck,
} from "lucide-react";

interface BreakdownItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const BREAKDOWN_ITEMS: BreakdownItem[] = [
  {
    icon: Warehouse,
    label: "Kho Tổng & Bếp Sơ Chế",
    value: "78.5M ₫",
    change: "+12.6%",
    isPositive: true,
  },
  {
    icon: Store,
    label: "Chi Nhánh F&B Nhà Hàng",
    value: "45.2M ₫",
    change: "+6.8%",
    isPositive: true,
  },
  {
    icon: Truck,
    label: "Hàng Đang Trung Chuyển",
    value: "15.3M ₫",
    change: "-4.2%",
    isPositive: false,
  },
];

export function SalesBreakdownWidget() {
  return (
    <Card className="rounded-2xl border-border bg-card/90 p-6 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header with Title & Details Button in Pure Monochrome */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <TrendingUp className="size-3.5" />
            </div>
            <span className="text-sm font-bold text-foreground">
              Tổng Luân Chuyển
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-lg px-2.5 text-[11px] font-medium border-border/80 hover:bg-muted"
            onClick={() => {
              window.location.href = "/inventory";
            }}
          >
            Chi tiết
          </Button>
        </div>

        {/* Big Total Value & Trend */}
        <div className="mt-4 flex items-baseline gap-2.5">
          <div className="text-2xl font-black tracking-tight text-foreground">
            139.000.000 ₫
          </div>
          <span className="rounded-md bg-muted border border-border/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
            +8.5%
          </span>
        </div>

        {/* Sub-breakdown rows in Monochrome */}
        <div className="mt-5 space-y-3">
          {BREAKDOWN_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                    <Icon className="size-3" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {item.value}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {item.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sparkline in Pure Black & White Monochrome */}
      <div className="mt-6 pt-2">
        <div className="relative h-20 w-full text-foreground">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 300 70"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradientMono" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Vertical drop bars in muted tone */}
            {[
              { x: 20, h: 25 },
              { x: 50, h: 32 },
              { x: 80, h: 42 },
              { x: 110, h: 28 },
              { x: 140, h: 36 },
              { x: 170, h: 48 },
              { x: 200, h: 30 },
              { x: 230, h: 56 },
              { x: 260, h: 62 },
              { x: 290, h: 58 },
            ].map((bar, i) => (
              <rect
                key={i}
                x={bar.x - 3}
                y={70 - bar.h}
                width="6"
                height={bar.h}
                rx="3"
                className="fill-muted-foreground/20"
              />
            ))}

            {/* Smooth Area Fill in monochrome gradient */}
            <path
              d="M 10,50 Q 50,30 90,45 T 170,35 T 240,15 L 290,12 L 290,70 L 10,70 Z"
              fill="url(#areaGradientMono)"
            />

            {/* Smooth Top Line in pure foreground */}
            <path
              d="M 10,50 Q 50,30 90,45 T 170,35 T 240,15 L 290,12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Timestamps */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
        </div>
      </div>
    </Card>
  );
}
