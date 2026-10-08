"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { DetailSheet, InfoGrid, Section } from "@/components/shared/detail-sheet";
import { Field, OptionSelect, SearchInput, type Option } from "@/components/shared/form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import type { AuditEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/formatters";
import { useCan, useUser } from "@/stores/use-auth-store";
import {
  CheckCircle2,
  Database,
  Eye,
  RefreshCw,
  Shield,
  Sliders,
  Terminal,
  X,
  XCircle
} from "lucide-react";
import * as React from "react";

interface HealthResponse {
  status: string;
  database: string;
}

interface AuditFilters extends Record<string, string> {
  action: string;
  resource_type: string;
  actor: string;
  created_from: string;
  created_to: string;
}

const ACTION_LABELS: Record<string, string> = {
  "adjustment.approve": "Duyệt điều chỉnh tồn",
  "adjustment.post": "Cập nhật phiếu vào tồn kho",
  "damage.confirm": "Xác nhận báo hỏng",
  "discrepancy.resolve": "Xử lý chênh lệch giao nhận",
  "dispatch.post": "Ghi nhận xuất hàng",
  "grant.assign": "Cấp quyền người dùng",
  "grant.revoke": "Thu hồi quyền người dùng",
  "order.cancel": "Hủy đơn cấp hàng",
  "order.close_outstanding": "Đóng số lượng còn thiếu",
  "payment_tracking.update": "Cập nhật thanh toán",
  "receipt.post": "Ghi nhận nhận hàng",
  "request.approve": "Duyệt yêu cầu cấp hàng",
  "request.cancel": "Hủy yêu cầu cấp hàng",
  "request.refresh_routing": "Tính lại định tuyến yêu cầu",
  "sales_import.commit": "Chốt đợt nhập bán hàng",
  "stocktake.reopen": "Mở lại phiếu kiểm kê",
  "stocktake.submit": "Gửi phiếu kiểm kê",
  "transfer.approve": "Duyệt phiếu điều chuyển",
  "transfer.auto_approve": "Tự duyệt điều chuyển",
  "transfer.cancel": "Hủy phiếu điều chuyển",
  "transfer.update_draft": "Sửa nháp điều chuyển",
  "user.activate": "Kích hoạt tài khoản",
  "user.deactivate": "Vô hiệu hóa tài khoản",
  "user.password.change": "Người dùng đổi mật khẩu",
  "user.profile.update": "Cập nhật hồ sơ",
  "user.reset_password": "Quản trị đặt lại mật khẩu",
  "user.username.change": "Đổi tên đăng nhập",
  "variance.recalculate": "Tính lại chênh lệch tiêu hao",
};

const ACTION_OPTIONS: Option[] = [
  { value: "config.", label: "Mọi thay đổi cấu hình", hint: "config.*" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label, hint: value })),
];

const RESOURCE_LABELS: Record<string, string> = {
  DamageReport: "Báo hỏng",
  DiscrepancyCase: "Chênh lệch giao nhận",
  Dispatch: "Phiếu xuất hàng",
  FulfillmentOrder: "Đơn cấp hàng",
  InventoryAdjustment: "Điều chỉnh tồn",
  Receipt: "Phiếu nhận hàng",
  RoleGrant: "Phân quyền",
  SalesImportBatch: "Đợt nhập bán hàng",
  Stocktake: "Phiếu kiểm kê",
  SupplyRequest: "Yêu cầu cấp hàng",
  Transfer: "Phiếu điều chuyển",
  User: "Tài khoản người dùng",
  ALERT_RULE_CONFIG: "Cấu hình cảnh báo",
  CATALOG_CONFIG: "Cấu hình danh mục",
  IDENTITY_ACCESS_CONFIG: "Cấu hình tài khoản & quyền",
  IPOS_MAPPING_CONFIG: "Cấu hình ánh xạ iPOS",
  ORGANIZATION_CONFIG: "Cấu hình tổ chức",
  RECIPE_CONFIG: "Cấu hình công thức",
  SOURCING_CONFIG: "Cấu hình nguồn cung",
};

const RESOURCE_OPTIONS: Option[] = Object.entries(RESOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
  hint: value,
}));

function actionLabel(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith("config.")) return "Thay đổi cấu hình";
  return action;
}

function startOfLocalDay(value: string) {
  return value ? new Date(`${value}T00:00:00.000`).toISOString() : undefined;
}

