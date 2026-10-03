"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/formatters";

const VIBRANT_CHART_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

interface CategoryDonutChartProps {
  data: { name: string; value: number }[];
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader>
        <CardTitle className="font-heading text-base font-bold">
          Phân Bổ Tồn Kho Theo Nhóm
        </CardTitle>
        <CardDescription>Tỷ trọng giá trị theo danh mục nguyên liệu</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={VIBRANT_CHART_COLORS[index % VIBRANT_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) => formatCurrency(Number(val))}
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "12px",
                color: "#fff",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
