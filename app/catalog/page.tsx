"use client";

import * as React from "react";
import { Boxes, Link2, Pencil, Plus, Power, Repeat, Ruler, Tags, Truck } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { PageHeader } from "@/components/shared/page-header";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { IngredientSelect, SupplierSelect, UnitSelect } from "@/components/shared/entity-select";
import { useApiMutation, usePagedQuery } from "@/hooks/use-api";
import { useIngredientGroups } from "@/hooks/use-lookups";
import { useUrlParam } from "@/hooks/use-system";
import { useTabSync } from "@/hooks/use-tab-sync";
import { api } from "@/lib/api/client";
import type {
  Ingredient,
  IngredientGroup,
  Supplier,
  SupplierIngredient,
  Unit,
  UnitConversion,
} from "@/lib/api/types";
import { useCan } from "@/stores/use-auth-store";
import { formatMoney, formatQty } from "@/lib/num";
import { formatDate } from "@/lib/formatters";

function RowActions({
  canManage,
  active,
  onEdit,
  onToggle,
}: {
  canManage: boolean;
  active?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  if (!canManage) return null;
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" size="icon-xs" title="Sửa" onClick={onEdit}>
          <Pencil />
        </Button>
      )}
      {onToggle && (
        <Button variant="ghost" size="icon-xs" title={active ? "Ngừng sử dụng" : "Kích hoạt"} onClick={onToggle}>
          <Power className={active ? "text-destructive" : ""} />
        </Button>
      )}
    </div>
  );
}

