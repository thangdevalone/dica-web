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
import { ChevronRight, Check } from "lucide-react";
import type { SupplyRequest } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface PendingRequestsCardProps {
  requests: SupplyRequest[];
  onApprove: (id: string) => void;
}

export function PendingRequestsCard({ requests, onApprove }: PendingRequestsCardProps) {
  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-base font-bold">
            Yêu Cầu Cấp Hàng Cần Duyệt
          </CardTitle>
          <CardDescription>Các đề xuất xin hàng từ bếp & nhà hàng</CardDescription>
        </div>
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <span>Xem tất cả</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Hiện không có yêu cầu nào đang chờ xử lý.
          </div>
        ) : (
          requests.slice(0, 3).map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-2 rounded-xl border border-border/70 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {req.code}
                  </span>
                  <Badge
                    variant={
                      req.status === "APPROVED"
                        ? "outline"
                        : req.status === "SUBMITTED"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[11px]"
                  >
                    {req.status === "SUBMITTED"
                      ? "Chờ duyệt"
                      : req.status === "APPROVED"
                      ? "Đã duyệt"
                      : "Bản nháp"}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground">
                  Đến: {req.destinationFacilityName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {req.total_items} mặt hàng • {formatCurrency(req.total_value)} •{" "}
                  {req.requested_by}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                {req.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => onApprove(req.id)}
                  >
                    <Check className="size-3.5" />
                    <span>Duyệt</span>
                  </Button>
                )}
                <Link href={`/requests?id=${req.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
