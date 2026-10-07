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
import { formatMoney, formatQty } from "@/lib/num";

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

  React.useEffect(() => {
    const permissions = {
      stock: canStock,
      fulfillment: canFulfillment,
      damage: canDamage,
      variance: canVariance,
      payment: canPayment,
    };
    if (permissions[activeTab]) return;
    const allowed = (Object.keys(permissions) as Array<keyof typeof permissions>).find(
      (tab) => permissions[tab]
    );
    if (allowed) setActiveTab(allowed);
  }, [activeTab, canDamage, canFulfillment, canPayment, canStock, canVariance]);

  const list = useListState({
    initialFilters: { facility_id: globalFacility ?? "" },
  });

  React.useEffect(() => {
    list.setFilter("facility_id", globalFacility ?? "");
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

  const damageColumns: Column<DamageReport>[] = [
    { key: "code", header: "Mã báo hỏng", render: (row) => <Cell2 top={<Code>{row.code}</Code>} bottom={formatDate(row.createdAt)} /> },
    { key: "location", header: "Kho / Cơ sở", render: (row) => <Cell2 top={row.stockLocation?.name} bottom={row.stockLocation?.facility?.name} /> },
    { key: "reason", header: "Lý do", render: (row) => <span className="text-xs">{row.reason}</span> },
    { key: "lines", header: "Số mặt hàng", width: "110px", align: "center", render: (row) => <span className="text-xs font-medium">{row.lines?.length ?? row._count?.lines ?? 0}</span> },
    { key: "status", header: "Trạng thái", width: "130px", align: "center", render: (row) => <StatusBadge status={row.status} /> },
  ];

  const varianceColumns: Column<VarianceResult>[] = [
    { key: "ingredient", header: "Nguyên liệu", render: (row) => <Cell2 top={row.ingredient?.name ?? row.ingredientId} bottom={row.ingredient?.code} /> },
    { key: "location", header: "Kho / Cơ sở", render: (row) => <Cell2 top={row.stockLocation?.name} bottom={row.stockLocation?.facility?.name} /> },
    { key: "expected", header: "Tồn lý thuyết", width: "120px", align: "right", render: (row) => <span className="font-mono text-xs">{formatQty(row.expectedClosingSnapshot)}</span> },
    { key: "actual", header: "Kiểm kê", width: "110px", align: "right", render: (row) => <span className="font-mono text-xs">{formatQty(row.actualClosingSnapshot)}</span> },
    { key: "variance", header: "Chênh lệch", width: "110px", align: "right", render: (row) => <span className={Number(row.varianceQuantity) < 0 ? "font-mono text-xs font-semibold text-destructive" : "font-mono text-xs font-semibold text-blue-600"}>{formatQty(row.varianceQuantity)}</span> },
    { key: "data", header: "Dữ liệu", width: "130px", align: "center", render: (row) => <StatusBadge status={row.dataStatus} /> },
  ];

  const paymentColumns: Column<PaymentTracking>[] = [
    { key: "order", header: "Đơn / Nhà cung cấp", render: (row) => <Cell2 top={<Code>{row.order?.code ?? row.orderId}</Code>} bottom={row.order?.supplier?.name} /> },
    { key: "destination", header: "Kho / Cơ sở", render: (row) => <Cell2 top={row.order?.destinationStockLocation?.name} bottom={row.order?.destinationStockLocation?.facility?.name} /> },
    { key: "reconciled", header: "Đối soát", width: "130px", align: "right", render: (row) => <span className="font-mono text-xs">{formatMoney(row.reconciledValue)}</span> },
    { key: "paid", header: "Đã thanh toán", width: "140px", align: "right", render: (row) => <span className="font-mono text-xs font-semibold">{formatMoney(row.paidValue)}</span> },
    { key: "status", header: "Trạng thái", width: "120px", align: "center", render: (row) => <StatusBadge status={row.status} /> },
    { key: "updated", header: "Cập nhật", width: "150px", render: (row) => <span className="text-xs text-muted-foreground">{formatDateTime(row.updatedAt)}</span> },
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
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm sm:gap-3 sm:p-4">
          <FacilitySelect
            value={list.filters.facility_id}
            onChange={(v) => list.setFilter("facility_id", v)}
            allLabel="Tất cả cơ sở"
            className="w-full sm:w-64"
          />
          {list.hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={list.reset}>
              Đặt lại lọc
            </Button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "stock" | "fulfillment" | "damage" | "variance" | "payment")
          }
          className="space-y-4"
        >
          <TabsList data-tour="reports-tabs" className="w-full bg-muted/70 p-1 sm:w-fit">
            {canStock && <TabsTrigger value="stock" className="text-xs">
              <Boxes className="h-3.5 w-3.5" />
              Báo cáo tồn kho
            </TabsTrigger>}
            {canFulfillment && <TabsTrigger value="fulfillment" className="text-xs">
              <ShoppingCart className="h-3.5 w-3.5" />
              Tỷ lệ hoàn tất đơn
            </TabsTrigger>}
            {canDamage && <TabsTrigger value="damage" className="text-xs">
              <Flame className="h-3.5 w-3.5 text-destructive" />
              Tổng hợp hao hụt
            </TabsTrigger>}
            {canVariance && <TabsTrigger value="variance" className="text-xs">
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
              Đối soát iPOS
            </TabsTrigger>}
            {canPayment && <TabsTrigger value="payment" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
              Đối soát thanh toán
            </TabsTrigger>}
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
            <DataTable columns={damageColumns} data={damageReport.data?.items ?? []} total={damageReport.data?.meta?.total} page={list.page} pageSize={list.pageSize} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} loading={damageReport.isLoading} emptyMessage="Không có báo cáo hàng hỏng." />
          </TabsContent>

          <TabsContent value="variance" className="space-y-4">
            <DataTable columns={varianceColumns} data={varianceReport.data?.items ?? []} total={varianceReport.data?.meta?.total} page={list.page} pageSize={list.pageSize} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} loading={varianceReport.isLoading} emptyMessage="Không có dữ liệu chênh lệch iPOS." />
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <DataTable columns={paymentColumns} data={paymentReport.data?.items ?? []} total={paymentReport.data?.meta?.total} page={list.page} pageSize={list.pageSize} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} loading={paymentReport.isLoading} emptyMessage="Không có dữ liệu thanh toán." />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
