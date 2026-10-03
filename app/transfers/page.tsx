"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  ExternalLink,
  FilePen,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { DetailSheet, InfoGrid, MiniTable, Section } from "@/components/shared/detail-sheet";
import { LinesEditor, cleanQty, newLine, validateLines, type LineDraft } from "@/components/shared/lines-editor";
import { useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useStockLocations } from "@/hooks/use-lookups";
import { useListState } from "@/hooks/use-list-state";
import { useUrlParam } from "@/hooks/use-system";
import { api } from "@/lib/api/client";
import type { DocumentStatus, Transfer } from "@/lib/api/types";
import { STATUS_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatQty } from "@/lib/num";

const TRANSFER_STATUSES: DocumentStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"];
const INVALIDATE = ["/transfers", "/orders", "/dashboard/summary"];

// ---------------------------------------------------------------------------
// Editor Dialog
// ---------------------------------------------------------------------------

type TransferEditorMode = { kind: "create" } | { kind: "edit"; transfer: Transfer };

function TransferEditor({
  mode,
  onOpenChange,
  onSaved,
}: {
  mode: TransferEditorMode | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const open = mode !== null;
  const [fromLocId, setFromLocId] = React.useState("");
  const [toLocId, setToLocId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>([]);

  const { data: locations = [] } = useStockLocations();
  const physicalLocations = React.useMemo(
    () => locations.filter((l) => l.active && l.type === "PHYSICAL"),
    [locations]
  );

  React.useEffect(() => {
    if (!mode) return;
    if (mode.kind === "create") {
      setFromLocId("");
      setToLocId("");
      setNote("");
      setLines([newLine()]);
    } else {
      const t = mode.transfer;
      setFromLocId(t.fromStockLocationId);
      setToLocId(t.toStockLocationId);
      setNote(t.note ?? "");
      setLines(
        (t.lines ?? []).map((l) =>
          newLine({
            ingredient_id: l.ingredientId,
            unit_id: l.ingredient?.baseUnitId ?? "",
            quantity: String(Number(l.quantity)),
          })
        )
      );
    }
  }, [mode]);

  const save = useApiMutation<void, Transfer>({
    mutationFn: () => {
      const linePayload = lines.map((l) => ({
        ingredient_id: l.ingredient_id,
        unit_id: l.unit_id,
        quantity: cleanQty(l.quantity),
      }));

      if (!mode || mode.kind === "create") {
        return api.post<Transfer>("/transfers", {
          from_stock_location_id: fromLocId,
          to_stock_location_id: toLocId,
          ...(note.trim() ? { note: note.trim() } : {}),
          lines: linePayload,
        });
      }

      return api.put<Transfer>(`/transfers/${mode.transfer.id}`, {
        expected_version: mode.transfer.version,
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: linePayload,
      });
    },
    invalidate: INVALIDATE,
    successMessage: mode?.kind === "edit" ? "Đã cập nhật phiếu điều chuyển." : "Đã tạo phiếu điều chuyển.",
    onSuccess: (res) => {
      onOpenChange(false);
      if (res?.id) onSaved(res.id);
    },
  });

  const locationOptions = physicalLocations.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.code})`,
    hint: l.facility?.name,
  }));

  const isValid =
    Boolean(fromLocId) &&
    Boolean(toLocId) &&
    fromLocId !== toLocId &&
    validateLines(lines);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode?.kind === "edit" ? `Sửa phiếu điều chuyển ${mode.transfer.code}` : "Tạo phiếu điều chuyển nội bộ"}
      description="Điều chuyển nguyên vật liệu giữa các kho vật lý trong chuỗi cơ sở."
      submitLabel={mode?.kind === "edit" ? "Cập nhật" : "Tạo phiếu nháp"}
      submitting={save.isPending}
      submitDisabled={!isValid}
      onSubmit={() => save.mutate()}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Kho xuất hàng" required hint="Kho nguồn gửi hàng">
            <OptionSelect
              value={fromLocId}
              onChange={setFromLocId}
              options={locationOptions.filter((o) => o.value !== toLocId)}
              placeholder="Chọn kho xuất..."
            />
          </Field>
          <Field label="Kho nhận đích" required hint="Kho tiếp nhận">
            <OptionSelect
              value={toLocId}
              onChange={setToLocId}
              options={locationOptions.filter((o) => o.value !== fromLocId)}
              placeholder="Chọn kho nhận..."
            />
          </Field>
        </div>

        <Field label="Ghi chú điều chuyển">
          <Textarea
            placeholder="Lý do điều chuyển, ghi chú xe vận chuyển..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </Field>

        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Danh sách nguyên liệu điều chuyển
          </label>
          <LinesEditor lines={lines} onChange={setLines} />
        </div>
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TransfersPage() {
  const facilityId = useFacilityFilter();
  const canCreate = useCan("transfer.create");
  const canUpdate = useCan("transfer.update_draft");
  const canSubmit = useCan("transfer.submit");
  const canApprove = useCan("transfer.approve");
  const canReject = useCan("transfer.reject");
  const canCancel = useCan("transfer.cancel");

  const [urlId, clearUrlId] = useUrlParam("id");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [editorMode, setEditorMode] = React.useState<TransferEditorMode | null>(null);

  React.useEffect(() => {
    if (urlId) {
      setDetailId(urlId);
      clearUrlId();
    }
  }, [urlId, clearUrlId]);

  const list = useListState({ status: "" });

  const query = usePagedQuery<Transfer>("/transfers", {
    ...list.params,
    facility_id: facilityId || undefined,
  });

  const detailQuery = useApiQuery<Transfer>(
    detailId ? `/transfers/${detailId}` : null,
    undefined,
    { enabled: Boolean(detailId) }
  );
  const detail = detailQuery.data;

  const [rejectTarget, setRejectTarget] = React.useState<Transfer | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Transfer | null>(null);

  const submitMutation = useApiMutation<Transfer, { message: string }>({
    mutationFn: (t) =>
      api.post(`/transfers/${t.id}/submit`, { expected_version: t.version }),
    invalidate: INVALIDATE,
    successMessage: "Đã gửi phiếu điều chuyển chờ phê duyệt.",
    onSuccess: () => {
      if (detailId) detailQuery.refetch();
    },
  });

  const approveMutation = useApiMutation<Transfer, { message: string }>({
    mutationFn: (t) =>
      api.post(`/transfers/${t.id}/approve`, { expected_version: t.version }),
    invalidate: INVALIDATE,
    successMessage: "Đã phê duyệt phiếu điều chuyển. Đơn thực hiện đã được khởi tạo tự động.",
    onSuccess: () => {
      if (detailId) detailQuery.refetch();
    },
  });

  const rejectMutation = useApiMutation<string, { message: string }>({
    mutationFn: (reason) => {
      if (!rejectTarget) throw new Error("No target");
      return api.post(`/transfers/${rejectTarget.id}/reject`, {
        expected_version: rejectTarget.version,
        reason: reason || "Từ chối điều chuyển",
      });
    },
    invalidate: INVALIDATE,
    successMessage: "Đã từ chối phiếu điều chuyển.",
    onSuccess: () => {
      setRejectTarget(null);
      if (detailId) detailQuery.refetch();
    },
  });

  const cancelMutation = useApiMutation<string, { message: string }>({
    mutationFn: (reason) => {
      if (!cancelTarget) throw new Error("No target");
      return api.post(`/transfers/${cancelTarget.id}/cancel`, {
        expected_version: cancelTarget.version,
        reason: reason || "Huỷ phiếu điều chuyển",
      });
    },
    invalidate: INVALIDATE,
    successMessage: "Đã huỷ phiếu điều chuyển.",
    onSuccess: () => {
      setCancelTarget(null);
      if (detailId) detailQuery.refetch();
    },
  });

  const columns: Column<Transfer>[] = [
    {
      key: "code",
      header: "Mã phiếu",
      cell: (row) => (
        <div className="flex flex-col">
          <Code>{row.code}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "from",
      header: "Kho xuất",
      cell: (row) => (
        <Cell2
          title={row.fromStockLocation?.name ?? "Kho xuất"}
          sub={row.fromStockLocation?.facility?.name ?? row.fromStockLocation?.code}
        />
      ),
    },
    {
      key: "to",
      header: "Kho nhận",
      cell: (row) => (
        <Cell2
          title={row.toStockLocation?.name ?? "Kho nhận"}
          sub={row.toStockLocation?.facility?.name ?? row.toStockLocation?.code}
        />
      ),
    },
    {
      key: "lines",
      header: "Số mặt hàng",
      className: "text-right",
      headClassName: "text-right",
      cell: (row) => (
        <span className="text-xs font-medium">{row._count?.lines ?? row.lines?.length ?? 0}</span>
      ),
    },
    {
      key: "creator",
      header: "Người tạo",
      cell: (row) => (
        <Cell2
          title={row.createdBy?.displayName ?? "—"}
          sub={row.submittedAt ? `Gửi duyệt: ${formatDate(row.submittedAt)}` : undefined}
        />
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
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canSubmit && row.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
              title="Gửi phê duyệt"
              onClick={() => submitMutation.mutate(row)}
            >
              <Send className="size-3.5 mr-1" /> Gửi duyệt
            </Button>
          )}
          {canApprove && row.status === "SUBMITTED" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Phê duyệt"
              onClick={() => approveMutation.mutate(row)}
            >
              <CheckCircle2 className="size-3.5 mr-1" /> Duyệt
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout permission="transfer.read">
      <div className="space-y-6">
        <PageHeader
          title="Điều Chuyển Kho Nội Bộ"
          description="Lập phiếu, phê duyệt và giám sát luồng điều chuyển nguyên vật liệu giữa các kho vật lý."
          actions={
            canCreate && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditorMode({ kind: "create" })}>
                <Plus className="size-3.5" /> Lập phiếu điều chuyển
              </Button>
            )
          }
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
          emptyText="Chưa có phiếu điều chuyển nào."
          toolbar={
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <SearchInput
                value={list.search}
                onChange={list.setSearch}
                placeholder="Tìm theo mã phiếu..."
              />
              <OptionSelect
                value={list.filters.status}
                onChange={(v) => list.setFilter("status", v)}
                options={TRANSFER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
                allLabel="Tất cả trạng thái"
                className="sm:w-48"
              />
            </div>
          }
        />
      </div>

      <TransferEditor
        mode={editorMode}
        onOpenChange={(o) => !o && setEditorMode(null)}
        onSaved={setDetailId}
      />

      <DetailSheet
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        title={detail ? `Phiếu điều chuyển ${detail.code}` : "Chi tiết phiếu"}
        badge={detail && <StatusBadge status={detail.status} />}
        description={detail ? `Tạo lúc ${formatDateTime(detail.createdAt)}` : undefined}
        wide
        footer={
          detail && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">Phiên bản #{detail.version}</span>
              <div className="flex items-center gap-2">
                {canUpdate && detail.status === "DRAFT" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setEditorMode({ kind: "edit", transfer: detail })}
                  >
                    <FilePen className="size-3.5 mr-1" /> Chỉnh sửa
                  </Button>
                )}
                {canSubmit && detail.status === "DRAFT" && (
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => submitMutation.mutate(detail)}
                    disabled={submitMutation.isPending}
                  >
                    <Send className="size-3.5 mr-1" /> Gửi duyệt
                  </Button>
                )}
                {canApprove && detail.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    onClick={() => approveMutation.mutate(detail)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Phê duyệt
                  </Button>
                )}
                {canReject && detail.status === "SUBMITTED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                    onClick={() => setRejectTarget(detail)}
                  >
                    <XCircle className="size-3.5 mr-1" /> Từ chối
                  </Button>
                )}
                {canCancel && (detail.status === "DRAFT" || detail.status === "SUBMITTED") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 text-xs"
                    onClick={() => setCancelTarget(detail)}
                  >
                    <Ban className="size-3.5 mr-1" /> Huỷ phiếu
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
                { label: "Mã phiếu", value: <Code>{detail.code}</Code> },
                { label: "Kho xuất", value: detail.fromStockLocation?.name },
                { label: "Kho nhận", value: detail.toStockLocation?.name },
                { label: "Người lập", value: detail.createdBy?.displayName },
                { label: "Gửi duyệt", value: detail.submittedAt ? formatDateTime(detail.submittedAt) : "—" },
                { label: "Quyết định", value: detail.decidedAt ? formatDateTime(detail.decidedAt) : "—" },
                { label: "Ghi chú", value: detail.note || "—" },
              ]}
            />

            <Section title={`Nguyên vật liệu điều chuyển (${detail.lines?.length ?? 0})`}>
              <MiniTable
                headers={[
                  { label: "Nguyên liệu" },
                  { label: "ĐVT" },
                  { label: "Số lượng", className: "text-right" },
                ]}
                rows={(detail.lines ?? []).map((l) => [
                  <Cell2 key="i" title={l.ingredientNameSnapshot || l.ingredient?.name || "Nguyên liệu"} sub={l.ingredient?.code} />,
                  l.unitCodeSnapshot,
                  formatQty(l.quantity),
                ])}
              />
            </Section>

            {(detail.orders?.length ?? 0) > 0 && (
              <Section title="Đơn thực hiện phát sinh">
                <MiniTable
                  headers={[{ label: "Mã đơn" }, { label: "Trạng thái" }, { label: "" }]}
                  rows={(detail.orders ?? []).map((ord) => [
                    <Code key="c">{ord.code}</Code>,
                    <StatusBadge key="s" status={ord.status} />,
                    <Link
                      key="l"
                      href={`/orders?id=${ord.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Mở <ExternalLink className="size-3" />
                    </Link>,
                  ])}
                />
              </Section>
            )}
          </div>
        )}
      </DetailSheet>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Từ chối phiếu điều chuyển?"
        description={`Phiếu ${rejectTarget?.code}: Người lập có thể điều chỉnh và gửi lại.`}
        confirmLabel="Từ chối"
        destructive
        reason={{ label: "Lý do từ chối", required: true }}
        loading={rejectMutation.isPending}
        onConfirm={(reason) => rejectMutation.mutate(reason ?? "")}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Huỷ phiếu điều chuyển?"
        description={`Phiếu ${cancelTarget?.code}: Thao tác huỷ không thể hoàn tác.`}
        confirmLabel="Huỷ phiếu"
        destructive
        reason={{ label: "Lý do huỷ", required: true }}
        loading={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate(reason ?? "")}
      />
    </AdminLayout>
  );
}
