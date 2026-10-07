"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { DetailSheet, InfoGrid, MiniTable, Section } from "@/components/shared/detail-sheet";
import { useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { useUrlParam } from "@/hooks/use-system";
import { api, newIdempotencyKey } from "@/lib/api/client";
import type { FulfillmentOrder, OrderStatus, PaymentTrackingView, SourceType } from "@/lib/api/types";
import { SOURCE_TYPE_LABELS, STATUS_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatMoney, formatQty } from "@/lib/num";

const ORDER_STATUSES: OrderStatus[] = [
  "DRAFT",
  "RELEASED",
  "PARTIAL",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];
const SOURCE_TYPES: SourceType[] = ["STOCK", "SUPPLIER"];
const INVALIDATE = ["/orders", "/dashboard/summary"];

function downloadSupplierOrder(order: FulfillmentOrder) {
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["Mã đơn", order.code],
    ["Nhà cung cấp", order.supplier?.name ?? ""],
    ["Kho nhận", order.destinationStockLocation?.name ?? ""],
    ["Cơ sở", order.destinationStockLocation?.facility?.name ?? ""],
    [],
    ["Mã hàng", "Tên hàng", "ĐVT", "Số lượng", "Đơn giá tham chiếu"],
    ...(order.lines ?? []).map((line) => [
      line.ingredient?.code ?? "",
      line.ingredient?.name ?? "",
      line.unitCodeSnapshot,
      line.approvedQuantity,
      line.unitPriceSnapshot ?? "",
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(quote).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${order.code}-nha-cung-cap.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const facilityId = useFacilityFilter();
  const canClose = useCan("order.close_outstanding");
  const canCancel = useCan("order.cancel");
  const canExport = useCan("order.export");
  const canReadPayment = useCan("payment_tracking.read");
  const canUpdatePayment = useCan("payment_tracking.update");

  const [urlId, clearUrlId] = useUrlParam("id");
  const [detailId, setDetailId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (urlId) {
      setDetailId(urlId);
      clearUrlId();
    }
  }, [urlId, clearUrlId]);

  const list = useListState({
    status: "",
    source_type: "",
  });

  const query = usePagedQuery<FulfillmentOrder>("/orders", {
    ...list.params,
    facility_id: facilityId || undefined,
  });

  // Detail query
  const detailQuery = useApiQuery<FulfillmentOrder>(
    detailId ? `/orders/${detailId}` : null,
    undefined,
    { enabled: Boolean(detailId) }
  );
  const detail = detailQuery.data;
  const paymentQuery = useApiQuery<PaymentTrackingView>(
    detailId ? `/orders/${detailId}/payment-tracking` : null,
    undefined,
    {
      enabled:
        Boolean(detailId) &&
        detail?.sourceType === "SUPPLIER" &&
        canReadPayment,
    }
  );

  // Dialog actions
  const [closeTarget, setCloseTarget] = React.useState<FulfillmentOrder | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<FulfillmentOrder | null>(null);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paidValue, setPaidValue] = React.useState("");

  const paymentMutation = useApiMutation<string, PaymentTrackingView>({
    mutationFn: (value) => {
      if (!detailId || !paymentQuery.data) throw new Error("Chưa tải dữ liệu thanh toán.");
      return api.put<PaymentTrackingView>(
        `/orders/${detailId}/payment-tracking`,
        {
          paid_value: value,
          expected_version: paymentQuery.data.version,
        },
        { idempotencyKey: newIdempotencyKey() }
      );
    },
    invalidate: ["/orders", "/reports/payment"],
    onSuccess: () => {
      setPaymentOpen(false);
      paymentQuery.refetch();
    },
  });

  const closeMutation = useApiMutation<string, { message: string }>({
    mutationFn: (reason) => {
      if (!closeTarget) throw new Error("No target");
      return api.post(`/orders/${closeTarget.id}/close-outstanding`, {
        expected_version: closeTarget.version,
        reason: reason || "Đóng phần chưa giao theo yêu cầu",
      });
    },
    invalidate: INVALIDATE,
    successMessage: "Đã đóng phần chưa giao của đơn thực hiện.",
    onSuccess: () => {
      setCloseTarget(null);
      if (detailId) detailQuery.refetch();
    },
  });

  const cancelMutation = useApiMutation<string, { message: string }>({
    mutationFn: (reason) => {
      if (!cancelTarget) throw new Error("No target");
      return api.post(`/orders/${cancelTarget.id}/cancel`, {
        expected_version: cancelTarget.version,
        reason: reason || "Huỷ đơn thực hiện",
      });
    },
    invalidate: INVALIDATE,
    successMessage: "Đã huỷ đơn thực hiện.",
    onSuccess: () => {
      setCancelTarget(null);
      if (detailId) detailQuery.refetch();
    },
  });

  const columns: Column<FulfillmentOrder>[] = [
    {
      key: "code",
      header: "Mã đơn",
      cell: (row) => (
        <div className="flex flex-col">
          <Code>{row.code}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "source",
      header: "Nguồn cung ứng",
      cell: (row) => {
        const isSupplier = row.sourceType === "SUPPLIER";
        return (
          <Cell2
            title={isSupplier ? row.supplier?.name ?? "Nhà cung cấp" : row.sourceStockLocation?.name ?? "Kho xuất"}
            sub={labelOf(SOURCE_TYPE_LABELS, row.sourceType)}
          />
        );
      },
    },
    {
      key: "destination",
      header: "Kho nhận đích",
      cell: (row) => (
        <Cell2
          title={row.destinationStockLocation?.name ?? "Kho đích"}
          sub={row.destinationStockLocation?.facility?.name ?? row.destinationStockLocation?.code}
        />
      ),
    },
    {
      key: "origin",
      header: "Chứng từ gốc",
      cell: (row) => {
        if (row.request) {
          return (
            <Link
              href={`/requests?id=${row.request.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              YC: {row.request.code}
              <ExternalLink className="size-3" />
            </Link>
          );
        }
        if (row.transfer) {
          return (
            <Link
              href={`/transfers?id=${row.transfer.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              ĐC: {row.transfer.code}
              <ExternalLink className="size-3" />
            </Link>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "lines",
      header: "Số dòng",
      className: "text-right",
      headClassName: "text-right",
      cell: (row) => (
        <span className="text-xs font-medium">{row._count?.lines ?? row.lines?.length ?? 0}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => {
        const canDoClose = canClose && (row.status === "PARTIAL" || row.status === "RELEASED");
        const canDoCancel = canCancel && (row.status === "DRAFT" || row.status === "RELEASED");
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {canDoClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Đóng phần chưa giao"
                onClick={() => setCloseTarget(row)}
              >
                <FileCheck2 className="size-3.5" /> Đóng
              </Button>
            )}
            {canDoCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Huỷ đơn"
                onClick={() => setCancelTarget(row)}
              >
                <Ban className="size-3.5" /> Huỷ
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout permission="order.read">
      <div className="space-y-6">
        <PageHeader
          title="Đơn Thực Hiện Cung Ứng"
          description="Theo dõi xuất kho, giao hàng NCC và nhập nhận hàng phát sinh từ yêu cầu cấp hàng hoặc điều chuyển kho."
        />

        <DataTable
          columns={columns}
          rows={query.data?.items}
          rowKey={(r) => r.id}
          loading={query.isLoading}
          fetching={query.isFetching}
          error={query.error}
          meta={query.data?.meta}
          onPageChange={list.setPage}
          onRowClick={(r) => setDetailId(r.id)}
          emptyText="Chưa có đơn thực hiện nào."
          toolbar={
            <div data-tour="orders-list" className="flex flex-1 flex-col gap-2 sm:flex-row">
              <SearchInput
                value={list.search}
                onChange={list.setSearch}
                placeholder="Tìm theo mã đơn..."
              />
              <OptionSelect
                value={list.filters.status}
                onChange={(v) => list.setFilter("status", v)}
                options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
                allLabel="Tất cả trạng thái"
                className="sm:w-48"
              />
              <OptionSelect
                value={list.filters.source_type}
                onChange={(v) => list.setFilter("source_type", v)}
                options={SOURCE_TYPES.map((t) => ({ value: t, label: SOURCE_TYPE_LABELS[t] ?? t }))}
                allLabel="Tất cả nguồn cấp"
                className="sm:w-44"
              />
            </div>
          }
        />
      </div>

      {/* Detail Sheet */}
      <DetailSheet
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        title={detail ? `Đơn thực hiện ${detail.code}` : "Chi tiết đơn"}
        badge={detail && <StatusBadge status={detail.status} />}
        description={detail ? `Tạo lúc ${formatDateTime(detail.createdAt)}` : undefined}
        wide
        footer={
          detail && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">Phiên bản #{detail.version}</span>
              <div className="flex items-center gap-2">
                {canExport && detail.sourceType === "SUPPLIER" && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => downloadSupplierOrder(detail)}>
                    <Download className="size-3.5" /> Xuất phiếu NCC
                  </Button>
                )}
                {canClose && (detail.status === "PARTIAL" || detail.status === "RELEASED") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs"
                    onClick={() => setCloseTarget(detail)}
                  >
                    <FileCheck2 className="size-3.5" /> Đóng phần chưa giao
                  </Button>
                )}
                {canCancel && (detail.status === "DRAFT" || detail.status === "RELEASED") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                    onClick={() => setCancelTarget(detail)}
                  >
                    <Ban className="size-3.5" /> Huỷ đơn
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <InfoGrid
              columns={3}
              items={[
                { label: "Mã đơn", value: <Code>{detail.code}</Code> },
                { label: "Nguồn cấp", value: labelOf(SOURCE_TYPE_LABELS, detail.sourceType) },
                {
                  label: detail.sourceType === "SUPPLIER" ? "Nhà cung cấp" : "Kho xuất",
                  value:
                    detail.sourceType === "SUPPLIER"
                      ? detail.supplier?.name ?? "—"
                      : detail.sourceStockLocation?.name ?? "—",
                },
                { label: "Kho nhận", value: detail.destinationStockLocation?.name },
                { label: "Cơ sở nhận", value: detail.destinationStockLocation?.facility?.name },
                {
                  label: "Chứng từ gốc",
                  value: detail.request ? (
                    <Link
                      href={`/requests?id=${detail.request.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      YC: {detail.request.code}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : detail.transfer ? (
                    <Link
                      href={`/transfers?id=${detail.transfer.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      ĐC: {detail.transfer.code}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                { label: "Phát hành lúc", value: detail.releasedAt ? formatDateTime(detail.releasedAt) : "—" },
                { label: "Tạo lúc", value: formatDateTime(detail.createdAt) },
                { label: "Cập nhật lúc", value: formatDateTime(detail.updatedAt) },
              ]}
            />

            {detail.sourceType === "SUPPLIER" && canReadPayment && (
              <Section title="Đối soát thanh toán">
                {paymentQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">Đang tải thông tin thanh toán...</p>
                ) : paymentQuery.data ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <div className="flex items-center gap-5 text-xs">
                      <CreditCard className="size-4 text-emerald-600" />
                      <span>Giá trị đối soát: <strong>{formatMoney(paymentQuery.data.reconciledValue)}</strong></span>
                      <span>Đã thanh toán: <strong>{formatMoney(paymentQuery.data.paidValue)}</strong></span>
                      <StatusBadge status={paymentQuery.data.status} />
                    </div>
                    {canUpdatePayment && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setPaidValue(paymentQuery.data?.paidValue ?? "0"); setPaymentOpen(true); }}>
                        Cập nhật thanh toán
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Không có dữ liệu đối soát.</p>
                )}
              </Section>
            )}

            <Section title={`Chi tiết mặt hàng (${detail.lines?.length ?? 0})`}>
              <MiniTable
                headers={[
                  { label: "Nguyên liệu" },
                  { label: "ĐVT" },
                  { label: "Duyệt cấp", className: "text-right" },
                  { label: "Đã xuất", className: "text-right" },
                  { label: "Đã nhận", className: "text-right" },
                  { label: "Đã đóng", className: "text-right" },
                ]}
                rows={(detail.lines ?? []).map((l) => [
                  <Cell2 key="i" title={l.ingredient?.name ?? "Nguyên liệu"} sub={l.ingredient?.code} />,
                  l.unitCodeSnapshot,
                  formatQty(l.approvedQuantity),
                  <span key="d" className="text-blue-600 font-semibold">{formatQty(l.dispatchedQuantity)}</span>,
                  <span key="r" className="text-emerald-600 font-semibold">{formatQty(l.receivedQuantity)}</span>,
                  Number(l.closedRemainingQuantity) > 0 ? (
                    <span key="c" className="text-amber-600">{formatQty(l.closedRemainingQuantity)}</span>
                  ) : (
                    "—"
                  ),
                ])}
              />
            </Section>

            {/* Dispatches */}
            {(detail.dispatches?.length ?? 0) > 0 && (
              <Section title={`Phiếu xuất kho liên quan (${detail.dispatches?.length})`}>
                <div className="space-y-2">
                  {detail.dispatches?.map((dsp) => (
                    <div
                      key={dsp.id}
                      className="p-3 bg-muted/20 rounded-xl border border-border/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-blue-500" />
                        <Code>{dsp.code}</Code>
                        <StatusBadge status={dsp.status} />
                      </div>
                      <span className="text-muted-foreground">
                        {dsp.postedAt ? `Ghi sổ lúc ${formatDateTime(dsp.postedAt)}` : formatDateTime(dsp.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Receipts */}
            {(detail.receipts?.length ?? 0) > 0 && (
              <Section title={`Phiếu nhập nhận hàng (${detail.receipts?.length})`}>
                <div className="space-y-2">
                  {detail.receipts?.map((rcp) => (
                    <div
                      key={rcp.id}
                      className="p-3 bg-muted/20 rounded-xl border border-border/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <PackageCheck className="size-4 text-emerald-500" />
                        <Code>{rcp.code}</Code>
                        <StatusBadge status={rcp.status} />
                      </div>
                      <span className="text-muted-foreground">
                        {rcp.postedAt ? `Ghi sổ lúc ${formatDateTime(rcp.postedAt)}` : formatDateTime(rcp.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </DetailSheet>

      <ConfirmDialog
        open={Boolean(closeTarget)}
        onOpenChange={(o) => !o && setCloseTarget(null)}
        title="Đóng phần chưa giao?"
        description={`Đơn ${closeTarget?.code}: Hệ thống sẽ kết thúc đơn và không cho phép xuất/nhập thêm các phần còn thiếu.`}
        confirmLabel="Đóng đơn"
        reason={{ label: "Lý do đóng đơn", required: true }}
        loading={closeMutation.isPending}
        onConfirm={(reason) => closeMutation.mutate(reason ?? "")}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Huỷ đơn thực hiện?"
        description={`Đơn ${cancelTarget?.code}: Thao tác huỷ không thể hoàn tác.`}
        confirmLabel="Huỷ đơn"
        destructive
        reason={{ label: "Lý do huỷ", required: true }}
        loading={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate(reason ?? "")}
      />

      <FormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Cập nhật thanh toán"
        description={`Số tiền không được vượt giá trị đối soát ${formatMoney(paymentQuery.data?.reconciledValue)}.`}
        submitLabel="Lưu thanh toán"
        loading={paymentMutation.isPending}
        disabled={!/^\d+(?:\.\d{1,4})?$/.test(paidValue) || Number(paidValue) > Number(paymentQuery.data?.reconciledValue ?? 0)}
        onSubmit={() => paymentMutation.mutate(paidValue)}
      >
        <Field label="Giá trị đã thanh toán" required>
          <Input type="number" min="0" step="0.0001" value={paidValue} onChange={(event) => setPaidValue(event.target.value)} />
        </Field>
      </FormDialog>
    </AdminLayout>
  );
}
