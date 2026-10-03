"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, Activity } from "lucide-react";

const WEEKLY_DATA = [
  { day: "Thứ 2", xuat: 24, nhap: 38, hieuSuat: 82 },
  { day: "Thứ 3", xuat: 30, nhap: 28, hieuSuat: 88 },
  { day: "Thứ 4", xuat: 42, nhap: 45, hieuSuat: 91 },
  { day: "Thứ 5", xuat: 36, nhap: 32, hieuSuat: 85 },
  { day: "Thứ 6", xuat: 58, nhap: 62, hieuSuat: 95 },
  { day: "Thứ 7", xuat: 72, nhap: 50, hieuSuat: 98 },
  { day: "Chủ nhật", xuat: 65, nhap: 40, hieuSuat: 94 },
];

export function TransferFlowChart() {
  const [chartType, setChartType] = React.useState<"bar" | "line" | "area">("area");

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-heading text-base font-bold">
              Luồng Luân Chuyển Hàng Hóa (7 Ngày)
            </CardTitle>
            <CardDescription>
              So sánh số lượt xuất kho chi nhánh, nhập kho NCC và chỉ số luân chuyển
            </CardDescription>
          </div>

          {/* Chart Type Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs">
            <Button
              variant={chartType === "area" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() => setChartType("area")}
            >
              <Activity className="size-3 text-blue-500" />
              <span>Vùng (Area)</span>
            </Button>
            <Button
              variant={chartType === "line" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() => setChartType("line")}
            >
              <TrendingUp className="size-3 text-emerald-500" />
              <span>Đường (Line)</span>
            </Button>
            <Button
              variant={chartType === "bar" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="size-3 text-violet-500" />
              <span>Cột (Bar)</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorXuat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorNhap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area
                type="monotone"
                dataKey="xuat"
                name="Xuất cho Chi Nhánh (Lượt)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorXuat)"
              />
              <Area
                type="monotone"
                dataKey="nhap"
                name="Nhập từ NCC (Lượt)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorNhap)"
              />
            </AreaChart>
          ) : chartType === "line" ? (
            <LineChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="xuat"
                name="Xuất cho Chi Nhánh (Lượt)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="nhap"
                name="Nhập từ NCC (Lượt)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="hieuSuat"
                name="Hiệu Suất Cung Ứng (%)"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#8b5cf6" }}
              />
            </LineChart>
          ) : (
            <BarChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar
                dataKey="xuat"
                name="Xuất cho Chi Nhánh (Lượt)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="nhap"
                name="Nhập từ NCC (Lượt)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
