"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Eye,
  FileCode2,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  Sliders,
  Terminal,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { DetailSheet, InfoGrid, Section } from "@/components/shared/detail-sheet";
import { SearchInput } from "@/components/shared/form";
import { useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { api } from "@/lib/api/client";
import type { AuditEvent } from "@/lib/api/types";
import { useCan, useUser } from "@/stores/use-auth-store";
import { formatDateTime } from "@/lib/formatters";

interface HealthResponse {
  status: string;
  database: string;
}

export default function SystemPage() {
  const user = useUser();
  const canReadAudit = useCan("audit.read");
  const [detailEvent, setDetailEvent] = React.useState<AuditEvent | null>(null);

  // Health Query
  const healthQuery = useApiQuery<HealthResponse>(
    "/health/ready",
    undefined,
    { refetchInterval: 30_000 }
  );

  // Audit List
  const auditList = useListState();
  const auditQuery = usePagedQuery<AuditEvent>(
    "/audit-events",
    {
      page: auditList.page,
      page_size: auditList.pageSize,
      action: auditList.search.trim() || undefined,
    },
    { enabled: canReadAudit, keepPreviousData: true }
  );

  const auditColumns: Column<AuditEvent>[] = [
    {
      key: "time",
      header: "Thời gian",
      width: "160px",
      render: (a) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      width: "180px",
      render: (a) => (
        <Cell2
          top={a.actor?.displayName ?? "Hệ thống"}
          bottom={a.actor?.username ? `@${a.actor.username}` : undefined}
        />
      ),
    },
    {
      key: "action",
      header: "Hành động (Action)",
      render: (a) => <Code className="text-xs font-semibold text-primary">{a.action}</Code>,
    },
    {
      key: "resource",
      header: "Tài nguyên",
      render: (a) => (
        <Cell2
          top={a.resourceType}
          bottom={a.resourceId}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setDetailEvent(a)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Nhật Ký & Trạng Thái Hệ Thống"
        description="Kiểm tra kết nối trực tiếp với DICA Backend API, cơ sở dữ liệu và theo dõi nhật ký kiểm toán (Audit Trail)."
        icon={Sliders}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              healthQuery.refetch();
              if (canReadAudit) auditQuery.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Health status banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                healthQuery.isSuccess
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {healthQuery.isSuccess ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Kết nối API Backend</div>
              <div className="text-base font-bold text-foreground">
                {healthQuery.isLoading
                  ? "Đang kiểm tra..."
                  : healthQuery.isSuccess
                  ? "Hoạt động (Healthy)"
                  : "Mất kết nối API"}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Target: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                healthQuery.data?.database === "connected"
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">PostgreSQL Database</div>
              <div className="text-base font-bold text-foreground">
                {healthQuery.data?.database === "connected" ? "Đã kết nối (Ready)" : "Chưa sẵn sàng"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Prisma 7 • Transaction Safe
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Phiên xác thực</div>
              <div className="text-base font-bold text-foreground">
                {user ? user.display_name : "Chưa đăng nhập"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {user ? `@${user.username} • ${user.kind}` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Section */}
        <div className="bg-card rounded-2xl border border-border/70 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Nhật ký kiểm toán hệ thống (Audit Trail)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận tự động mọi thay đổi cấu hình, định tuyến và phân quyền trong toàn tổ chức.
              </p>
            </div>
            <SearchInput
              placeholder="Lọc theo hành động..."
              value={auditList.search}
              onChange={auditList.setSearch}
              className="w-64"
            />
          </div>

          {!canReadAudit ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Bạn không có quyền <Code>audit.read</Code> cấp tổ chức để xem nhật ký kiểm toán.
            </div>
          ) : (
            <DataTable
              columns={auditColumns}
              data={auditQuery.data?.items ?? []}
              total={auditQuery.data?.meta?.total}
              page={auditList.page}
              pageSize={auditList.pageSize}
              onPageChange={auditList.setPage}
              onPageSizeChange={auditList.setPageSize}
              loading={auditQuery.isLoading}
              onRowClick={(row) => setDetailEvent(row)}
              emptyMessage="Chưa có bản ghi kiểm toán nào."
            />
          )}
        </div>
      </div>

      {/* Audit Detail Sheet */}
      <DetailSheet
        open={Boolean(detailEvent)}
        onOpenChange={(open) => {
          if (!open) setDetailEvent(null);
        }}
        title={`Chi tiết sự kiện kiểm toán`}
        description={detailEvent ? formatDateTime(detailEvent.createdAt) : ""}
        width="w-full sm:max-w-2xl"
      >
        {detailEvent && (
          <div className="space-y-6">
            <Section title="Thông tin tổng quan">
              <InfoGrid
                columns={2}
                items={[
                  { label: "Hành động", value: <Code>{detailEvent.action}</Code> },
                  {
                    label: "Người thực hiện",
                    value: detailEvent.actor?.displayName ?? "Hệ thống",
                  },
                  { label: "Loại tài nguyên", value: detailEvent.resourceType },
                  { label: "Mã tài nguyên", value: <Code>{detailEvent.resourceId}</Code> },
                  { label: "Mã yêu cầu (Request ID)", value: <Code>{detailEvent.requestId}</Code> },
                  { label: "Thời điểm ghi nhận", value: formatDateTime(detailEvent.createdAt) },
                ]}
              />
            </Section>

            <Section title="Dữ liệu trước thay đổi (Before)">
              <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs overflow-x-auto max-h-60 border border-border/50">
                <pre>{JSON.stringify(detailEvent.beforeData ?? {}, null, 2)}</pre>
              </div>
            </Section>

            <Section title="Dữ liệu sau thay đổi (After)">
              <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs overflow-x-auto max-h-60 border border-border/50">
                <pre>{JSON.stringify(detailEvent.afterData ?? {}, null, 2)}</pre>
              </div>
            </Section>
          </div>
        )}
      </DetailSheet>
    </AdminLayout>
  );
}
