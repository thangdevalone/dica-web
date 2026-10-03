"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ClipboardCheck,
  Building2,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import type { StockBalance, SupplyRequest, Facility } from "@/types";

interface BottomWidgetsRowProps {
  lowStockItems: StockBalance[];
  pendingRequests: SupplyRequest[];
  facilities: Facility[];
  onReplenish: (ingredientId: string) => void;
  onApproveRequest: (requestId: string) => void;
}

const FALLBACK_LOW_STOCK: StockBalance[] = [
  {
    id: "sb-1",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Bình Tân",
    location_name: "Kho Lạnh",
    ingredient_id: "ing-1",
    ingredient_code: "ING-BEEF-WAGYU",
    ingredient_name: "Thịt Bò Wagyu A5 Nhập Khẩu",
    unit: "kg",
    quantity_on_hand: 8.5,
    allocated_quantity: 0,
    available_quantity: 8.5,
    unit_cost: 1850000,
    total_value: 15725000,
    min_stock: 20,
    is_low_stock: true,
    batch_number: "LOT-2026-001",
    expiry_date: "2026-04-15",
  },
  {
    id: "sb-4",
    facility_id: "fac-1",
    facility_name: "Kho Tổng Bình Tân",
    location_name: "Kho Khô",
    ingredient_id: "ing-4",
    ingredient_code: "ING-SAUCE-PEPPER",
    ingredient_name: "Sốt Tiêu Đen Đặc Biệt DICA",
    unit: "lít",
    quantity_on_hand: 5,
    allocated_quantity: 0,
    available_quantity: 5,
    unit_cost: 120000,
    total_value: 600000,
    min_stock: 15,
    is_low_stock: true,
    batch_number: "LOT-2026-003",
    expiry_date: "2026-08-20",
  },
];

const FALLBACK_REQUESTS: SupplyRequest[] = [
  {
    id: "req-1",
    code: "REQ-2026-001",
    destination_facility_id: "fac-3",
    destinationFacilityName: "DICA BBQ Premium — Nguyễn Huệ Q1",
    source_type: "STOCK",
    status: "SUBMITTED",
    requested_by: "Trần Bếp Trưởng",
    created_at: "Hôm nay 08:30",
    expected_delivery: "2026-03-02",
    total_items: 4,
    total_value: 18500000,
    items: [],
  },
  {
    id: "req-2",
    code: "REQ-2026-002",
    destination_facility_id: "fac-4",
    destinationFacilityName: "DICA Hotpot World — Crescent Mall Q7",
    source_type: "STOCK",
    status: "SUBMITTED",
    requested_by: "Lê Quản Lý",
    created_at: "Hôm nay 09:15",
    expected_delivery: "2026-03-02",
    total_items: 2,
    total_value: 9200000,
    items: [],
  },
];

const FALLBACK_FACILITIES: Facility[] = [
  {
    id: "fac-1",
    code: "WH-BINTAN",
    name: "Kho Tổng Trung Tâm Bình Tân",
    type: "CENTRAL_WAREHOUSE",
    active: true,
    createdAt: "2026-01-10",
  },
  {
    id: "fac-2",
    code: "CK-TANBINH",
    name: "Bếp Trung Tâm Sơ Chế Tân Bình",
    type: "CENTRAL_KITCHEN",
    active: true,
    createdAt: "2026-01-12",
  },
  {
    id: "fac-3",
    code: "BR-Q1-NGUYENHUE",
    name: "DICA BBQ Premium — Nguyễn Huệ Q1",
    type: "BRANCH",
    active: true,
    createdAt: "2026-01-15",
  },
  {
    id: "fac-4",
    code: "BR-Q7-CRESCENT",
    name: "DICA Hotpot World — Crescent Mall Q7",
    type: "BRANCH",
    active: true,
    createdAt: "2026-02-01",
  },
];

export function BottomWidgetsRow({
  lowStockItems,
  pendingRequests,
  facilities,
  onReplenish,
  onApproveRequest,
}: BottomWidgetsRowProps) {
  const displayLowStock = lowStockItems.length > 0 ? lowStockItems : FALLBACK_LOW_STOCK;
  const displayPending = pendingRequests.length > 0 ? pendingRequests : FALLBACK_REQUESTS;
  const displayFacilities = facilities.length > 0 ? facilities : FALLBACK_FACILITIES;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ============================================================ */}
      {/* Card 1: Replenishment Alerts (Pure Monochrome)              */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Cảnh Báo Tồn Thấp
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Cần bổ sung kho tức thời
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {displayLowStock.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {item.ingredient_name}
                    </span>
                    <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-mono text-muted-foreground border border-border/60">
                      {item.ingredient_code}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Tồn: <span className="text-foreground font-bold">{item.quantity_on_hand}</span> / Tối thiểu: {item.min_stock} {item.unit}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg text-[10px] font-semibold hover:bg-muted"
                  onClick={() => onReplenish(item.ingredient_id)}
                >
                  Bổ sung
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {displayLowStock.length} SKU dưới ngưỡng
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-foreground font-semibold gap-1 px-2"
            onClick={() => {
              window.location.href = "/inventory";
            }}
          >
            Sổ cái kho <ArrowRight className="size-3" />
          </Button>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Card 2: Pending Approvals (Pure Monochrome)                  */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <ClipboardCheck className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Yêu Cầu Chờ Duyệt
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Phê duyệt cấp phát nguyên liệu
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {displayPending.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {req.code}
                    </span>
                    <span className="rounded bg-muted border border-border/80 px-1 py-0.2 text-[9px] font-semibold text-foreground">
                      {req.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Từ: <span className="text-foreground font-medium">{req.destinationFacilityName || "Chi nhánh"}</span> ({req.items?.length || 1} món)
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-[10px] font-semibold"
                  onClick={() => onApproveRequest(req.id)}
                >
                  Duyệt ngay
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {displayPending.length} phiếu cần xử lý
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-foreground font-semibold gap-1 px-2"
            onClick={() => {
              window.location.href = "/requests";
            }}
          >
            Tất cả phiếu <ArrowRight className="size-3" />
          </Button>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* Card 3: Facilities Hub (Pure Monochrome)                     */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-border bg-card/90 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <Building2 className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Mạng Lưới Cơ Sở DICA
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Trạng thái vận hành chuỗi
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {displayFacilities.slice(0, 4).map((fac) => (
              <div
                key={fac.id}
                className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-2 rounded-full bg-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {fac.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {fac.code}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium border-border/60 shrink-0"
                >
                  {fac.type === "CENTRAL_WAREHOUSE"
                    ? "Kho Tổng"
                    : fac.type === "CENTRAL_KITCHEN"
                    ? "Bếp Sơ Chế"
                    : "Chi Nhánh"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {displayFacilities.length} điểm lưu kho hoạt động
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-foreground font-semibold gap-1 px-2"
            onClick={() => {
              window.location.href = "/organization";
            }}
          >
            Quản lý <ArrowRight className="size-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
