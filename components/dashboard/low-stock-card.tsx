"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { StockBalance } from "@/types";

interface LowStockCardProps {
  lowStockItems: StockBalance[];
  onReplenish: (ingredientId: string) => void;
}

export function LowStockCard({ lowStockItems, onReplenish }: LowStockCardProps) {
  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-base font-bold">
            Cảnh Báo Tồn Kho & Hạn Dùng
          </CardTitle>
          <CardDescription>Các SKU cần đặt hàng hoặc luân chuyển gấp</CardDescription>
        </div>
        <Link href="/inventory">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <span>Kiểm kho</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowStockItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Hiện không có mặt hàng nào dưới mức tồn an toàn.
          </div>
        ) : (
          lowStockItems.map((sb) => (
            <div
              key={sb.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card/40 p-3.5 transition-colors hover:bg-muted/20"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {sb.ingredient_name}
                  </span>
                  <Badge variant="destructive" className="text-[10px] h-5">
                    Tồn thấp
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {sb.facility_name} • {sb.location_name}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  Khả dụng:{" "}
                  <span className="font-semibold text-foreground">
                    {sb.available_quantity} {sb.unit}
                  </span>{" "}
                  (Mức an toàn: {sb.min_stock} {sb.unit})
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onReplenish(sb.ingredient_id)}
              >
                Bổ sung
              </Button>
            </div>
          ))
        )}

        {/* Near expiry sample notice */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/40 p-3.5 transition-colors hover:bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Ba Chỉ Bò Cuộn Nấm Kim Châm
              </span>
              <Badge variant="outline" className="text-[10px] h-5">
                HSD: 15/10/2026
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              DICA BBQ Premium Q1 • Lô BATCH-202610-01
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">
              Còn 12 ngày sử dụng. Ưu tiên tiêu thụ trước (FIFO).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
