"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  DashboardKpis,
  TransferFlowChart,
  CategoryDonutChart,
  PendingRequestsCard,
  LowStockCard,
  FacilitiesGrid,
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
  const openDiscrepancies = React.useMemo(
    () => discrepancies.filter((d) => d.status === "OPEN"),
    [discrepancies]
  );

  // Chart data for stock allocation
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances) {
      const ing = ingredients.find((i) => i.id === b.ingredient_id);
      const grp = ing?.groupName || "Khác";
      map.set(grp, (map.get(grp) || 0) + b.total_value);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [balances, ingredients]);

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
              className="h-9 gap-1.5 text-xs"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            <Link href="/catalog">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                <Database className="size-3.5" />
                <span>Danh mục SKU</span>
              </Button>
            </Link>

            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs shadow-sm"
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

        {/* Modular Top KPI Cards */}
        <DashboardKpis
          totalInventoryValue={totalInventoryValue}
          pendingRequestsCount={pendingRequests.length}
          unapprovedRequestsCount={
            requests.filter((r) => r.status === "SUBMITTED").length
          }
          lowStockItemsCount={lowStockItems.length}
          discrepanciesCount={openDiscrepancies.length}
        />

        {/* Charts Row: Bar Chart & Donut Chart */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <TransferFlowChart />
          </div>
          <div className="lg:col-span-3">
            <CategoryDonutChart data={categoryData} />
          </div>
        </div>

        {/* Detailed Sections: Pending Requests & Low Stock Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PendingRequestsCard
            requests={pendingRequests}
            onApprove={(id) => approveRequest(id)}
          />
          <LowStockCard
            lowStockItems={lowStockItems}
            onReplenish={(ingId) => {
              setSelectedIngredient(ingId);
              setOpenNewReqDialog(true);
            }}
          />
        </div>

        {/* Facilities Status Overview Grid */}
        <FacilitiesGrid facilities={facilities} />

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