function endOfLocalDay(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
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
  const auditList = useListState<AuditFilters>({
    action: "",
    resource_type: "",
    actor: "",
    created_from: "",
    created_to: "",
  });
  const auditQuery = usePagedQuery<AuditEvent>(
    "/audit-events",
    {
      page: auditList.page,
      page_size: auditList.pageSize,
      search: auditList.search.trim() || undefined,
      action: auditList.filters.action || undefined,
      resource_type: auditList.filters.resource_type || undefined,
      actor: auditList.filters.actor.trim() || undefined,
      created_from: startOfLocalDay(auditList.filters.created_from),
      created_to: endOfLocalDay(auditList.filters.created_to),
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
      header: "Hành động",
      render: (a) => <Cell2 top={actionLabel(a.action)} bottom={<Code>{a.action}</Code>} />,
    },
    {
      key: "resource",
      header: "Dữ liệu thay đổi",
      render: (a) => (
        <Cell2
          top={RESOURCE_LABELS[a.resourceType] ?? a.resourceType}
          bottom={<><Code>{a.resourceType}</Code> · {a.resourceId}</>}
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
          <Eye className="h-3.5 w-3.5" />
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Nhật ký & tình trạng hệ thống"
        description="Kiểm tra kết nối máy chủ, cơ sở dữ liệu và tra cứu lịch sử thay đổi trong hệ thống."
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
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Health status banner */}
        <div data-tour="system-health" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-xs font-medium text-muted-foreground">Kết nối máy chủ DICA</div>
              <div className="text-base font-bold text-foreground">
                {healthQuery.isLoading
                  ? "Đang kiểm tra..."
                  : healthQuery.isSuccess
                  ? "Hoạt động bình thường"
                  : "Mất kết nối máy chủ"}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Địa chỉ: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}
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
              <div className="text-xs font-medium text-muted-foreground">Cơ sở dữ liệu PostgreSQL</div>
              <div className="text-base font-bold text-foreground">
                {healthQuery.data?.database === "connected" ? "Đã kết nối" : "Chưa sẵn sàng"}
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
              <div className="text-xs font-medium text-muted-foreground">Tài khoản đang đăng nhập</div>
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
        <div className="space-y-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Lịch sử thay đổi trong hệ thống
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận tự động mọi thay đổi cấu hình, định tuyến và phân quyền trong toàn tổ chức.
              </p>
            </div>
            {auditList.hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={auditList.reset}>
                <X className="size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {canReadAudit && (
            <div data-tour="audit-filters" className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <Field label="Hành động">
                  <OptionSelect
                    value={auditList.filters.action}
                    onChange={(value) => auditList.setFilter("action", value)}
                    options={ACTION_OPTIONS}
                    allLabel="Tất cả hành động"
                    placeholder="Chọn hành động"
                    searchable
                    searchPlaceholder="Tìm tên hành động..."
                  />
                </Field>
                <Field label="Loại dữ liệu">
                  <OptionSelect
                    value={auditList.filters.resource_type}
                    onChange={(value) => auditList.setFilter("resource_type", value)}
                    options={RESOURCE_OPTIONS}
                    allLabel="Tất cả loại dữ liệu"
                    placeholder="Chọn loại dữ liệu"
                    searchable
                    searchPlaceholder="Tìm loại dữ liệu..."
                  />
                </Field>
                <Field label="Người thực hiện" hint="Tìm theo họ tên hoặc tên đăng nhập.">
                  <SearchInput
                    value={auditList.filters.actor}
                    onChange={(value) => auditList.setFilter("actor", value)}
                    placeholder="Ví dụ: Nguyễn Văn An hoặc nguyenvana"
                    className="max-w-none sm:max-w-none"
                  />
                </Field>
                <Field label="Từ ngày">
                  <DateTimePicker
                    mode="date"
                    value={auditList.filters.created_from}
                    onChange={(value) => auditList.setFilter("created_from", value)}
                    max={auditList.filters.created_to || undefined}
                    placeholder="Chọn ngày bắt đầu"
                  />
                </Field>
                <Field label="Đến ngày">
                  <DateTimePicker
                    mode="date"
                    value={auditList.filters.created_to}
                    onChange={(value) => auditList.setFilter("created_to", value)}
                    min={auditList.filters.created_from || undefined}
                    placeholder="Chọn ngày kết thúc"
                  />
                </Field>
                <Field
                  label="Mã cần tra cứu"
                  hint="Tìm theo mã dữ liệu, mã truy vết hoặc mã hành động."
                >
                  <SearchInput
                    value={auditList.search}
                    onChange={auditList.setSearch}
                    placeholder="Dán mã dữ liệu hoặc mã truy vết..."
                    className="max-w-none sm:max-w-none"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                <span>{auditQuery.data?.meta?.total ?? 0} sự kiện phù hợp</span>
                <span>Các ô chữ tự tìm sau 350 ms.</span>
              </div>
            </div>
          )}

          {!canReadAudit ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Tài khoản chưa được cấp quyền xem lịch sử thay đổi ở phạm vi toàn tổ chức.
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
              emptyMessage="Chưa có lịch sử thay đổi nào."
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
        title="Chi tiết thay đổi"
        description={detailEvent ? formatDateTime(detailEvent.createdAt) : ""}
        width="w-full sm:max-w-2xl"
      >
        {detailEvent && (
          <div className="space-y-6">
            <Section title="Thông tin tổng quan">
              <InfoGrid
                columns={2}
                items={[
                  {
                    label: "Hành động",
                    value: (
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span>{actionLabel(detailEvent.action)}</span>
                        <Code>{detailEvent.action}</Code>
                      </span>
                    ),
                  },
                  {
                    label: "Người thực hiện",
                    value: detailEvent.actor?.displayName ?? "Hệ thống",
                  },
                  {
                    label: "Loại dữ liệu",
                    value: (
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span>{RESOURCE_LABELS[detailEvent.resourceType] ?? detailEvent.resourceType}</span>
                        <Code>{detailEvent.resourceType}</Code>
                      </span>
                    ),
                  },
                  { label: "Mã dữ liệu", value: <Code>{detailEvent.resourceId}</Code> },
                  { label: "Mã truy vết", value: <Code>{detailEvent.requestId}</Code> },
                  { label: "Thời điểm ghi nhận", value: formatDateTime(detailEvent.createdAt) },
                ]}
              />
            </Section>

            <Section title="Dữ liệu trước khi thay đổi">
              <div className="rounded-lg bg-muted/60 p-3 font-mono text-xs overflow-x-auto max-h-60 border border-border/50">
                <pre>{JSON.stringify(detailEvent.beforeData ?? {}, null, 2)}</pre>
              </div>
            </Section>

            <Section title="Dữ liệu sau khi thay đổi">
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
