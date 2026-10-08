"use client";

import * as React from "react";
import { Building2, Flame, Pencil, Plus, Power, RefreshCw, Warehouse } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Code, DataTable, type Column } from "@/components/shared/data-table";
import { Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { FacilitySelect, LocationSelect } from "@/components/shared/entity-select";
import { useApiMutation, usePagedQuery } from "@/hooks/use-api";
import { useFacilities } from "@/hooks/use-lookups";
import { useDashboardSummary } from "@/hooks/use-system";
import { useTabSync } from "@/hooks/use-tab-sync";
import { api } from "@/lib/api/client";
import type { Department, Facility, StockLocation } from "@/lib/api/types";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import {
  DEPARTMENT_TYPE_LABELS,
  FACILITY_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
} from "@/constants/labels";
import { formatCompact } from "@/lib/num";
import { cn } from "@/lib/utils";

const toOptions = (map: Record<string, string>) =>
  Object.entries(map).map(([value, label]) => ({ value, label }));

// ---------------------------------------------------------------------------
// Facilities
// ---------------------------------------------------------------------------

function FacilityDialog({
  open,
  onOpenChange,
  facility,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: Facility | null;
}) {
  const [form, setForm] = React.useState({ code: "", name: "", type: "BRANCH" });
  React.useEffect(() => {
    if (open) setForm({ code: facility?.code ?? "", name: facility?.name ?? "", type: facility?.type ?? "BRANCH" });
  }, [open, facility]);
  const save = useApiMutation({
    mutationFn: () =>
      facility
        ? api.patch(`/facilities/${facility.id}`, { name: form.name.trim(), type: form.type })
        : api.post("/facilities", { code: form.code.trim().toUpperCase(), name: form.name.trim(), type: form.type }),
    invalidate: ["/facilities"],
    onSuccess: () => onOpenChange(false),
  });
  return (
    <FormDialog
      tourId={facility ? undefined : "organization-facility-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={facility ? `Sửa cơ sở ${facility.code}` : "Thêm cơ sở mới"}
      description="Mã cơ sở là duy nhất trong tổ chức và không thể đổi sau khi tạo."
      onSubmit={() => save.mutate()}
      submitting={save.isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã cơ sở" required>
          <Input
            value={form.code}
            disabled={Boolean(facility)}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Ví dụ: CN01"
            className="h-9 text-xs uppercase"
          />
        </Field>
        <Field label="Loại hình" required>
          <OptionSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={toOptions(FACILITY_TYPE_LABELS)} />
        </Field>
      </div>
      <Field label="Tên cơ sở" required>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
      </Field>
    </FormDialog>
  );
}

function FacilitiesTab() {
  const { data: facilities = [], isLoading, refetch } = useFacilities();
  const { data: summary } = useDashboardSummary();
  const canManage = useCan("facility.manage");
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [editing, setEditing] = React.useState<Facility | null>(null);
  const [open, setOpen] = React.useState(false);

  const toggle = useApiMutation<Facility>({
    mutationFn: (f) => api.patch(`/facilities/${f.id}`, { active: !f.active }),
    invalidate: ["/facilities"],
  });

  const stats = new Map(summary?.facilities.map((f) => [f.id, f]) ?? []);
  const q = search.trim().toLowerCase();
  const filtered = facilities.filter(
    (f) =>
      (!q || f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)) &&
      (!type || f.type === type)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm cơ sở theo tên hoặc mã..." delay={0} />
          <OptionSelect value={type} onChange={setType} options={toOptions(FACILITY_TYPE_LABELS)} allLabel="Tất cả loại hình" className="sm:w-48" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" /> Làm mới
          </Button>
          {canManage && (
            <Button
              data-tour="organization-create-facility"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-3.5" /> Thêm cơ sở
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground">Không có cơ sở phù hợp.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fac) => {
            const s = stats.get(fac.id);
            return (
              <Card
                key={fac.id}
                className={cn(
                  "gap-3 overflow-hidden border-border/80 transition-all hover:border-foreground/30 hover:shadow-sm",
                  !fac.active && "opacity-70"
                )}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="text-[10px] font-medium uppercase text-muted-foreground">
                      {FACILITY_TYPE_LABELS[fac.type] ?? fac.type}
                    </Badge>
                    <ActiveBadge active={fac.active} />
                  </div>
                  <CardTitle className="font-heading text-base font-bold pt-1">{fac.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">Mã: {fac.code}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                    <div>
                      <p className="text-sm font-bold text-foreground">{s?.stock_locations ?? "—"}</p>
                      <p className="text-[10px]">Kho</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s ? `${formatCompact(s.stock_value)} ₫` : "—"}</p>
                      <p className="text-[10px]">Giá trị tồn</p>
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", s && s.low_stock > 0 ? "text-destructive" : "text-foreground")}>
                        {s?.low_stock ?? "—"}
                      </p>
                      <p className="text-[10px]">Dưới ngưỡng</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 gap-1.5 text-xs font-medium"
                        onClick={() => {
                          setEditing(fac);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" /> Sửa
                      </Button>
                      <Button
                        variant={fac.active ? "destructive" : "outline"}
                        size="sm"
                        className={cn(
                          "h-9 flex-1 gap-1.5 text-xs font-medium",
                          !fac.active && "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        )}
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(fac)}
                      >
                        <Power className="size-3.5" /> {fac.active ? "Ngừng hoạt động" : "Kích hoạt"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <FacilityDialog open={open} onOpenChange={setOpen} facility={editing} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock locations
// ---------------------------------------------------------------------------

function LocationDialog({
  open,
  onOpenChange,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: StockLocation | null;
}) {
  const facilityFilter = useFacilityFilter();
  const [form, setForm] = React.useState({ facility_id: "", code: "", name: "", type: "PHYSICAL" });
  React.useEffect(() => {
    if (open)
      setForm({
        facility_id: location?.facilityId ?? facilityFilter ?? "",
        code: location?.code ?? "",
        name: location?.name ?? "",
        type: location?.type ?? "PHYSICAL",
      });
  }, [open, location, facilityFilter]);
  const save = useApiMutation({
    mutationFn: () =>
      location
        ? api.patch(`/stock-locations/${location.id}`, { name: form.name.trim() })
        : api.post("/stock-locations", {
            facility_id: form.facility_id,
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            type: form.type,
          }),
    invalidate: ["/stock-locations"],
    onSuccess: () => onOpenChange(false),
  });
  return (
    <FormDialog
      tourId={location ? undefined : "organization-location-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={location ? `Sửa kho ${location.code}` : "Thêm điểm lưu kho"}
      description="Kho trung chuyển dùng để theo dõi hàng đang vận chuyển giữa các cơ sở."
      onSubmit={() => save.mutate()}
      submitting={save.isPending}
      submitDisabled={!location && !form.facility_id}
    >
      <Field label="Cơ sở" required>
        <FacilitySelect value={form.facility_id} onChange={(facility_id) => setForm({ ...form, facility_id })} disabled={Boolean(location)} activeOnly />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã kho" required>
          <Input value={form.code} disabled={Boolean(location)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
        </Field>
        <Field label="Loại kho">
          <OptionSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={toOptions(LOCATION_TYPE_LABELS)} disabled={Boolean(location)} />
        </Field>
      </div>
      <Field label="Tên kho" required>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
      </Field>
    </FormDialog>
  );
}

function LocationsTab() {
  const facilityId = useFacilityFilter();
  const canManage = useCan("stock_location.manage");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<StockLocation | null>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setPage(1), [search, facilityId]);
  const query = usePagedQuery<StockLocation>("/stock-locations", { page, page_size: 20, search, facility_id: facilityId });
  const toggle = useApiMutation<StockLocation>({
    mutationFn: (l) => api.patch(`/stock-locations/${l.id}`, { active: !l.active }),
    invalidate: ["/stock-locations"],
  });

  const columns: Column<StockLocation>[] = [
    { key: "code", header: "Mã kho", cell: (l) => <Code>{l.code}</Code>, className: "w-32" },
    { key: "name", header: "Tên kho", cell: (l) => <span className="font-medium">{l.name}</span> },
    { key: "facility", header: "Cơ sở", cell: (l) => <span className="text-muted-foreground">{l.facility?.name ?? "—"}</span> },
    {
      key: "type",
      header: "Loại",
      cell: (l) => (
        <Badge variant="outline" className="text-[10px]">
          {LOCATION_TYPE_LABELS[l.type] ?? l.type}
        </Badge>
      ),
    },
    { key: "active", header: "Trạng thái", cell: (l) => <ActiveBadge active={l.active} /> },
    {
      key: "actions",
      header: "",
      headClassName: "w-24",
      className: "text-right",
      cell: (l) =>
        canManage && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-xs" title="Sửa" onClick={() => { setEditing(l); setOpen(true); }}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-xs" title={l.active ? "Ngừng" : "Kích hoạt"} onClick={() => toggle.mutate(l)}>
              <Power className={l.active ? "text-destructive" : ""} />
            </Button>
          </div>
        ),
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
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm kho theo mã hoặc tên..." />
          {canManage && (
            <Button data-tour="organization-create-location" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm kho
            </Button>
          )}
          <LocationDialog open={open} onOpenChange={setOpen} location={editing} />
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}) {
  const facilityFilter = useFacilityFilter();
  const [form, setForm] = React.useState({ facility_id: "", stock_location_id: "", code: "", name: "", type: "KITCHEN" });
  React.useEffect(() => {
    if (open)
      setForm({
        facility_id: department?.facilityId ?? facilityFilter ?? "",
        stock_location_id: department?.stockLocationId ?? "",
        code: department?.code ?? "",
        name: department?.name ?? "",
        type: department?.type ?? "KITCHEN",
      });
  }, [open, department, facilityFilter]);
  const save = useApiMutation({
    mutationFn: () =>
      department
        ? api.patch(`/departments/${department.id}`, {
            name: form.name.trim(),
            type: form.type,
            stock_location_id: form.stock_location_id || null,
          })
        : api.post("/departments", {
            facility_id: form.facility_id,
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            type: form.type,
            ...(form.stock_location_id ? { stock_location_id: form.stock_location_id } : {}),
          }),
    invalidate: ["/departments"],
    onSuccess: () => onOpenChange(false),
  });
  return (
    <FormDialog
      tourId={department ? undefined : "organization-department-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={department ? `Sửa bộ phận ${department.code}` : "Thêm bộ phận"}
      description="Bộ phận cần gắn kho nhận hàng để có thể tạo yêu cầu cấp hàng."
      onSubmit={() => save.mutate()}
      submitting={save.isPending}
      submitDisabled={!department && !form.facility_id}
    >
      <Field label="Cơ sở" required>
        <FacilitySelect
          value={form.facility_id}
          onChange={(facility_id) => setForm({ ...form, facility_id, stock_location_id: "" })}
          disabled={Boolean(department)}
          activeOnly
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã bộ phận" required>
          <Input value={form.code} disabled={Boolean(department)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-xs uppercase" />
        </Field>
        <Field label="Phân loại" required>
          <OptionSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={toOptions(DEPARTMENT_TYPE_LABELS)} />
        </Field>
      </div>
      <Field label="Tên bộ phận" required>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
      </Field>
      <Field label="Kho nhận hàng" hint="Kho vật lý thuộc cùng cơ sở.">
        <LocationSelect
          value={form.stock_location_id}
          onChange={(stock_location_id) => setForm({ ...form, stock_location_id })}
          facilityId={form.facility_id || undefined}
          physicalOnly
          activeOnly
          allLabel="Không gắn kho"
          disabled={!form.facility_id}
        />
      </Field>
    </FormDialog>
  );
}

function DepartmentsTab() {
  const facilityId = useFacilityFilter();
  const canManage = useCan("department.manage");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setPage(1), [search, facilityId]);
  const query = usePagedQuery<Department>("/departments", { page, page_size: 20, search, facility_id: facilityId });
  const toggle = useApiMutation<Department>({
    mutationFn: (d) => api.patch(`/departments/${d.id}`, { active: !d.active }),
    invalidate: ["/departments"],
  });

  const columns: Column<Department>[] = [
    { key: "code", header: "Mã", cell: (d) => <Code>{d.code}</Code>, className: "w-28" },
    { key: "name", header: "Tên bộ phận", cell: (d) => <span className="font-medium">{d.name}</span> },
    { key: "facility", header: "Cơ sở", cell: (d) => <span className="text-muted-foreground">{d.facility?.name ?? "—"}</span> },
    {
      key: "location",
      header: "Kho nhận hàng",
      cell: (d) =>
        d.stockLocation ? (
          <span>
            {d.stockLocation.name} <span className="font-mono text-[10px] text-muted-foreground">{d.stockLocation.code}</span>
          </span>
        ) : (
          <span className="text-destructive">Chưa gắn kho</span>
        ),
    },
    {
      key: "type",
      header: "Phân loại",
      cell: (d) => (
        <Badge variant="outline" className="text-[10px]">
          {DEPARTMENT_TYPE_LABELS[d.type] ?? d.type}
        </Badge>
      ),
    },
    { key: "active", header: "Trạng thái", cell: (d) => <ActiveBadge active={d.active} /> },
    {
      key: "actions",
      header: "",
      headClassName: "w-24",
      className: "text-right",
      cell: (d) =>
        canManage && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-xs" title="Sửa" onClick={() => { setEditing(d); setOpen(true); }}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-xs" title={d.active ? "Ngừng" : "Kích hoạt"} onClick={() => toggle.mutate(d)}>
              <Power className={d.active ? "text-destructive" : ""} />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={query.data?.items}
      rowKey={(d) => d.id}
      loading={query.isLoading}
      fetching={query.isFetching}
      error={query.error}
      meta={query.data?.meta}
      onPageChange={setPage}
      toolbar={
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm bộ phận theo mã hoặc tên..." />
          {canManage && (
            <Button data-tour="organization-create-department" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-3.5" /> Thêm bộ phận
            </Button>
          )}
          <DepartmentDialog open={open} onOpenChange={setOpen} department={editing} />
        </>
      }
    />
  );
}

export default function OrganizationPage() {
  const canFacility = useCan("facility.read");
  const canLocation = useCan("stock_location.read");
  const canDepartment = useCan("department.read");
  const { data: summary } = useDashboardSummary();
  const validTabs = ["facilities", "locations", "departments"] as const;
  const defaultTab = canFacility ? "facilities" : canLocation ? "locations" : "departments";
  const [tab, setTab] = useTabSync(defaultTab, validTabs);

  return (
    <AdminLayout permission={["facility.read", "stock_location.read", "department.read"]}>
      <div className="space-y-6">
        <PageHeader
          title="Cơ cấu tổ chức & chi nhánh"
          description="Thiết lập mạng lưới kho tổng, bếp trung tâm, chi nhánh, điểm lưu kho và bộ phận vận hành."
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof validTabs)[number])} className="space-y-6">
          {canFacility && (
            <TabsContent value="facilities">
              <FacilitiesTab />
            </TabsContent>
          )}
          {canLocation && (
            <TabsContent value="locations">
              <LocationsTab />
            </TabsContent>
          )}
          {canDepartment && (
            <TabsContent value="departments">
              <DepartmentsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
