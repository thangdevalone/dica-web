"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  FilePen,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { FacilitySelect } from "@/components/shared/entity-select";
import { DetailSheet, InfoGrid, MiniTable, Section } from "@/components/shared/detail-sheet";
import { LinesEditor, cleanQty, newLine, validateLines, type LineDraft } from "@/components/shared/lines-editor";
import { useAllQuery, useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useDepartments } from "@/hooks/use-lookups";
import { useListState } from "@/hooks/use-list-state";
import { useUrlParam } from "@/hooks/use-system";
import { api } from "@/lib/api/client";
import type { ItemEligibility, SupplyRequest } from "@/lib/api/types";
import { APPROVAL_DECISION_LABELS, SOURCE_TYPE_LABELS, STATUS_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatQty } from "@/lib/num";
import { toast } from "sonner";

const REQUEST_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"] as const;
const INVALIDATE = ["/requests", "/orders"];

function tomorrow() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Editor (create / edit draft / revise rejected)
// ---------------------------------------------------------------------------

type EditorMode = { kind: "create" } | { kind: "edit" | "revise"; request: SupplyRequest };

function RequestEditor({
  mode,
  onOpenChange,
  onSaved,
}: {
  mode: EditorMode | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const open = mode !== null;
  const globalFacility = useFacilityFilter();
  const canEligibility = useCan("eligibility.read");
  const [facilityId, setFacilityId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [requiredDate, setRequiredDate] = React.useState(tomorrow());
  const [note, setNote] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>([]);

  React.useEffect(() => {
    if (!mode) return;
    if (mode.kind === "create") {
      setFacilityId(globalFacility ?? "");
      setDepartmentId("");
      setRequiredDate(tomorrow());
      setNote("");
      setLines([newLine()]);
    } else {
      const r = mode.request;
      setFacilityId(r.facilityId);
      setDepartmentId(r.departmentId);
      setRequiredDate(r.requiredDate.slice(0, 10));
      setNote(r.note ?? "");
      setLines(
        (r.lines ?? []).map((l) =>
          newLine({ ingredient_id: l.ingredientId, unit_id: l.requestedUnitId, quantity: String(Number(l.requestedQuantity)) })
        )
      );
    }
  }, [mode, globalFacility]);

  const { data: departments = [] } = useDepartments(facilityId || undefined);
  const departmentOptions = departments
    .filter((d) => d.active && d.stockLocationId)
    .map((d) => ({ value: d.id, label: d.name, hint: d.stockLocation?.code ?? d.code }));

  const eligibility = useAllQuery<ItemEligibility>(
    "/item-eligibility",
    { facility_id: facilityId, department_id: departmentId },
    { enabled: open && canEligibility && Boolean(facilityId && departmentId), staleTime: 30_000 }
  );
  const allowed = React.useMemo(() => {
    if (!canEligibility || !facilityId || !departmentId || !eligibility.data) return null;
    return new Set(eligibility.data.filter((e) => e.active).map((e) => e.ingredientId));
  }, [canEligibility, facilityId, departmentId, eligibility.data]);

  const save = useApiMutation<void, SupplyRequest>({
    mutationFn: () => {
      const body = {
        facility_id: facilityId,
        department_id: departmentId,
        required_date: requiredDate,
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: lines.map((l) => ({ ingredient_id: l.ingredient_id, unit_id: l.unit_id, quantity: cleanQty(l.quantity) })),
      };
      if (!mode || mode.kind === "create") return api.post<SupplyRequest>("/requests", body);
      const payload = { ...body, expected_version: mode.request.version };
      return mode.kind === "edit"
        ? api.put<SupplyRequest>(`/requests/${mode.request.id}`, payload)
        : api.post<SupplyRequest>(`/requests/${mode.request.id}/revise`, payload);
    },
    invalidate: INVALIDATE,
    onSuccess: (data) => {
      onOpenChange(false);
      onSaved(data.id);
    },
  });

  const submit = () => {
    if (!facilityId || !departmentId) return toast.error("Vui lòng chọn cơ sở và bộ phận nhận hàng.");
    if (!requiredDate) return toast.error("Vui lòng chọn ngày cần hàng.");
    const err = validateLines(lines, { withUnit: true });
    if (err) return toast.error(err);
    save.mutate();
  };

  const title =
    mode?.kind === "edit"
      ? `Sửa bản nháp ${mode.request.code}`
      : mode?.kind === "revise"
        ? `Chỉnh sửa & gửi lại ${mode.request.code}`
        : "Tạo yêu cầu hàng";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Yêu cầu được lưu dạng nháp; gửi duyệt để hệ thống định tuyến nguồn cấp (kho/nhà cung cấp) theo cấu hình."
      onSubmit={submit}
      submitting={save.isPending}
      submitLabel={mode?.kind === "create" ? "Tạo bản nháp" : "Lưu thay đổi"}
      size="xl"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cơ sở" required>
          <FacilitySelect
            value={facilityId}
            onChange={(v) => {
              setFacilityId(v);
              setDepartmentId("");
            }}
            activeOnly
          />
        </Field>
        <Field label="Bộ phận nhận" required hint="Chỉ hiện bộ phận đã gán kho nhận.">
          <OptionSelect
            value={departmentId}
            onChange={setDepartmentId}
            options={departmentOptions}
            placeholder={facilityId ? "Chọn bộ phận" : "Chọn cơ sở trước"}
            disabled={!facilityId}
          />
        </Field>
        <Field label="Ngày cần hàng" required>
          <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} className="h-9 text-xs" />
        </Field>
      </div>
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16 text-xs" maxLength={1000} />
      </Field>
      <Field
        label="Dòng hàng"
        required
        hint={
          allowed
            ? allowed.size
              ? `Bộ phận được phép xin ${allowed.size} nguyên liệu.`
              : "Bộ phận chưa được cấu hình nguyên liệu được phép xin (Nguồn cấp → Hàng được phép xin)."
            : "Đơn vị khác đơn vị cơ sở cần có quy đổi đang hiệu lực."
        }
      >
        <LinesEditor lines={lines} onChange={setLines} withUnit allowedIngredientIds={allowed} />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

type ActionKind = "submit" | "approve" | "reject" | "cancel" | "refresh";

function RequestDetail({
  id,
  onOpenChange,
  onEdit,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (mode: EditorMode) => void;
}) {
  const query = useApiQuery<SupplyRequest>(id ? `/requests/${id}` : null);
  const r = query.data;
  const can = {
    update: useCan("request.update_draft"),
    submit: useCan("request.submit"),
    approve: useCan("request.approve"),
    reject: useCan("request.reject"),
    cancel: useCan("request.cancel"),
    revise: useCan("request.revise"),
  };
  const [action, setAction] = React.useState<ActionKind | null>(null);

  const run = useApiMutation<{ kind: ActionKind; note: string }>({
    mutationFn: ({ kind, note }) => {
      if (!r) throw new Error("Chưa tải xong yêu cầu.");
      const body = { expected_version: r.version, ...(note ? { note } : {}) };
      const path = kind === "refresh" ? "refresh-routing" : kind;
      return api.post(`/requests/${r.id}/${path}`, body, kind === "approve" ? { idempotencyKey: true } : undefined);
    },
    invalidate: INVALIDATE,
    onSuccess: () => setAction(null),
  });

  const status = r?.status;
  const footer = r && (
    <>
      {status === "DRAFT" && can.update && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onEdit({ kind: "edit", request: r })}>
          <FilePen className="size-3.5" /> Sửa nháp
        </Button>
      )}
      {(status === "DRAFT" || status === "SUBMITTED") && can.update && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAction("refresh")}>
          <RefreshCw className="size-3.5" /> Cập nhật nguồn cấp
        </Button>
      )}
      {status === "REJECTED" && can.revise && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onEdit({ kind: "revise", request: r })}>
          <RotateCcw className="size-3.5" /> Chỉnh sửa lại
        </Button>
      )}
      {(status === "DRAFT" || status === "SUBMITTED" || status === "REJECTED") && can.cancel && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive" onClick={() => setAction("cancel")}>
          <Ban className="size-3.5" /> Huỷ
        </Button>
      )}
      {status === "SUBMITTED" && can.reject && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAction("reject")}>
          <XCircle className="size-3.5" /> Từ chối
        </Button>
      )}
      {status === "DRAFT" && can.submit && (
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAction("submit")}>
          <Send className="size-3.5" /> Gửi duyệt
        </Button>
      )}
      {status === "SUBMITTED" && can.approve && (
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAction("approve")}>
          <CheckCircle2 className="size-3.5" /> Duyệt & tạo đơn
        </Button>
      )}
    </>
  );

  const confirmCopy: Record<ActionKind, { title: string; description: string; label: string; reason?: { label: string; required?: boolean } }> = {
    submit: { title: "Gửi duyệt yêu cầu?", description: "Hệ thống sẽ chốt nguồn cấp cho từng dòng theo cấu hình hiện hành.", label: "Gửi duyệt", reason: { label: "Ghi chú (tuỳ chọn)" } },
    approve: { title: "Duyệt yêu cầu?", description: "Duyệt sẽ tạo đơn thực hiện (xuất kho hoặc đặt nhà cung cấp) cho các dòng.", label: "Duyệt", reason: { label: "Ghi chú duyệt (tuỳ chọn)" } },
    reject: { title: "Từ chối yêu cầu?", description: "Người tạo có thể chỉnh sửa và gửi lại.", label: "Từ chối", reason: { label: "Lý do từ chối", required: true } },
    cancel: { title: "Huỷ yêu cầu?", description: "Yêu cầu bị huỷ sẽ không thể khôi phục.", label: "Huỷ yêu cầu", reason: { label: "Lý do huỷ", required: true } },
    refresh: { title: "Cập nhật nguồn cấp?", description: "Tính lại quy đổi và nguồn cấp của các dòng theo cấu hình mới nhất.", label: "Cập nhật" },
  };
  const copy = action ? confirmCopy[action] : null;

  return (
    <DetailSheet
      open={Boolean(id)}
      onOpenChange={onOpenChange}
      title={r ? r.code : "Chi tiết yêu cầu"}
      badge={r && <StatusBadge status={r.status} />}
      description={r ? `${r.facility?.name ?? ""} · ${r.department?.name ?? ""}` : undefined}
      loading={query.isLoading}
      error={query.error}
      footer={footer}
      wide
    >
      {r && (
        <>
          <InfoGrid
            columns={3}
            items={[
              { label: "Cơ sở", value: r.facility?.name },
              { label: "Bộ phận", value: r.department?.name },
              { label: "Kho nhận", value: r.department?.stockLocation?.name },
              { label: "Ngày cần hàng", value: formatDate(r.requiredDate) },
              { label: "Người tạo", value: r.createdBy?.displayName },
              { label: "Phiên bản", value: `v${r.version}` },
              { label: "Tạo lúc", value: formatDateTime(r.createdAt) },
              { label: "Gửi duyệt", value: r.submittedAt ? formatDateTime(r.submittedAt) : "—" },
              { label: "Quyết định", value: r.decidedAt ? formatDateTime(r.decidedAt) : "—" },
            ]}
          />
          {r.note && (
            <p className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">{r.note}</p>
          )}
          <Section title={`Dòng hàng (${r.lines?.length ?? 0})`}>
            <MiniTable
              headers={[
                { label: "Nguyên liệu" },
                { label: "SL yêu cầu", className: "text-right" },
                { label: "Quy đổi cơ sở", className: "text-right" },
                { label: "Nguồn cấp" },
              ]}
              rows={(r.lines ?? []).map((l) => [
                <Cell2 key="i" title={l.ingredientNameSnapshot} sub={l.ingredient?.code} />,
                formatQty(l.requestedQuantity, l.unitCodeSnapshot),
                formatQty(l.baseQuantity, l.ingredient?.baseUnit?.code),
                l.sourceTypeSnapshot ? (
                  <span key="s">
                    {labelOf(SOURCE_TYPE_LABELS, l.sourceTypeSnapshot)}
                    {l.sourceRuleRevision ? <span className="text-muted-foreground"> · rev {l.sourceRuleRevision}</span> : null}
                  </span>
                ) : (
                  <span key="s" className="text-muted-foreground">Chưa định tuyến</span>
                ),
              ])}
            />
          </Section>
          {(r.orders?.length ?? 0) > 0 && (
            <Section title="Đơn thực hiện đã tạo">
              <MiniTable
                headers={[{ label: "Mã đơn" }, { label: "Loại" }, { label: "Số dòng", className: "text-right" }, { label: "Trạng thái" }, { label: "" }]}
                rows={(r.orders ?? []).map((o) => [
                  <Code key="c">{o.code}</Code>,
                  labelOf(SOURCE_TYPE_LABELS, o.sourceType),
                  o.lines?.length ?? 0,
                  <StatusBadge key="s" status={o.status} />,
                  <Link key="l" href={`/orders?id=${o.id}`} className="inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline">
                    Mở <ExternalLink className="size-3" />
                  </Link>,
                ])}
              />
            </Section>
          )}
          {(r.approvals?.length ?? 0) > 0 && (
            <Section title="Lịch sử phê duyệt">
              <MiniTable
                headers={[{ label: "Thời điểm" }, { label: "Quyết định" }, { label: "Chính sách" }, { label: "Ghi chú" }]}
                rows={(r.approvals ?? []).map((a) => [
                  formatDateTime(a.createdAt),
                  labelOf(APPROVAL_DECISION_LABELS, a.decision),
                  <Code key="p">{a.policy}</Code>,
                  a.note ?? "—",
                ])}
              />
            </Section>
          )}
        </>
      )}
      {copy && (
        <ConfirmDialog
          open={Boolean(action)}
          onOpenChange={(o) => !o && setAction(null)}
          title={copy.title}
          description={copy.description}
          confirmLabel={copy.label}
          destructive={action === "cancel" || action === "reject"}
          {...(copy.reason ? { reason: copy.reason } : {})}
          loading={run.isPending}
          onConfirm={(note) => action && run.mutate({ kind: action, note: note ?? "" })}
        />
      )}
    </DetailSheet>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RequestsPage() {
  const facilityId = useFacilityFilter();
  const canCreate = useCan("request.create");
  const list = useListState({ status: "" });
  const query = usePagedQuery<SupplyRequest>("/requests", { ...list.params, facility_id: facilityId });
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [editor, setEditor] = React.useState<EditorMode | null>(null);
  const [urlId, clearUrlId] = useUrlParam("id");
  const [action, clearAction] = useUrlParam("action");

  React.useEffect(() => {
    if (urlId) {
      setDetailId(urlId);
      clearUrlId();
    }
  }, [urlId, clearUrlId]);
  React.useEffect(() => {
    if (action === "create") {
      if (canCreate) setEditor({ kind: "create" });
      clearAction();
    }
  }, [action, canCreate, clearAction]);

  const columns: Column<SupplyRequest>[] = [
    { key: "code", header: "Mã yêu cầu", cell: (r) => <Code>{r.code}</Code> },
    { key: "where", header: "Cơ sở / Bộ phận", cell: (r) => <Cell2 title={r.facility?.name ?? "—"} sub={r.department?.name} /> },
    { key: "date", header: "Ngày cần", cell: (r) => formatDate(r.requiredDate) },
    { key: "lines", header: "Dòng", cell: (r) => r._count?.lines ?? "—", className: "text-right", headClassName: "text-right" },
    { key: "by", header: "Người tạo", cell: (r) => <Cell2 title={r.createdBy?.displayName ?? "—"} sub={formatDateTime(r.createdAt)} /> },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <AdminLayout permission="request.read">
      <div className="space-y-6">
        <PageHeader
          title="Yêu Cầu Hàng"
          description="Bộ phận lập yêu cầu, gửi duyệt; khi duyệt hệ thống tự tạo đơn xuất kho hoặc đặt nhà cung cấp."
          actions={
            canCreate && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditor({ kind: "create" })}>
                <Plus className="size-3.5" /> Tạo yêu cầu
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
          emptyText="Chưa có yêu cầu hàng nào."
          toolbar={
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <SearchInput value={list.search} onChange={list.setSearch} placeholder="Tìm theo mã hoặc ghi chú..." />
              <OptionSelect
                value={list.filters.status}
                onChange={(v) => list.setFilter("status", v)}
                options={REQUEST_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
                allLabel="Tất cả trạng thái"
                className="sm:w-48"
              />
            </div>
          }
        />
      </div>
      <RequestDetail id={detailId} onOpenChange={(o) => !o && setDetailId(null)} onEdit={setEditor} />
      <RequestEditor mode={editor} onOpenChange={(o) => !o && setEditor(null)} onSaved={setDetailId} />
    </AdminLayout>
  );
}
