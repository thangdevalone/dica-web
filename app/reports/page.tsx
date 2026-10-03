"use client";

import * as React from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  Flame,
  Percent,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { FacilitySelect } from "@/components/shared/entity-select";
import { usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import type {
  DamageReport,
  FulfillmentOrder,
  PaymentTracking,
  StockBalance,
  VarianceResult,
} from "@/lib/api/types";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatQty } from "@/lib/num";

export default function ReportsPage() {
  const globalFacility = useFacilityFilter();
  const [activeTab, setActiveTab] = React.useState<
    "stock" | "fulfillment" | "damage" | "variance" | "payment"
  >("stock");

  const canStock = useCan("report.stock");
  const canFulfillment = useCan("report.fulfillment");
  const canDamage = useCan("report.damage");
  const canVariance = useCan("report.variance");
  const canPayment = useCan("report.payment");

  const list = useListState({
    initialFilters: { facility_id: globalFacility ?? "" },
  });

  React.useEffect(() => {
    if (globalFacility !== undefined) {
      list.setFilter("facility_id", globalFacility ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFacility]);

  // Queries
  const stockReport = usePagedQuery<StockBalance>(
    "/reports/stock",
    { page: list.page, page_size: list.pageSize, facility_id: list.filters.facility_id || undefined },
    { enabled: activeTab === "stock" && canStock, keepPreviousData: true }
  );

  const fulfillmentReport = usePagedQuery<FulfillmentOrder>(
    "/reports/fulfillment",
    { page: list.page, page_size: list.pageSize, facility_id: list.filters.facility_id || undefined },
    { enabled: activeTab === "fulfillment" && canFulfillment, keepPreviousData: true }
  );

  const damageReport = usePagedQuery<DamageReport>(
    "/reports/damage",
    { page: list.page, page_size: list.pageSize, facility_id: list.filters.facility_id || undefined },
    { enabled: activeTab === "damage" && canDamage, keepPreviousData: true }
  );

  const varianceReport = usePagedQuery<VarianceResult>(
    "/reports/variance",
    { page: list.page, page_size: list.pageSize, facility_id: list.filters.facility_id || undefined },
    { enabled: activeTab === "variance" && canVariance, keepPreviousData: true }
  );

  const paymentReport = usePagedQuery<PaymentTracking>(
    "/reports/payment",
    { page: list.page, page_size: list.pageSize, facility_id: list.filters.facility_id || undefined },
    { enabled: activeTab === "payment" && canPayment, keepPreviousData: true }
  );

  // Columns for Stock Report
  const stockColumns: Column<StockBalance>[] = [
    {
      key: "ingredient",
      header: "Nguyên liệu",
      render: (b) => (
        <Cell2
          top={b.ingredient?.name ?? b.ingredientId}
          bottom={b.ingredient?.code}
        />
      ),
    },
    {
      key: "location",
      header: "Kho & Cơ sở",
      render: (b) => (
        <Cell2
          top={b.stockLocation?.name}
          bottom={b.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "unit",
      header: "ĐVT",
      width: "80px",
      render: (b) => <span className="text-xs">{b.ingredient?.baseUnit?.code ?? "—"}</span>,
    },
    {
      key: "quantity",
      header: "Số lượng tồn",
      width: "140px",
      align: "right",
      render: (b) => (
        <span className="font-mono text-xs font-semibold">{formatQty(b.quantity)}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "Thời điểm cập nhật",
      width: "160px",
      render: (b) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(b.updatedAt)}</span>
      ),
    },
  ];

  // Columns for Fulfillment Report
  const fulfillmentColumns: Column<FulfillmentOrder>[] = [
    {
      key: "code",
      header: "Mã đơn hàng",
      width: "160px",
      render: (o) => (
        <div className="flex flex-col">
          <Code className="font-semibold text-primary">{o.code}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "source",
      header: "Nguồn cung ứng",
      render: (o) => (
        <Cell2
          top={o.sourceType === "SUPPLIER" ? o.supplier?.name : o.sourceStockLocation?.name}
          bottom={o.sourceType}
        />
      ),
    },
    {
      key: "destination",
      header: "Kho nhận",
      render: (o) => (
        <Cell2
          top={o.destinationStockLocation?.name}
          bottom={o.destinationStockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "140px",
      align: "center",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "lines",
      header: "Số mặt hàng",
      width: "110px",
      align: "center",
      render: (o) => <span className="text-xs font-medium">{o.lines?.length ?? 0}</span>,
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Trung Tâm Báo Cáo & Đối Soát"
        description="Tổng hợp dữ liệu tồn kho, đối soát tỷ lệ hoàn tất đơn, báo cáo hao hụt và thanh toán theo từng cơ sở."
        icon={BarChart3}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === "stock") stockReport.refetch();
              if (activeTab === "fulfillment") fulfillmentReport.refetch();
              if (activeTab === "damage") damageReport.refetch();
              if (activeTab === "variance") varianceReport.refetch();
              if (activeTab === "payment") paymentReport.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
          <FacilitySelect
            value={list.filters.facility_id}
            onChange={(v) => list.setFilter("facility_id", v)}
            allLabel="Tất cả cơ sở"
            className="w-64"
          />
          {list.hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={list.reset}>
              Đặt lại lọc
            </Button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-4"
        >
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="stock" className="text-xs">
              <Boxes className="h-3.5 w-3.5 mr-1.5" />
              Báo cáo tồn kho
            </TabsTrigger>
            <TabsTrigger value="fulfillment" className="text-xs">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              Tỷ lệ hoàn tất đơn
            </TabsTrigger>
            <TabsTrigger value="damage" className="text-xs">
              <Flame className="h-3.5 w-3.5 mr-1.5 text-destructive" />
              Tổng hợp hao hụt
            </TabsTrigger>
            <TabsTrigger value="variance" className="text-xs">
              <TrendingDown className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Đối soát iPOS
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Đối soát thanh toán
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
            <DataTable
              columns={stockColumns}
              data={stockReport.data?.items ?? []}
              total={stockReport.data?.meta?.total}
              page={list.page}
              pageSize={list.pageSize}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
              loading={stockReport.isLoading}
              emptyMessage="Không có dữ liệu báo cáo tồn kho."
            />
          </TabsContent>

          <TabsContent value="fulfillment" className="space-y-4">
            <DataTable
              columns={fulfillmentColumns}
              data={fulfillmentReport.data?.items ?? []}
              total={fulfillmentReport.data?.meta?.total}
              page={list.page}
              pageSize={list.pageSize}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
              loading={fulfillmentReport.isLoading}
              emptyMessage="Không có dữ liệu hoàn tất đơn."
            />
          </TabsContent>

          <TabsContent value="damage" className="space-y-4">
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Chọn chi nhánh phía trên để xem chi tiết báo cáo hao hụt và các biên bản huỷ hàng.
            </div>
          </TabsContent>

          <TabsContent value="variance" className="space-y-4">
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Dữ liệu đối soát chênh lệch lý thuyết POS và kiểm kê thực tế theo từng kỳ.
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Theo dõi tiến độ thanh toán và đối soát công nợ nhà cung cấp theo đơn thực hiện.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
