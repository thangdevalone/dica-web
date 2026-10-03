"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ClipboardList, AlertTriangle, Truck, TrendingUp } from "lucide-react";

interface DashboardKpisProps {
  totalInventoryValue: number;
  pendingRequestsCount: number;
  unapprovedRequestsCount: number;
  lowStockItemsCount: number;
  discrepanciesCount: number;
}

export function DashboardKpis({
  totalInventoryValue,
  pendingRequestsCount,
  unapprovedRequestsCount,
  lowStockItemsCount,
  discrepanciesCount,
}: DashboardKpisProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Valuation */}
      <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            TỔNG GIÁ TRỊ TỒN KHO
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <DollarSign className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {totalInventoryValue.toLocaleString("vi-VN")} ₫
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+12.4% so với kỳ trước</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pending Requests */}
      <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            YÊU CẦU CẦN XỬ LÝ
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <ClipboardList className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {pendingRequestsCount}{" "}
            <span className="text-sm font-normal text-muted-foreground">phiếu</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {unapprovedRequestsCount} phiếu chờ duyệt từ chi nhánh
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Low Stock Alerts */}
      <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            CẢNH BÁO TỒN THẤP
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <AlertTriangle className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {lowStockItemsCount}{" "}
            <span className="text-sm font-normal text-muted-foreground">mặt hàng</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Dưới ngưỡng tồn an toàn cần bổ sung
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Discrepancies */}
      <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            SAI LỆCH GIAO NHẬN
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <Truck className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {discrepanciesCount}{" "}
            <span className="text-sm font-normal text-muted-foreground">vụ việc</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cần đối chiếu biên bản giao nhận
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
