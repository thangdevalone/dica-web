"use client";

import * as React from "react";
import { GitBranch, History, Pencil, Plus, Power, Upload } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import {
  DepartmentSelect,
  FacilitySelect,
  IngredientSelect,
  LocationSelect,
  SupplierSelect,
} from "@/components/shared/entity-select";
import { DetailSheet, MiniTable } from "@/components/shared/detail-sheet";
import { useApiMutation, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { useTabSync } from "@/hooks/use-tab-sync";
import { useFacilities, useIngredientGroups, useIngredients, useStockLocations, useSuppliers } from "@/hooks/use-lookups";
import { api } from "@/lib/api/client";
import type { GroupEligibility, ItemEligibility, SourceRule, SourceRuleRevision } from "@/lib/api/types";
import { SOURCE_TYPE_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDateTime } from "@/lib/formatters";
import { toast } from "sonner";

const SOURCING_TABS = ["rules", "group-eligibility", "eligibility"] as const;

// ---------------------------------------------------------------------------
// Item eligibility
// ---------------------------------------------------------------------------

function EligibilityTab() {
  const facilityId = useFacilityFilter();
  const canManage = useCan("eligibility.manage");
  const list = useListState({ department_id: "" });
  const query = usePagedQuery<ItemEligibility>("/item-eligibility", { ...list.params, facility_id: facilityId });
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ facility_id: "", department_id: "", ingredient_ids: [] as string[], max_quantity_per_request: "", pending: "" });
  React.useEffect(() => {
    if (open) setForm({ facility_id: facilityId ?? "", department_id: "", ingredient_ids: [], max_quantity_per_request: "", pending: "" });
  }, [open, facilityId]);
  const { data: ingredients = [] } = useIngredients();

  const save = useApiMutation({
    mutationFn: async () => {
      let last;
      for (const ingredient_id of form.ingredient_ids) {
        last = await api.post("/item-eligibility", {
          facility_id: form.facility_id,
          department_id: form.department_id,
          ingredient_id,
          max_quantity_per_request: form.max_quantity_per_request.trim() || null,
          active: true,
        });
      }
      return last!;
    },
    successMessage: () => `Đã thêm ${form.ingredient_ids.length} nguyên liệu vào danh sách được phép xin.`,
    invalidate: ["/item-eligibility"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<ItemEligibility>({
    mutationFn: (e) =>
      api.post("/item-eligibility", {
        facility_id: e.facilityId,
        department_id: e.departmentId,
        ingredient_id: e.ingredientId,
        active: !e.active,
      }),
    invalidate: ["/item-eligibility"],
  });

  const columns: Column<ItemEligibility>[] = [
    { key: "facility", header: "Cơ sở", cell: (e) => e.facility?.name ?? "—" },
    { key: "department", header: "Bộ phận", cell: (e) => <Cell2 title={e.department?.name ?? "—"} sub={e.department?.code} /> },
    { key: "ingredient", header: "Nguyên liệu", cell: (e) => <Cell2 title={e.ingredient?.name ?? "—"} sub={`${e.ingredient?.code ?? ""}${e.ingredient?.baseUnit ? ` · ${e.ingredient.baseUnit.code}` : ""}`} /> },
    { key: "maxQuantityPerRequest", header: "Tối đa/lần xin", className: "text-right", headClassName: "text-right", cell: (e) => e.maxQuantityPerRequest ? `${e.maxQuantityPerRequest} ${e.ingredient?.baseUnit?.code ?? ""}` : "Không giới hạn" },
    { key: "active", header: "Trạng thái", cell: (e) => <ActiveBadge active={e.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (e) =>
        canManage && (
          <Button variant="ghost" size="icon-xs" title={e.active ? "Ngừng cho phép" : "Cho phép lại"} onClick={() => toggle.mutate(e)}>
            <Power className={e.active ? "text-destructive" : ""} />
          </Button>
        ),
    },
  ];

  const selected = new Set(form.ingredient_ids);
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(e) => e.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={list.setPage}
      emptyText="Chưa có nguyên liệu nào được phép xin."
      toolbar={
        <>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Tìm nguyên liệu, bộ phận..." />
            <DepartmentSelect
              value={list.filters.department_id}
              onChange={(v) => list.setFilter("department_id", v)}
              facilityId={facilityId}
              allLabel="Tất cả bộ phận"
              className="sm:w-56"
            />
          </div>
          {canManage && (
            <Button data-tour="sourcing-create-eligibility" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" /> Thêm hàng được phép xin
            </Button>
          )}
          <FormDialog
            tourId="sourcing-eligibility-form"
            open={open}
            onOpenChange={setOpen}
            title="Thêm hàng bộ phận được phép xin"
            description="Chọn những nguyên liệu bộ phận này có thể đưa vào phiếu xin hàng."
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
            submitDisabled={!form.facility_id || !form.department_id || form.ingredient_ids.length === 0}
            size="lg"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cơ sở" required>
                <FacilitySelect value={form.facility_id} onChange={(v) => setForm({ ...form, facility_id: v, department_id: "" })} activeOnly />
              </Field>
              <Field label="Bộ phận" required>
                <DepartmentSelect
                  value={form.department_id}
                  onChange={(v) => setForm({ ...form, department_id: v })}
                  facilityId={form.facility_id || undefined}
                  disabled={!form.facility_id}
                  activeOnly
                />
              </Field>
            </div>
            <Field label="Thêm nguyên liệu" hint="Chọn lần lượt từng nguyên liệu để thêm vào danh sách.">
              <IngredientSelect
                value=""
                onChange={(id) => id && !selected.has(id) && setForm({ ...form, ingredient_ids: [...form.ingredient_ids, id] })}
                activeOnly
              />
            </Field>
            <Field label="Số lượng tối đa mỗi lần xin" hint="Không bắt buộc; tính theo đơn vị cơ sở và áp dụng cho các nguyên liệu đang chọn.">
              <Input
                type="number"
                min="0.001"
                step="0.001"
                value={form.max_quantity_per_request}
                onChange={(e) => setForm({ ...form, max_quantity_per_request: e.target.value })}
                placeholder="Ví dụ: 25.5"
              />
            </Field>
            <div className="flex min-h-10 flex-wrap gap-1.5 rounded-xl border border-dashed border-border p-2">
              {form.ingredient_ids.length === 0 && <span className="text-[11px] text-muted-foreground">Chưa chọn nguyên liệu.</span>}
              {form.ingredient_ids.map((id) => {
                const ing = ingredients.find((i) => i.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer text-[11px]"
                    title="Bấm để bỏ"
                    onClick={() => setForm({ ...form, ingredient_ids: form.ingredient_ids.filter((x) => x !== id) })}
                  >
                    {ing?.name ?? id} ✕
                  </Badge>
                );
              })}
            </div>
          </FormDialog>
        </>
      }
    />
  );
}

function GroupEligibilityTab() {
  const facilityId = useFacilityFilter();
  const canManage = useCan("eligibility.manage");
  const list = useListState({ department_id: "" });
  const query = usePagedQuery<GroupEligibility>("/group-eligibility", { ...list.params, facility_id: facilityId });
  const { data: groups = [] } = useIngredientGroups();
  const [editing, setEditing] = React.useState<GroupEligibility | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ facility_id: "", department_id: "", ingredient_group_id: "", max_quantity_per_request: "" });
  const openCreate = () => {
    setEditing(null);
    setForm({ facility_id: facilityId ?? "", department_id: "", ingredient_group_id: "", max_quantity_per_request: "" });
    setOpen(true);
  };
  const openEdit = (item: GroupEligibility) => {
    setEditing(item);
    setForm({
      facility_id: item.facilityId,
      department_id: item.departmentId,
      ingredient_group_id: item.ingredientGroupId,
      max_quantity_per_request: item.maxQuantityPerRequest ?? "",
    });
    setOpen(true);
  };
  const save = useApiMutation({
    mutationFn: () =>
      api.post("/group-eligibility", {
        ...form,
        max_quantity_per_request: form.max_quantity_per_request.trim() || null,
        active: editing?.active ?? true,
      }),
    invalidate: ["/group-eligibility", "/item-eligibility"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<GroupEligibility>({
    mutationFn: (item) =>
      api.post("/group-eligibility", {
        facility_id: item.facilityId,
        department_id: item.departmentId,
        ingredient_group_id: item.ingredientGroupId,
        active: !item.active,
      }),
    invalidate: ["/group-eligibility", "/item-eligibility"],
  });
  const columns: Column<GroupEligibility>[] = [
    { key: "facility", header: "Cơ sở", cell: (item) => item.facility?.name ?? "—" },
    { key: "department", header: "Bộ phận", cell: (item) => <Cell2 title={item.department?.name ?? "—"} sub={item.department?.code} /> },
    { key: "group", header: "Nhóm hàng", cell: (item) => <Cell2 title={item.ingredientGroup?.name ?? "—"} sub={item.ingredientGroup?.code} /> },
    { key: "limit", header: "Tối đa/mặt hàng/lần", className: "text-right", headClassName: "text-right", cell: (item) => item.maxQuantityPerRequest ?? "Không giới hạn" },
    { key: "active", header: "Trạng thái", cell: (item) => <ActiveBadge active={item.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (item) => canManage && (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" title="Sửa hạn mức" onClick={() => openEdit(item)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-xs" title={item.active ? "Ngừng cho phép" : "Cho phép lại"} onClick={() => toggle.mutate(item)}>
            <Power className={item.active ? "text-destructive" : ""} />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(item) => item.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={list.setPage}
      emptyText="Chưa có nhóm hàng nào được cấp cho bộ phận."
      toolbar={
        <>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Tìm nhóm hàng, bộ phận..." />
            <DepartmentSelect value={list.filters.department_id} onChange={(value) => list.setFilter("department_id", value)} facilityId={facilityId} allLabel="Tất cả bộ phận" className="sm:w-56" />
          </div>
          {canManage && (
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreate}>
              <Plus className="size-3.5" /> Cấp quyền theo nhóm
            </Button>
          )}
          <FormDialog
            open={open}
            onOpenChange={(next) => { setOpen(next); if (!next) setEditing(null); }}
            title={editing ? "Sửa quyền theo nhóm hàng" : "Cấp nhóm hàng cho bộ phận"}
            description={editing ? "Điều chỉnh số lượng tối đa cho từng mặt hàng trong nhóm." : "Các nguyên liệu hiện tại và được thêm sau này vào nhóm đều được phép xin. Cấu hình từng nguyên liệu sẽ được ưu tiên nếu có."}
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
            submitDisabled={!form.facility_id || !form.department_id || !form.ingredient_group_id}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cơ sở" required>
                <FacilitySelect value={form.facility_id} onChange={(value) => setForm({ ...form, facility_id: value, department_id: "" })} disabled={Boolean(editing)} activeOnly />
              </Field>
              <Field label="Bộ phận" required>
                <DepartmentSelect value={form.department_id} onChange={(department_id) => setForm({ ...form, department_id })} facilityId={form.facility_id || undefined} disabled={Boolean(editing) || !form.facility_id} activeOnly />
              </Field>
            </div>
            <Field label="Nhóm hàng" required>
              <OptionSelect
                value={form.ingredient_group_id}
                onChange={(ingredient_group_id) => setForm({ ...form, ingredient_group_id })}
                options={groups.filter((group) => group.active).map((group) => ({ value: group.id, label: `${group.code} · ${group.name}` }))}
                placeholder="Chọn nhóm hàng"
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label="Số lượng tối đa cho từng mặt hàng/lần xin" hint="Không bắt buộc; mỗi mặt hàng dùng đơn vị cơ sở riêng.">
              <Input type="number" min="0.001" step="0.001" value={form.max_quantity_per_request} onChange={(event) => setForm({ ...form, max_quantity_per_request: event.target.value })} placeholder="Ví dụ: 25.5" />
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Source rules
// ---------------------------------------------------------------------------

function RuleDialog({ open, onOpenChange, rule }: { open: boolean; onOpenChange: (o: boolean) => void; rule: SourceRule | null }) {
  const facilityFilter = useFacilityFilter();
  const [form, setForm] = React.useState({ facility_id: "", ingredient_id: "", source_type: "STOCK", source_stock_location_id: "", supplier_id: "" });
  React.useEffect(() => {
    if (open)
      setForm({
        facility_id: rule?.facilityId ?? facilityFilter ?? "",
        ingredient_id: rule?.ingredientId ?? "",
        source_type: rule?.sourceType ?? "STOCK",
        source_stock_location_id: rule?.sourceStockLocationId ?? "",
        supplier_id: rule?.supplierId ?? "",
      });
  }, [open, rule, facilityFilter]);
  const save = useApiMutation({
    mutationFn: () =>
      api.post("/source-rules", {
        facility_id: form.facility_id,
        ingredient_id: form.ingredient_id,
        source_type: form.source_type,
        ...(form.source_type === "STOCK" ? { source_stock_location_id: form.source_stock_location_id } : { supplier_id: form.supplier_id }),
      }),
    invalidate: ["/source-rules"],
    onSuccess: () => onOpenChange(false),
  });
  const ready =
    form.facility_id && form.ingredient_id && (form.source_type === "STOCK" ? form.source_stock_location_id : form.supplier_id);
  return (
    <FormDialog
      tourId={rule ? undefined : "sourcing-rule-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={rule ? "Đổi nguồn cấp" : "Cấu hình nguồn cấp"}
      description="Mỗi nguyên liệu tại một cơ sở chỉ có một nguồn cấp đang áp dụng. Mỗi lần đổi nguồn sẽ được lưu thành một phiên bản để tra cứu lại."
      onSubmit={() => save.mutate()}
      submitting={save.isPending}
      submitDisabled={!ready}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cơ sở nhận" required>
          <FacilitySelect value={form.facility_id} onChange={(v) => setForm({ ...form, facility_id: v })} disabled={Boolean(rule)} activeOnly />
        </Field>
        <Field label="Loại nguồn" required>
          <OptionSelect
            value={form.source_type}
            onChange={(v) => setForm({ ...form, source_type: v })}
            options={[
              { value: "STOCK", label: SOURCE_TYPE_LABELS.STOCK! },
              { value: "SUPPLIER", label: SOURCE_TYPE_LABELS.SUPPLIER! },
            ]}
          />
        </Field>
      </div>
      <Field label="Nguyên liệu" required>
        <IngredientSelect value={form.ingredient_id} onChange={(v) => setForm({ ...form, ingredient_id: v })} disabled={Boolean(rule)} activeOnly />
      </Field>
      {form.source_type === "STOCK" ? (
        <Field label="Kho xuất" required hint="Kho vật lý sẽ xuất hàng cho cơ sở.">
          <LocationSelect value={form.source_stock_location_id} onChange={(v) => setForm({ ...form, source_stock_location_id: v })} physicalOnly activeOnly />
        </Field>
      ) : (
        <Field label="Nhà cung cấp" required hint="Nhà cung cấp phải có nguyên liệu này trong mục Danh mục → Hàng & giá nhà cung cấp.">
          <SupplierSelect value={form.supplier_id} onChange={(v) => setForm({ ...form, supplier_id: v })} activeOnly />
        </Field>
      )}
    </FormDialog>
  );
}

function HistorySheet({ rule, onOpenChange }: { rule: SourceRule | null; onOpenChange: (o: boolean) => void }) {
  const query = usePagedQuery<SourceRuleRevision>(rule ? `/source-rules/${rule.id}/history` : null, { page: 1, page_size: 50 });
  const { data: locations = [] } = useStockLocations();
  const { data: suppliers = [] } = useSuppliers();
  const describe = (data: unknown) => {
    if (!data || typeof data !== "object") return "—";
    const d = data as { source_type?: string; source_id?: string | null };
    const name =
      d.source_type === "STOCK"
        ? locations.find((l) => l.id === d.source_id)?.name
        : suppliers.find((s) => s.id === d.source_id)?.name;
    return `${labelOf(SOURCE_TYPE_LABELS, d.source_type)} · ${name ?? d.source_id ?? "—"}`;
  };
  return (
    <DetailSheet
      open={Boolean(rule)}
      onOpenChange={onOpenChange}
      title="Lịch sử nguồn cấp"
      description={rule ? `${rule.facility?.name ?? ""} · ${rule.ingredient?.name ?? ""}` : undefined}
      loading={query.isLoading}
      error={query.error}
    >
      <MiniTable
        headers={[{ label: "Phiên bản" }, { label: "Thời điểm" }, { label: "Trước" }, { label: "Sau" }]}
        rows={(query.data?.items ?? []).map((h) => [`#${h.revision}`, formatDateTime(h.changedAt), describe(h.beforeData), describe(h.afterData)])}
      />
    </DetailSheet>
  );
}

const CSV_HINT = "Mỗi dòng gồm: mã cơ sở, mã nguyên liệu, loại nguồn (STOCK = kho hoặc SUPPLIER = nhà cung cấp), mã kho hoặc mã nhà cung cấp.";

function BulkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    if (open) setText("");
  }, [open]);
  const { data: facilities = [] } = useFacilities();
  const { data: ingredients = [] } = useIngredients();
  const { data: locations = [] } = useStockLocations();
  const { data: suppliers = [] } = useSuppliers();
  const save = useApiMutation<{ facility_id: string; ingredient_id: string; source_type: string; source_stock_location_id?: string; supplier_id?: string }[]>({
    mutationFn: (items) => api.post("/source-rules/bulk-update", { items }),
    invalidate: ["/source-rules"],
    onSuccess: () => onOpenChange(false),
  });
  const submit = () => {
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!rows.length) return toast.error("Chưa nhập dòng nào.");
    const items = [];
    for (const [i, row] of rows.entries()) {
      const [fc, ic, type, sc] = row.split(/[,;\t]/).map((x) => x.trim().toUpperCase());
      const facility = facilities.find((f) => f.code.toUpperCase() === fc);
      const ingredient = ingredients.find((x) => x.code.toUpperCase() === ic);
      if (!facility || !ingredient || (type !== "STOCK" && type !== "SUPPLIER"))
        return toast.error(`Dòng ${i + 1}: mã cơ sở/nguyên liệu/loại nguồn không hợp lệ.`);
      if (type === "STOCK") {
        const loc = locations.find((l) => l.code.toUpperCase() === sc);
        if (!loc) return toast.error(`Dòng ${i + 1}: không tìm thấy kho ${sc}.`);
        items.push({ facility_id: facility.id, ingredient_id: ingredient.id, source_type: type, source_stock_location_id: loc.id });
      } else {
        const sup = suppliers.find((s) => s.code.toUpperCase() === sc);
        if (!sup) return toast.error(`Dòng ${i + 1}: không tìm thấy nhà cung cấp ${sc}.`);
        items.push({ facility_id: facility.id, ingredient_id: ingredient.id, source_type: type, supplier_id: sup.id });
      }
    }
    save.mutate(items);
  };
  return (
    <FormDialog
      tourId="sourcing-bulk-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Cập nhật nguồn cấp hàng loạt"
      description={CSV_HINT}
      onSubmit={submit}
      submitting={save.isPending}
      submitLabel="Áp dụng"
      size="lg"
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"BR01,ING-001,STOCK,WH-MAIN\nBR01,ING-002,SUPPLIER,SUP-01"}
        className="min-h-48 font-mono text-xs"
      />
    </FormDialog>
  );
}

function RulesTab() {
  const facilityId = useFacilityFilter();
  const canManage = useCan("source_rule.manage");
  const canBulk = useCan("source_rule.bulk_update");
  const list = useListState({ source_type: "" });
  const query = usePagedQuery<SourceRule>("/source-rules", { ...list.params, facility_id: facilityId });
  const [editing, setEditing] = React.useState<SourceRule | null>(null);
  const [open, setOpen] = React.useState(false);
  const [bulk, setBulk] = React.useState(false);
  const [history, setHistory] = React.useState<SourceRule | null>(null);

  const columns: Column<SourceRule>[] = [
    { key: "facility", header: "Cơ sở nhận", cell: (r) => r.facility?.name ?? "—" },
    { key: "ingredient", header: "Nguyên liệu", cell: (r) => <Cell2 title={r.ingredient?.name ?? "—"} sub={r.ingredient?.code} /> },
    {
      key: "type",
      header: "Loại nguồn",
      cell: (r) => (
        <Badge variant={r.sourceType === "STOCK" ? "secondary" : "outline"} className="text-[10px]">
          {labelOf(SOURCE_TYPE_LABELS, r.sourceType)}
        </Badge>
      ),
    },
    {
      key: "source",
      header: "Nguồn",
      cell: (r) =>
        r.sourceType === "STOCK" ? (
          <Cell2 title={r.sourceStockLocation?.name ?? "—"} sub={r.sourceStockLocation?.facility?.name} />
        ) : (
          <Cell2 title={r.supplier?.name ?? "—"} sub={r.supplier?.code} />
        ),
    },
    { key: "rev", header: "Phiên bản", cell: (r) => <Code>#{r.revision}</Code> },
    { key: "from", header: "Hiệu lực từ", cell: (r) => formatDateTime(r.effectiveFrom) },
    { key: "active", header: "Trạng thái", cell: (r) => <ActiveBadge active={r.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-xs" title="Lịch sử" onClick={() => setHistory(r)}>
            <History />
          </Button>
          {canManage && (
            <Button variant="ghost" size="icon-xs" title="Đổi nguồn" onClick={() => { setEditing(r); setOpen(true); }}>
              <GitBranch />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={query.data?.items}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        meta={query.data?.meta}
        onPageChange={list.setPage}
        emptyText="Chưa cấu hình nguồn cấp."
        toolbar={
          <>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <SearchInput value={list.search} onChange={list.setSearch} placeholder="Tìm nguyên liệu..." />
              <OptionSelect
                value={list.filters.source_type}
                onChange={(v) => list.setFilter("source_type", v)}
                options={[
                  { value: "STOCK", label: SOURCE_TYPE_LABELS.STOCK! },
                  { value: "SUPPLIER", label: SOURCE_TYPE_LABELS.SUPPLIER! },
                ]}
                allLabel="Tất cả loại nguồn"
                className="sm:w-44"
              />
            </div>
            <div className="flex gap-2">
              {canBulk && (
                <Button data-tour="sourcing-bulk" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setBulk(true)}>
                  <Upload className="size-3.5" /> Nhập danh sách
                </Button>
              )}
              {canManage && (
                <Button data-tour="sourcing-create-rule" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="size-3.5" /> Thêm nguồn cấp
                </Button>
              )}
            </div>
          </>
        }
      />
      <RuleDialog open={open} onOpenChange={setOpen} rule={editing} />
      <BulkDialog open={bulk} onOpenChange={setBulk} />
      <HistorySheet rule={history} onOpenChange={(o) => !o && setHistory(null)} />
    </>
  );
}

export default function SourcingPage() {
  const canEligibility = useCan("eligibility.read");
  const canRules = useCan("source_rule.read");
  const validTabs = React.useMemo(
    () => SOURCING_TABS.filter((candidate) => candidate === "rules" ? canRules : canEligibility),
    [canRules, canEligibility],
  );
  const defaultTab = validTabs[0] ?? "rules";
  const [tab, setTab] = useTabSync(defaultTab, validTabs);
  return (
    <AdminLayout permission={["source_rule.read", "eligibility.read"]}>
      <div className="space-y-6">
        <PageHeader
          title="Nguồn hàng & hàng được xin"
          description="Chọn nơi cấp nguyên liệu và quy định từng bộ phận được phép xin những mặt hàng nào."
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof validTabs)[number])} className="space-y-4">
          {canRules && (
            <TabsContent value="rules">
              <RulesTab />
            </TabsContent>
          )}
          {canEligibility && (
            <TabsContent value="group-eligibility">
              <GroupEligibilityTab />
            </TabsContent>
          )}
          {canEligibility && (
            <TabsContent value="eligibility">
              <EligibilityTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