function usePagedList<T>(path: string, extra?: Record<string, string | undefined>) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const extraKey = JSON.stringify(extra ?? {});
  React.useEffect(() => setPage(1), [search, extraKey]);
  const query = usePagedQuery<T>(path, { page, page_size: 20, search, ...extra });
  return { query, setPage, search, setSearch };
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
}) {
  const { data: groups = [] } = useIngredientGroups();
  const [form, setForm] = React.useState({ code: "", name: "", base_unit_id: "", group_id: "" });
  React.useEffect(() => {
    if (open)
      setForm({
        code: ingredient?.code ?? "",
        name: ingredient?.name ?? "",
        base_unit_id: ingredient?.baseUnitId ?? "",
        group_id: ingredient?.groupId ?? "",
      });
  }, [open, ingredient]);
  const save = useApiMutation({
    mutationFn: () =>
      ingredient
        ? api.patch(`/ingredients/${ingredient.id}`, { name: form.name.trim(), group_id: form.group_id || null })
        : api.post("/ingredients", {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            base_unit_id: form.base_unit_id,
            ...(form.group_id ? { group_id: form.group_id } : {}),
          }),
    invalidate: ["/ingredients"],
    onSuccess: () => onOpenChange(false),
  });
  return (
    <FormDialog
      tourId={ingredient ? undefined : "catalog-ingredient-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={ingredient ? `Sửa nguyên liệu ${ingredient.code}` : "Thêm nguyên liệu"}
      description="Mã và đơn vị cơ sở không thể đổi sau khi tạo vì được dùng trong sổ kho."
      onSubmit={() => save.mutate()}
      submitting={save.isPending}
      submitDisabled={!ingredient && !form.base_unit_id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã nguyên liệu" required>
          <Input value={form.code} disabled={Boolean(ingredient)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
        </Field>
        <Field label="Đơn vị cơ sở" required>
          <UnitSelect value={form.base_unit_id} onChange={(base_unit_id) => setForm({ ...form, base_unit_id })} disabled={Boolean(ingredient)} activeOnly />
        </Field>
      </div>
      <Field label="Tên nguyên liệu" required>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
      </Field>
      <Field label="Nhóm nguyên liệu">
        <OptionSelect
          value={form.group_id}
          onChange={(group_id) => setForm({ ...form, group_id })}
          options={groups.filter((g) => g.active).map((g) => ({ value: g.id, label: g.name, hint: g.code }))}
          allLabel="Không thuộc nhóm"
        />
      </Field>
    </FormDialog>
  );
}

function IngredientsTab({ autoCreate }: { autoCreate: boolean }) {
  const canManage = useCan("ingredient.manage");
  const { query, setPage, search, setSearch } = usePagedList<Ingredient>("/ingredients");
  const [editing, setEditing] = React.useState<Ingredient | null>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (autoCreate && canManage) setOpen(true);
  }, [autoCreate, canManage]);
  const toggle = useApiMutation<Ingredient>({
    mutationFn: (i) => api.patch(`/ingredients/${i.id}`, { active: !i.active }),
    invalidate: ["/ingredients"],
  });
  const columns: Column<Ingredient>[] = [
    { key: "code", header: "Mã", cell: (i) => <Code>{i.code}</Code>, className: "w-28" },
    { key: "name", header: "Tên nguyên liệu", cell: (i) => <span className="font-medium">{i.name}</span> },
    { key: "group", header: "Nhóm", cell: (i) => i.group?.name ?? <span className="text-muted-foreground">—</span> },
    {
      key: "unit",
      header: "Đơn vị cơ sở",
      cell: (i) => (
        <Badge variant="outline" className="text-[10px]">
          {i.baseUnit?.code ?? "—"}
        </Badge>
      ),
    },
    { key: "active", header: "Trạng thái", cell: (i) => <ActiveBadge active={i.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (i) => (
        <RowActions
          canManage={canManage}
          active={i.active}
          onEdit={() => {
            setEditing(i);
            setOpen(true);
          }}
          onToggle={() => toggle.mutate(i)}
        />
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(i) => i.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm nguyên liệu theo mã hoặc tên..." />
          {canManage && (
            <Button data-tour="catalog-create-ingredient" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm nguyên liệu
            </Button>
          )}
          <IngredientDialog open={open} onOpenChange={setOpen} ingredient={editing} />
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

function GroupsTab() {
  const canManage = useCan("ingredient_group.manage");
  const { query, setPage, search, setSearch } = usePagedList<IngredientGroup>("/ingredient-groups");
  const [editing, setEditing] = React.useState<IngredientGroup | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", name: "" });
  React.useEffect(() => {
    if (open) setForm({ code: editing?.code ?? "", name: editing?.name ?? "" });
  }, [open, editing]);
  const save = useApiMutation({
    mutationFn: () =>
      editing
        ? api.patch(`/ingredient-groups/${editing.id}`, { name: form.name.trim() })
        : api.post("/ingredient-groups", { code: form.code.trim().toUpperCase(), name: form.name.trim() }),
    invalidate: ["/ingredient-groups", "/ingredients"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<IngredientGroup>({
    mutationFn: (g) => api.patch(`/ingredient-groups/${g.id}`, { active: !g.active }),
    invalidate: ["/ingredient-groups"],
  });
  const columns: Column<IngredientGroup>[] = [
    { key: "code", header: "Mã nhóm", cell: (g) => <Code>{g.code}</Code>, className: "w-32" },
    { key: "name", header: "Tên nhóm", cell: (g) => <span className="font-medium">{g.name}</span> },
    { key: "active", header: "Trạng thái", cell: (g) => <ActiveBadge active={g.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (g) => (
        <RowActions canManage={canManage} active={g.active} onEdit={() => { setEditing(g); setOpen(true); }} onToggle={() => toggle.mutate(g)} />
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(g) => g.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm nhóm..." />
          {canManage && (
            <Button data-tour="catalog-create-group" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm nhóm
            </Button>
          )}
          <FormDialog
            tourId={editing ? undefined : "catalog-group-form"}
            open={open}
            onOpenChange={setOpen}
            title={editing ? `Sửa nhóm ${editing.code}` : "Thêm nhóm nguyên liệu"}
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
          >
            <Field label="Mã nhóm" required>
              <Input value={form.code} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
            </Field>
            <Field label="Tên nhóm" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

function UnitsTab() {
  const canManage = useCan("unit.manage");
  const { query, setPage, search, setSearch } = usePagedList<Unit>("/units");
  const [editing, setEditing] = React.useState<Unit | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", name: "", decimal_scale: "3" });
  React.useEffect(() => {
    if (open) setForm({ code: editing?.code ?? "", name: editing?.name ?? "", decimal_scale: String(editing?.decimalScale ?? 3) });
  }, [open, editing]);
  const save = useApiMutation({
    mutationFn: () =>
      editing
        ? api.patch(`/units/${editing.id}`, { name: form.name.trim(), decimal_scale: Number(form.decimal_scale) })
        : api.post("/units", { code: form.code.trim().toUpperCase(), name: form.name.trim(), decimal_scale: Number(form.decimal_scale) }),
    invalidate: ["/units"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<Unit>({
    mutationFn: (u) => api.patch(`/units/${u.id}`, { active: !u.active }),
    invalidate: ["/units"],
  });
  const columns: Column<Unit>[] = [
    { key: "code", header: "Mã đơn vị", cell: (u) => <Code>{u.code}</Code>, className: "w-32" },
    { key: "name", header: "Tên đơn vị", cell: (u) => <span className="font-medium">{u.name}</span> },
    { key: "scale", header: "Số lẻ thập phân", cell: (u) => u.decimalScale },
    { key: "active", header: "Trạng thái", cell: (u) => <ActiveBadge active={u.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (u) => <RowActions canManage={canManage} active={u.active} onEdit={() => { setEditing(u); setOpen(true); }} onToggle={() => toggle.mutate(u)} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(u) => u.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm đơn vị..." />
          {canManage && (
            <Button data-tour="catalog-create-unit" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm đơn vị
            </Button>
          )}
          <FormDialog
            tourId={editing ? undefined : "catalog-unit-form"}
            open={open}
            onOpenChange={setOpen}
            title={editing ? `Sửa đơn vị ${editing.code}` : "Thêm đơn vị tính"}
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mã đơn vị" required>
                <Input value={form.code} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
              </Field>
              <Field label="Số chữ số thập phân">
                <OptionSelect
                  value={form.decimal_scale}
                  onChange={(decimal_scale) => setForm({ ...form, decimal_scale })}
                  options={[0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
                />
              </Field>
            </div>
            <Field label="Tên đơn vị" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

function ConversionsTab() {
  const canManage = useCan("conversion.manage");
  const { query, setPage, search, setSearch } = usePagedList<UnitConversion>("/conversions");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ingredient_id: "", unit_id: "", factor_to_base: "", effective_from: "" });
  React.useEffect(() => {
    if (open) setForm({ ingredient_id: "", unit_id: "", factor_to_base: "", effective_from: new Date().toISOString().slice(0, 16) });
  }, [open]);
  const save = useApiMutation({
    mutationFn: () =>
      api.post("/conversions", {
        ingredient_id: form.ingredient_id,
        unit_id: form.unit_id,
        factor_to_base: form.factor_to_base.trim(),
        effective_from: new Date(form.effective_from).toISOString(),
      }),
    invalidate: ["/conversions"],
    onSuccess: () => setOpen(false),
  });
  const [now] = React.useState(() => Date.now());
  const columns: Column<UnitConversion>[] = [
    { key: "ingredient", header: "Nguyên liệu", cell: (c) => <Cell2 title={c.ingredient?.name ?? "—"} sub={c.ingredient?.code} /> },
    {
      key: "rule",
      header: "Quy đổi",
      cell: (c) => (
        <span className="font-medium">
          1 {c.unit?.code} = {formatQty(c.factorToBase)} <span className="text-muted-foreground">đơn vị cơ sở</span>
        </span>
      ),
    },
    { key: "version", header: "Phiên bản", cell: (c) => `v${c.version}` },
    {
      key: "effective",
      header: "Hiệu lực",
      cell: (c) => {
        const active = new Date(c.effectiveFrom).getTime() <= now && (!c.effectiveTo || new Date(c.effectiveTo).getTime() > now);
        return (
          <div className="flex items-center gap-2">
            <span>
              {formatDate(c.effectiveFrom)} → {c.effectiveTo ? formatDate(c.effectiveTo) : "nay"}
            </span>
            {active && <Badge className="text-[10px]">Đang áp dụng</Badge>}
          </div>
        );
      },
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(c) => c.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      emptyText="Chưa có quy đổi đơn vị nào."
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo nguyên liệu / đơn vị..." />
          {canManage && (
            <Button data-tour="catalog-create-conversion" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" /> Thêm quy đổi
            </Button>
          )}
          <FormDialog
            tourId="catalog-conversion-form"
            open={open}
            onOpenChange={setOpen}
            title="Thêm quy đổi đơn vị"
            description="Tạo phiên bản quy đổi mới; phiên bản cũ tự kết thúc hiệu lực."
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
            submitDisabled={!form.ingredient_id || !form.unit_id || !form.factor_to_base}
          >
            <Field label="Nguyên liệu" required>
              <IngredientSelect value={form.ingredient_id} onChange={(ingredient_id) => setForm({ ...form, ingredient_id })} activeOnly />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đơn vị quy đổi" required>
                <UnitSelect value={form.unit_id} onChange={(unit_id) => setForm({ ...form, unit_id })} activeOnly />
              </Field>
              <Field label="Hệ số quy đổi về đơn vị cơ sở" required hint="Ví dụ: 1 THÙNG = 24 CHAI.">
                <Input value={form.factor_to_base} onChange={(e) => setForm({ ...form, factor_to_base: e.target.value })} inputMode="decimal" className="h-9 text-xs" />
              </Field>
            </div>
            <Field label="Hiệu lực từ" required>
              <DateTimePicker mode="datetime" value={form.effective_from} onChange={(effective_from) => setForm({ ...form, effective_from })} clearable={false} />
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

function SuppliersTab() {
  const canManage = useCan("supplier.manage");
  const { query, setPage, search, setSearch } = usePagedList<Supplier>("/suppliers");
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", name: "", phone: "", email: "" });
  React.useEffect(() => {
    if (open) setForm({ code: editing?.code ?? "", name: editing?.name ?? "", phone: editing?.phone ?? "", email: editing?.email ?? "" });
  }, [open, editing]);
  const save = useApiMutation({
    mutationFn: () =>
      editing
        ? api.patch(`/suppliers/${editing.id}`, { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() })
        : api.post("/suppliers", {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            phone: form.phone.trim(),
            ...(form.email.trim() ? { email: form.email.trim() } : {}),
          }),
    invalidate: ["/suppliers"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<Supplier>({
    mutationFn: (s) => api.patch(`/suppliers/${s.id}`, { active: !s.active }),
    invalidate: ["/suppliers"],
  });
  const columns: Column<Supplier>[] = [
    { key: "code", header: "Mã nhà cung cấp", cell: (s) => <Code>{s.code}</Code>, className: "w-28" },
    { key: "name", header: "Tên nhà cung cấp", cell: (s) => <span className="font-medium">{s.name}</span> },
    { key: "contact", header: "Liên hệ", cell: (s) => <Cell2 title={s.phone || "—"} sub={s.email || undefined} /> },
    { key: "active", header: "Trạng thái", cell: (s) => <ActiveBadge active={s.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (s) => <RowActions canManage={canManage} active={s.active} onEdit={() => { setEditing(s); setOpen(true); }} onToggle={() => toggle.mutate(s)} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(s) => s.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm nhà cung cấp..." />
          {canManage && (
            <Button data-tour="catalog-create-supplier" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm nhà cung cấp
            </Button>
          )}
          <FormDialog
            tourId={editing ? undefined : "catalog-supplier-form"}
            open={open}
            onOpenChange={setOpen}
            title={editing ? `Sửa nhà cung cấp ${editing.code}` : "Thêm nhà cung cấp"}
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
            submitDisabled={!form.code.trim() || !form.name.trim() || !form.phone.trim()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mã nhà cung cấp" required>
                <Input value={form.code} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
              </Field>
              <Field label="Điện thoại" required>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-xs" />
              </Field>
            </div>
            <Field label="Tên nhà cung cấp" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-xs" />
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Supplier ↔ ingredient links
// ---------------------------------------------------------------------------

function SupplierLinksTab() {
  const canManage = useCan("supplier_ingredient.manage");
  const [supplierId, setSupplierId] = React.useState("");
  const { query, setPage, search, setSearch } = usePagedList<SupplierIngredient>("/supplier-ingredients", {
    supplier_id: supplierId || undefined,
  });
  const [editing, setEditing] = React.useState<SupplierIngredient | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ supplier_id: "", ingredient_id: "", supplier_sku: "", reference_price: "", is_preferred: false });
  React.useEffect(() => {
    if (open)
      setForm({
        supplier_id: editing?.supplierId ?? supplierId,
        ingredient_id: editing?.ingredientId ?? "",
        supplier_sku: editing?.supplierSku ?? "",
        reference_price: editing?.referencePrice ?? "",
        is_preferred: editing?.isPreferred ?? false,
      });
  }, [open, editing, supplierId]);
  const save = useApiMutation({
    mutationFn: () =>
      editing
        ? api.patch(`/supplier-ingredients/${editing.id}`, {
            supplier_sku: form.supplier_sku.trim(),
            reference_price: form.reference_price.trim() ? form.reference_price.trim() : null,
            is_preferred: form.is_preferred,
          })
        : api.post("/supplier-ingredients", {
            supplier_id: form.supplier_id,
            ingredient_id: form.ingredient_id,
            ...(form.supplier_sku.trim() ? { supplier_sku: form.supplier_sku.trim() } : {}),
            ...(form.reference_price.trim() ? { reference_price: form.reference_price.trim() } : {}),
            is_preferred: form.is_preferred,
          }),
    invalidate: ["/supplier-ingredients"],
    onSuccess: () => setOpen(false),
  });
  const toggle = useApiMutation<SupplierIngredient>({
    mutationFn: (l) => api.patch(`/supplier-ingredients/${l.id}`, { active: !l.active }),
    invalidate: ["/supplier-ingredients"],
  });
  const columns: Column<SupplierIngredient>[] = [
    { key: "supplier", header: "Nhà cung cấp", cell: (l) => <Cell2 title={l.supplier?.name ?? "—"} sub={l.supplier?.code} /> },
    { key: "ingredient", header: "Nguyên liệu", cell: (l) => <Cell2 title={l.ingredient?.name ?? "—"} sub={l.ingredient?.code} /> },
    { key: "sku", header: "Mã hàng của nhà cung cấp", cell: (l) => (l.supplierSku ? <Code>{l.supplierSku}</Code> : "—") },
    { key: "preferred", header: "Ưu tiên", cell: (l) => l.isPreferred ? <Badge>Ưu tiên</Badge> : "—" },
    {
      key: "price",
      header: "Giá tham chiếu",
      cell: (l) => (
        <span className="font-semibold">
          {l.referencePrice ? `${formatMoney(l.referencePrice)} / ${l.ingredient?.baseUnit?.code ?? ""}` : "—"}
        </span>
      ),
    },
    { key: "active", header: "Trạng thái", cell: (l) => <ActiveBadge active={l.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (l) => <RowActions canManage={canManage} active={l.active} onEdit={() => { setEditing(l); setOpen(true); }} onToggle={() => toggle.mutate(l)} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(l) => l.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      emptyText="Chưa có liên kết nhà cung cấp – nguyên liệu."
      toolbar={
        <>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm nhà cung cấp, nguyên liệu hoặc mã hàng..." />
            <SupplierSelect value={supplierId} onChange={setSupplierId} allLabel="Tất cả nhà cung cấp" className="sm:w-56" />
          </div>
          {canManage && (
            <Button data-tour="catalog-create-supplier-link" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Liên kết mới
            </Button>
          )}
          <FormDialog
            tourId={editing ? undefined : "catalog-supplier-link-form"}
            open={open}
            onOpenChange={setOpen}
            title={editing ? "Sửa liên kết nhà cung cấp" : "Liên kết nguyên liệu với nhà cung cấp"}
            description="Giá tham chiếu theo đơn vị cơ sở được dùng để ước tính giá trị đơn đặt hàng và hàng tồn kho."
            onSubmit={() => save.mutate()}
            submitting={save.isPending}
            submitDisabled={!editing && (!form.supplier_id || !form.ingredient_id)}
          >
            <Field label="Nhà cung cấp" required>
              <SupplierSelect value={form.supplier_id} onChange={(supplier_id) => setForm({ ...form, supplier_id })} disabled={Boolean(editing)} activeOnly />
            </Field>
            <Field label="Nguyên liệu" required>
              <IngredientSelect value={form.ingredient_id} onChange={(ingredient_id) => setForm({ ...form, ingredient_id })} disabled={Boolean(editing)} activeOnly />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mã hàng của nhà cung cấp">
                <Input value={form.supplier_sku} onChange={(e) => setForm({ ...form, supplier_sku: e.target.value })} className="h-9 text-xs" />
              </Field>
              <Field label="Giá tham chiếu (₫)">
                <Input value={form.reference_price} onChange={(e) => setForm({ ...form, reference_price: e.target.value })} inputMode="decimal" className="h-9 text-xs" />
              </Field>
            </div>
            <Field label="Nhà cung cấp ưu tiên" hint="Khi bật, nhà cung cấp đang được ưu tiên của nguyên liệu này sẽ tự động được bỏ đánh dấu.">
              <div className="flex h-9 items-center gap-3">
                <Switch checked={form.is_preferred} onCheckedChange={(is_preferred) => setForm({ ...form, is_preferred })} />
                <span className="text-xs text-muted-foreground">{form.is_preferred ? "Đang được ưu tiên" : "Không ưu tiên"}</span>
              </div>
            </Field>
          </FormDialog>
        </>
      }
    />
  );
}

export default function CatalogPage() {
  const [action, clearAction] = useUrlParam("action");
  const canIngredient = useCan("ingredient.read");
  const canUnit = useCan("unit.read");
  const canConversion = useCan("conversion.read");
  const canSupplier = useCan("supplier.read");
  const canLinks = useCan("supplier_ingredient.read");
  const validTabs = ["ingredients", "groups", "units", "conversions", "suppliers", "links"] as const;
  const defaultTab = canIngredient ? "ingredients" : canUnit ? "units" : canSupplier ? "suppliers" : "conversions";
  const [tab, setTab] = useTabSync(defaultTab, validTabs);
  React.useEffect(() => {
    if (!canIngredient) setTab(canUnit ? "units" : canSupplier ? "suppliers" : "conversions");
  }, [canIngredient, canUnit, canSupplier]);
  React.useEffect(() => {
    if (action) setTimeout(clearAction, 0);
  }, [action, clearAction]);

  return (
    <AdminLayout permission={["ingredient.read", "unit.read", "supplier.read", "conversion.read"]}>
      <div className="space-y-6">
        <PageHeader
          title="Danh mục nguyên liệu & nhà cung cấp"
          description="Quản lý nguyên liệu, nhóm, đơn vị tính, quy đổi đơn vị, nhà cung cấp và giá tham chiếu."
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof validTabs)[number])} className="space-y-4">
          {canIngredient && (
            <TabsContent value="ingredients">
              <IngredientsTab autoCreate={action === "create-ingredient"} />
            </TabsContent>
          )}
          {canIngredient && (
            <TabsContent value="groups">
              <GroupsTab />
            </TabsContent>
          )}
          {canUnit && (
            <TabsContent value="units">
              <UnitsTab />
            </TabsContent>
          )}
          {canConversion && (
            <TabsContent value="conversions">
              <ConversionsTab />
            </TabsContent>
          )}
          {canSupplier && (
            <TabsContent value="suppliers">
              <SuppliersTab />
            </TabsContent>
          )}
          {canLinks && (
            <TabsContent value="links">
              <SupplierLinksTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
