"use client";

import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardSummary } from "@/lib/api/types";
import { LEDGER_ENTRY_LABELS } from "@/constants/labels";
import { formatCompact, formatMoney, formatQty, num } from "@/lib/num";

function dayLabel(key: string) {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

const movementConfig = {
  inbound: { label: "Nhập kho", color: "var(--foreground)" },
  outbound: { label: "Xuất kho", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const requestConfig = {
  created: { label: "Tạo mới", color: "var(--foreground)" },
  approved: { label: "Đã duyệt", color: "var(--chart-2)" },
  rejected: { label: "Từ chối", color: "var(--destructive)" },
} satisfies ChartConfig;

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
      {text}
    </div>
  );
}

export function ActivityChart({ summary }: { summary: DashboardSummary }) {
  const [mode, setMode] = React.useState<"movements" | "requests">(
    summary.movements ? "movements" : "requests"
  );
  const movementData =
    summary.movements?.series.map((p) => ({
      day: dayLabel(p.date),
      inbound: num(p.inbound),
      outbound: num(p.outbound),
    })) ?? [];
  const requestData =
    summary.requests?.series.map((p) => ({ day: dayLabel(p.date), ...p })) ?? [];

  return (
    <Card className="h-full gap-4 rounded-2xl border-border bg-card/90 p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {mode === "movements" ? "Luân chuyển kho theo ngày" : "Yêu cầu cấp hàng theo ngày"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.period.days} ngày gần nhất · múi giờ {summary.time_zone}
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="bg-muted/70 p-1">
            {summary.movements && (
              <TabsTrigger value="movements" className="text-xs">
                Nhập / Xuất
              </TabsTrigger>
            )}
            {summary.requests && (
              <TabsTrigger value="requests" className="text-xs">
                Yêu cầu
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {mode === "movements" ? (
        movementData.some((d) => d.inbound || d.outbound) ? (
          <ChartContainer config={movementConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={movementData} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-inbound)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-inbound)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-outbound)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-outbound)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatCompact(v)} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area dataKey="inbound" type="monotone" stroke="var(--color-inbound)" fill="url(#fillInbound)" strokeWidth={2} />
              <Area dataKey="outbound" type="monotone" stroke="var(--color-outbound)" fill="url(#fillOutbound)" strokeWidth={2} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyChart text="Chưa có giao dịch nhập hoặc xuất kho trong khoảng thời gian này." />
        )
      ) : requestData.some((d) => d.created || d.approved || d.rejected) ? (
        <ChartContainer config={requestConfig} className="aspect-auto h-64 w-full">
          <BarChart data={requestData} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="created" fill="var(--color-created)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="approved" fill="var(--color-approved)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="rejected" fill="var(--color-rejected)" radius={[6, 6, 0, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      ) : (
        <EmptyChart text="Chưa có yêu cầu nào trong khoảng thời gian này." />
      )}

      {mode === "movements" && summary.movements && summary.movements.by_type.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summary.movements.by_type.slice(0, 8).map((t) => (
            <div key={t.entry_type} className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
              <p className="truncate text-[10px] text-muted-foreground">
                {LEDGER_ENTRY_LABELS[t.entry_type] ?? t.entry_type}
              </p>
              <p className="text-xs font-semibold text-foreground">
                {num(t.inbound) > 0 && `+${formatQty(t.inbound)}`}
                {num(t.inbound) > 0 && num(t.outbound) > 0 && " / "}
                {num(t.outbound) > 0 && `-${formatQty(t.outbound)}`}
              </p>
              <p className="text-[10px] text-muted-foreground">{t.entries} bút toán</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const GROUP_COLORS = [
  "var(--foreground)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function InventoryBreakdown({ summary }: { summary: DashboardSummary }) {
  const inventory = summary.inventory;
  if (!inventory) return null;
  const groups = inventory.by_group
    .map((g, i) => ({ name: g.name, value: num(g.value), rows: g.rows, fill: GROUP_COLORS[i % GROUP_COLORS.length] }))
    .filter((g) => g.value > 0);
  const config = Object.fromEntries(groups.map((g) => [g.name, { label: g.name, color: g.fill }])) as ChartConfig;
  const total = groups.reduce((sum, g) => sum + g.value, 0);

  return (
    <Card className="h-full gap-4 rounded-2xl border-border bg-card/90 p-5 shadow-xs">
      <div>
        <h3 className="text-base font-bold tracking-tight text-foreground">Cơ cấu giá trị tồn</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tổng: <span className="font-semibold text-foreground">{formatMoney(inventory.estimated_value)}</span>
        </p>
      </div>
      {groups.length > 0 ? (
        <ChartContainer config={config} className="mx-auto aspect-square h-44">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
            <Pie data={groups} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} strokeWidth={2} paddingAngle={2}>
              {groups.map((g) => (
                <Cell key={g.name} fill={g.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      ) : (
        <EmptyChart text="Chưa có giá trị tồn (thiếu giá tham chiếu hoặc kho trống)." />
      )}
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: g.fill }} />
              <span className="truncate text-foreground">{g.name}</span>
              <span className="text-[10px] text-muted-foreground">{g.rows} dòng</span>
            </span>
            <span className="shrink-0 font-semibold text-foreground">
              {total > 0 ? `${((g.value / total) * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
      {inventory.top_items.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Giá trị tồn cao nhất
          </p>
          {inventory.top_items.slice(0, 5).map((item) => (
            <div key={item.ingredient_id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-medium text-foreground">{item.name}</span>{" "}
                <span className="text-[10px] text-muted-foreground">{formatQty(item.quantity, item.unit_code)}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground">{formatCompact(item.value)} ₫</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
