"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ActivityChart, InventoryBreakdown } from "@/components/dashboard/charts";
import {
  ActivityPanel,
  FacilitiesPanel,
  LowStockPanel,
  OperationsPanel,
  PendingRequestsPanel,
  RecentOrdersPanel,
} from "@/components/dashboard/panels";
import { useDashboardSummary } from "@/hooks/use-system";
import { useCan } from "@/stores/use-auth-store";
import { errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatters";

const PERIODS = [7, 14, 30, 90] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [days, setDays] = React.useState<number>(14);
  const { data: summary, isLoading, error, refetch, isFetching } = useDashboardSummary(days);
  const canCreateRequest = useCan("request.create");

  return (
    <AdminLayout permission="dashboard.read">
      <div className="space-y-6">
        <PageHeader
          title="Tổng quan cung ứng & tồn kho"
          description={
            summary
              ? `Số liệu trực tiếp từ hệ thống · cập nhật ${formatDateTime(summary.generated_at)}`
              : "Giám sát đa cơ sở, điều phối đơn cấp hàng và tồn kho hệ thống DICA."
          }
          actions={
            <>
              <Tabs data-tour="dashboard-period" value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <TabsList className="bg-muted/70 p-1">
                  {PERIODS.map((p) => (
                    <TabsTrigger key={p} value={String(p)} className="text-xs">
                      {p} ngày
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs rounded-xl"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                <span className="hidden sm:inline">Làm mới</span>
              </Button>
              {canCreateRequest && (
                <Button asChild size="sm" className="h-9 gap-1.5 text-xs rounded-xl shadow-xs">
                  <Link href="/requests?action=create">
                    <Plus className="size-3.5" />
                    <span>Tạo yêu cầu cấp hàng</span>
                  </Link>
                </Button>
              )}
            </>
          }
        />

        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <Card className="items-center gap-3 rounded-2xl p-8 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm font-semibold">Không tải được số liệu tổng quan</p>
            <p className="text-xs text-muted-foreground">{errorMessage(error)}</p>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => refetch()}>
              Thử lại
            </Button>
          </Card>
        ) : summary ? (
          <>
            <div data-tour="dashboard-kpis">
              <KpiCards summary={summary} />
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className={summary.inventory ? "lg:col-span-8" : "lg:col-span-12"}>
                {(summary.movements || summary.requests) && <ActivityChart summary={summary} />}
              </div>
              {summary.inventory && (
                <div className="lg:col-span-4">
                  <InventoryBreakdown summary={summary} />
                </div>
              )}
            </div>

            <div data-tour="dashboard-work-queues" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <PendingRequestsPanel summary={summary} />
              <RecentOrdersPanel summary={summary} />
              <OperationsPanel summary={summary} />
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <FacilitiesPanel summary={summary} />
              </div>
              <div className="space-y-6 lg:col-span-4">
                <LowStockPanel summary={summary} />
                <ActivityPanel summary={summary} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
