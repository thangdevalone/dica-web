"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  KpiWidgetsRow,
  OverviewCompositeWidget,
  SalesBreakdownWidget,
  BottomWidgetsRow,
} from "@/components/dashboard";
import { SupplyRequestDialog } from "@/components/forms/supply-request-dialog";
import {
  useFacilitiesQuery,
  useIngredientsQuery,
  useSupplyRequestsQuery,
  useStockBalancesQuery,
  useDiscrepanciesQuery,
  useApproveRequestMutation,
} from "@/hooks";
import { useAppStore } from "@/stores/use-app-store";
import { Plus, Database, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const selectedFacilityId = useAppStore((state) => state.selectedFacilityId);

  // TanStack React Query Hooks with caching and automated synchronization
  const { data: facilities = [], refetch: refetchFacilities } = useFacilitiesQuery();
  const { data: ingredients = [], refetch: refetchIngredients } = useIngredientsQuery();
  const { data: requests = [], refetch: refetchRequests } = useSupplyRequestsQuery(
    selectedFacilityId !== "ALL" ? selectedFacilityId : undefined
  );
  const { data: balances = [], refetch: refetchBalances } = useStockBalancesQuery(
    selectedFacilityId !== "ALL" ? selectedFacilityId : undefined
  );
  const { data: discrepancies = [], refetch: refetchDiscrepancies } = useDiscrepanciesQuery();
  const { mutate: approveRequest } = useApproveRequestMutation();

  // Dialog state
  const [openNewReqDialog, setOpenNewReqDialog] = React.useState(false);
  const [selectedIngredient, setSelectedIngredient] = React.useState<string | undefined>();

  const handleRefresh = () => {
    refetchFacilities();
    refetchIngredients();
    refetchRequests();
    refetchBalances();
    refetchDiscrepancies();
  };

  // KPI Calculations
  const totalInventoryValue = React.useMemo(
    () => balances.reduce((sum, item) => sum + item.total_value, 0),
    [balances]
  );
  const lowStockItems = React.useMemo(
    () => balances.filter((item) => item.is_low_stock),
    [balances]
  );
  const pendingRequests = React.useMemo(
    () => requests.filter((r) => r.status === "SUBMITTED" || r.status === "DRAFT"),
    [requests]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Trung Tâm Điều Hành Cung Ứng & Tồn Kho
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Giám sát đa cơ sở, điều phối đơn cấp hàng và định mức hao hụt hệ thống DICA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            <Link href="/catalog">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs rounded-xl">
                <Database className="size-3.5" />
                <span>Danh mục SKU</span>
              </Button>
            </Link>

            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl shadow-xs"
              onClick={() => {
                setSelectedIngredient(undefined);
                setOpenNewReqDialog(true);
              }}
            >
              <Plus className="size-3.5" />
              <span>Tạo yêu cầu cấp hàng</span>
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. Top Row: 6 KPI & Metric Widgets (Matching Screenshot)     */}
        {/* ============================================================ */}
        <KpiWidgetsRow
          totalInventoryValue={totalInventoryValue}
          pendingRequestsCount={pendingRequests.length}
          lowStockItemsCount={lowStockItems.length}
          discrepanciesCount={discrepancies.length}
        />

        {/* ============================================================ */}
        {/* 2. Middle Row: Composite Chart + Sales Breakdown Widget     */}
        {/* ============================================================ */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <OverviewCompositeWidget />
          </div>
          <div className="lg:col-span-4">
            <SalesBreakdownWidget />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. Bottom Row: Actionable Cards (Matching Screenshot)       */}
        {/* ============================================================ */}
        <BottomWidgetsRow
          lowStockItems={lowStockItems}
          pendingRequests={pendingRequests}
          facilities={facilities}
          onReplenish={(ingId) => {
            setSelectedIngredient(ingId);
            setOpenNewReqDialog(true);
          }}
          onApproveRequest={(id) => approveRequest(id)}
        />

        {/* Reusable Supply Request Form Dialog (react-hook-form + zod) */}
        <SupplyRequestDialog
          open={openNewReqDialog}
          onOpenChange={setOpenNewReqDialog}
          preselectedIngredientId={selectedIngredient}
        />
      </div>
    </AdminLayout>
  );
}
