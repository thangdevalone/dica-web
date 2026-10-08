"use client";

import * as React from "react";
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChefHat,
  Database,
  ExternalLink,
  FileCheck2,
  Link as LinkIcon,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  TrendingDown,
  Trash2,
  UploadCloud,
  Utensils,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { FacilitySelect, IngredientSelect, StockLocationSelect } from "@/components/shared/entity-select";
import { DetailSheet, InfoGrid, MiniTable, Section } from "@/components/shared/detail-sheet";
import { useAllQuery, useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { useTabSync } from "@/hooks/use-tab-sync";
import { api } from "@/lib/api/client";
import type {
  AlertRule,
  MenuItemMapping,
  RecipeVersion,
  SalesImportBatch,
  Stocktake,
  VarianceResult,
} from "@/lib/api/types";
import { STATUS_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatQty } from "@/lib/num";
import { toast } from "sonner";

const INVALIDATE = [
  "/menu-item-mappings",
  "/recipes",
  "/sales-imports",
  "/variances",
  "/alert-rules",
  "/dashboard/summary",
];

// ---------------------------------------------------------------------------
// Create Mapping Dialog
// ---------------------------------------------------------------------------

function CreateMappingDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [facilityId, setFacilityId] = React.useState("");
  const [source, setSource] = React.useState("IPOS_POS");
  const [externalKey, setExternalKey] = React.useState("");
  const [menuItemName, setMenuItemName] = React.useState("");

  const create = useApiMutation<void, MenuItemMapping>({
    mutationFn: () =>
      api.post<MenuItemMapping>("/menu-item-mappings", {
        facility_id: facilityId,
        source: source.trim(),
        external_item_key: externalKey.trim(),
        menu_item_name: menuItemName.trim(),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã tạo liên kết món ăn iPOS.",
    onSuccess: () => {
      onOpenChange(false);
      setExternalKey("");
      setMenuItemName("");
      onCreated();
    },
  });

  const isValid =
    Boolean(facilityId) &&
    source.trim().length > 0 &&
    externalKey.trim().length > 0 &&
    menuItemName.trim().length > 0;

  return (
    <FormDialog
      tourId="operations-mapping-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo liên kết món ăn iPOS"
      description="Liên kết mã món trên iPOS với định mức nguyên liệu trong hệ thống."
      submitLabel="Tạo liên kết"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Cơ sở áp dụng" required>
          <FacilitySelect value={facilityId} onChange={setFacilityId} />
        </Field>
        <Field label="Tên nguồn dữ liệu" required hint="Tên hệ thống gửi dữ liệu bán hàng, thường là IPOS.">
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </Field>
        <Field label="Mã món trên iPOS" required hint="Nhập đúng mã món trong dữ liệu xuất từ iPOS.">
          <Input
            placeholder="Ví dụ: MON_CAFE_SUA"
            value={externalKey}
            onChange={(e) => setExternalKey(e.target.value)}
          />
        </Field>
        <Field label="Tên món hiển thị" required>
          <Input
            placeholder="Ví dụ: Cà phê sữa đá Sài Gòn"
            value={menuItemName}
            onChange={(e) => setMenuItemName(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Create Alert Rule Dialog
// ---------------------------------------------------------------------------

function CreateAlertRuleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [facilityId, setFacilityId] = React.useState("");
  const [ingredientId, setIngredientId] = React.useState("");
  const [thresholdType, setThresholdType] = React.useState("QUANTITY");
  const [thresholdValue, setThresholdValue] = React.useState("");

  const create = useApiMutation<void, AlertRule>({
    mutationFn: () =>
      api.post<AlertRule>("/alert-rules", {
        ...(facilityId ? { facility_id: facilityId } : {}),
        ...(ingredientId ? { ingredient_id: ingredientId } : {}),
        threshold_type: thresholdType,
        threshold_value: thresholdValue.trim(),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã thiết lập ngưỡng cảnh báo tồn kho.",
    onSuccess: () => {
      onOpenChange(false);
      setThresholdValue("");
      onCreated();
    },
  });

  const isValid =
    (thresholdType === "QUANTITY" || thresholdType === "PERCENT") &&
    /^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(thresholdValue.trim()) &&
    Number(thresholdValue.trim()) > 0;

  return (
    <FormDialog
      tourId="operations-alert-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm quy tắc cảnh báo tồn kho"
      description="Hệ thống sẽ gửi cảnh báo khi mức tồn kho chạm ngưỡng thiết lập."
      submitLabel="Tạo quy tắc"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Cơ sở (để trống nếu toàn hệ thống)">
          <FacilitySelect
            value={facilityId}
            onChange={setFacilityId}
            allLabel="Toàn bộ cơ sở"
          />
        </Field>
        <Field label="Nguyên liệu (để trống nếu toàn bộ)">
          <IngredientSelect
            value={ingredientId}
            onChange={setIngredientId}
            allLabel="Tất cả nguyên liệu"
          />
        </Field>
        <Field label="Loại ngưỡng cảnh báo" required>
          <OptionSelect
            value={thresholdType}
            onChange={setThresholdType}
            options={[
              { value: "QUANTITY", label: "Theo số lượng cố định (đơn vị gốc)" },
              { value: "PERCENT", label: "Theo tỷ lệ phần trăm an toàn (%)" },
            ]}
          />
        </Field>
        <Field label="Giá trị ngưỡng" required hint="Ví dụ: 10 cho 10 kg hoặc 15 cho 15%">
          <Input
            type="number"
            step="any"
            min="0"
            placeholder="Ví dụ: 10"
            value={thresholdValue}
            onChange={(e) => setThresholdValue(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

function CreateRecipeDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const mappings = useAllQuery<MenuItemMapping>(open ? "/menu-item-mappings" : null);
  const [mappingId, setMappingId] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [lines, setLines] = React.useState([{ key: crypto.randomUUID(), ingredientId: "", quantity: "" }]);
  const create = useApiMutation<void, RecipeVersion>({
    mutationFn: () => api.post<RecipeVersion>("/recipes", {
      mapping_id: mappingId,
      stock_location_id: locationId,
      effective_from: new Date(effectiveFrom).toISOString(),
      ingredients: lines.map((line) => ({ ingredient_id: line.ingredientId, base_quantity: line.quantity })),
    }),
    invalidate: INVALIDATE,
    onSuccess: () => { onOpenChange(false); onCreated(); },
  });
  const valid = Boolean(mappingId && locationId && effectiveFrom) && lines.length > 0 && lines.every((line) => line.ingredientId && Number(line.quantity) > 0);
  return <FormDialog tourId="operations-recipe-form" open={open} onOpenChange={onOpenChange} title="Tạo phiên bản định mức" description="Khai báo lượng nguyên liệu tiêu hao cho một món bán trên iPOS." submitLabel="Tạo định mức" loading={create.isPending} disabled={!valid} onSubmit={() => create.mutate()} size="lg">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Món iPOS" required><OptionSelect value={mappingId} onChange={setMappingId} options={(mappings.data ?? []).map((item) => ({ value: item.id, label: `${item.menuItemName} (${item.externalItemKey})` }))} /></Field>
      <Field label="Kho xuất nguyên liệu" required><StockLocationSelect value={locationId} onChange={setLocationId} /></Field>
      <Field label="Hiệu lực từ" required><Input type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></Field>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Thành phần nguyên liệu</span><Button type="button" variant="outline" size="sm" onClick={() => setLines((items) => [...items, { key: crypto.randomUUID(), ingredientId: "", quantity: "" }])}><Plus className="size-3.5" />Thêm dòng</Button></div>
      {lines.map((line, index) => <div key={line.key} className="grid grid-cols-[1fr_140px_36px] gap-2">
        <IngredientSelect value={line.ingredientId} onChange={(value) => setLines((items) => items.map((item) => item.key === line.key ? { ...item, ingredientId: value } : item))} />
        <Input type="number" min="0" step="0.000001" placeholder="Định lượng" value={line.quantity} onChange={(event) => setLines((items) => items.map((item) => item.key === line.key ? { ...item, quantity: event.target.value } : item))} />
        <Button type="button" variant="ghost" size="icon" disabled={lines.length === 1} onClick={() => setLines((items) => items.filter((item) => item.key !== line.key))}><Trash2 className="size-4" /></Button>
      </div>)}
    </div>
  </FormDialog>;
}

function CreateSalesImportDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [facilityId, setFacilityId] = React.useState("");
  const [source, setSource] = React.useState("IPOS");
  const [batchKey, setBatchKey] = React.useState("");
  const [recordsText, setRecordsText] = React.useState("");
  const records = React.useMemo(() => recordsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [external_key, external_item_key, sold_at, quantity] = line.split(",").map((part) => part.trim());
    return { external_key, external_item_key, sold_at, quantity };
  }), [recordsText]);
  const valid = Boolean(facilityId && source.trim() && batchKey.trim() && records.length) && records.every((row) => row.external_key && row.external_item_key && row.sold_at && !Number.isNaN(Date.parse(row.sold_at)) && Number(row.quantity) > 0);
  const create = useApiMutation<void, SalesImportBatch>({
    mutationFn: () => api.post<SalesImportBatch>("/sales-imports", { facility_id: facilityId, source: source.trim(), external_batch_key: batchKey.trim(), records }),
    invalidate: INVALIDATE,
    onSuccess: () => { onOpenChange(false); setRecordsText(""); onCreated(); },
  });
  return <FormDialog tourId="operations-sales-form" open={open} onOpenChange={onOpenChange} title="Tạo đợt nhập bán hàng" description="Mỗi dòng gồm mã giao dịch, mã món iPOS, thời gian có múi giờ và số lượng bán." submitLabel="Tạo đợt nhập" loading={create.isPending} disabled={!valid} onSubmit={() => create.mutate()} size="lg">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Cơ sở" required><FacilitySelect value={facilityId} onChange={setFacilityId} /></Field><Field label="Tên nguồn dữ liệu" required><Input value={source} onChange={(event) => setSource(event.target.value)} /></Field><Field label="Mã đợt dữ liệu" required><Input value={batchKey} onChange={(event) => setBatchKey(event.target.value)} placeholder="BANHANG-20261006-01" /></Field></div>
    <Field label="Dữ liệu bán hàng" required hint="Mỗi dòng theo mẫu: SALE-001,ITEM-001,2026-10-06T12:30:00+07:00,2"><Textarea rows={8} value={recordsText} onChange={(event) => setRecordsText(event.target.value)} /></Field>
    <p className="text-xs text-muted-foreground">Đã đọc {records.length} dòng dữ liệu.</p>
  </FormDialog>;
}

function RecalculateVarianceDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const stocktakes = useAllQuery<Stocktake>(open ? "/stocktakes" : null, { status: "SUBMITTED" });
  const [stocktakeId, setStocktakeId] = React.useState("");
  const recalculate = useApiMutation<void, VarianceResult[]>({
    mutationFn: () => api.post<VarianceResult[]>("/variances/recalculate", { stocktake_id: stocktakeId }),
    invalidate: INVALIDATE,
    onSuccess: () => { onOpenChange(false); onDone(); },
  });
  return <FormDialog tourId="operations-recalculate-form" open={open} onOpenChange={onOpenChange} title="Tính lại chênh lệch" description="Chọn phiếu kiểm kê đã gửi để đối soát với bán hàng iPOS và định mức." submitLabel="Tính lại" loading={recalculate.isPending} disabled={!stocktakeId} onSubmit={() => recalculate.mutate()}>
    <Field label="Phiếu kiểm kê" required><OptionSelect value={stocktakeId} onChange={setStocktakeId} options={(stocktakes.data ?? []).map((item) => ({ value: item.id, label: `${item.stockLocation?.name ?? "Kho"} - ${formatDate(item.businessDate)}` }))} /></Field>
  </FormDialog>;
}

// ---------------------------------------------------------------------------
// Main Operations Page
// ---------------------------------------------------------------------------

export default function OperationsPage() {
  const globalFacility = useFacilityFilter();




  const canManageMapping = useCan("ipos_mapping.manage");
  const canManageRecipe = useCan("recipe.manage");
  const canManageSales = useCan("sales_import.create");
  const canCommitSales = useCan("sales_import.commit");
  const canManageAlerts = useCan("alert_rule.manage");
  const canReadMappings = useCan("ipos_mapping.read");
  const canReadRecipes = useCan("recipe.read");
  const canReadSales = useCan("sales_import.read");
  const canReadVariance = useCan("variance.read");
  const canRecalculateVariance = useCan("variance.recalculate");
  const validTabs = ["mappings", "recipes", "sales", "variance", "alerts"] as const;
  const defaultTab = canReadMappings
    ? "mappings"
    : canReadRecipes
      ? "recipes"
      : canReadSales
        ? "sales"
        : canReadVariance
          ? "variance"
          : "alerts";
  const [activeTab, setActiveTab] = useTabSync(defaultTab, validTabs);

  // State dialogs
  const [openMappingDialog, setOpenMappingDialog] = React.useState(false);
  const [openAlertDialog, setOpenAlertDialog] = React.useState(false);
  const [openRecipeDialog, setOpenRecipeDialog] = React.useState(false);
  const [openSalesDialog, setOpenSalesDialog] = React.useState(false);
  const [openRecalculateDialog, setOpenRecalculateDialog] = React.useState(false);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const permissions = { mappings: canReadMappings, recipes: canReadRecipes, sales: canReadSales, variance: canReadVariance, alerts: canManageAlerts };
    if (permissions[activeTab]) return;
    const allowed = (Object.keys(permissions) as Array<keyof typeof permissions>).find((tab) => permissions[tab]);
    if (allowed) setActiveTab(allowed);
  }, [activeTab, canManageAlerts, canReadMappings, canReadRecipes, canReadSales, canReadVariance]);

  // Lists
  const mappingList = useListState({
    initialFilters: { facility_id: globalFacility ?? "" },
  });
  const recipeList = useListState();
  const salesList = useListState({
    initialFilters: { facility_id: globalFacility ?? "" },
  });
  const varianceList = useListState();
  const alertsList = useListState();

  React.useEffect(() => {
    mappingList.setFilter("facility_id", globalFacility ?? "");
    salesList.setFilter("facility_id", globalFacility ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFacility]);

  // Queries
  const mappingsQuery = usePagedQuery<MenuItemMapping>(
    "/menu-item-mappings",
    {
      page: mappingList.page,
      page_size: mappingList.pageSize,
      facility_id: mappingList.filters.facility_id || undefined,
    },
    { keepPreviousData: true, enabled: activeTab === "mappings" && canReadMappings }
  );

  const recipesQuery = usePagedQuery<RecipeVersion>(
    "/recipes",
    { page: recipeList.page, page_size: recipeList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "recipes" && canReadRecipes }
  );

  const salesQuery = usePagedQuery<SalesImportBatch>(
    "/sales-imports",
    {
      page: salesList.page,
      page_size: salesList.pageSize,
      facility_id: salesList.filters.facility_id || undefined,
    },
    { keepPreviousData: true, enabled: activeTab === "sales" && canReadSales }
  );

  const varianceQuery = usePagedQuery<VarianceResult>(
    "/variances",
    { page: varianceList.page, page_size: varianceList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "variance" && canReadVariance }
  );

  const alertsQuery = usePagedQuery<AlertRule>(
    "/alert-rules",
    { page: alertsList.page, page_size: alertsList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "alerts" && canManageAlerts }
  );

  const adapterQuery = useApiQuery<{ adapter: string; real_ipos_api_connected: boolean; status: string }>(
    canReadSales ? "/sales-imports/adapter-status" : null
  );
  const previewQuery = useApiQuery<SalesImportBatch>(
    previewId ? `/sales-imports/${previewId}/preview` : null
  );

  // Sales Batch Actions (Validate & Commit)
  const validateBatchMutation = useApiMutation<SalesImportBatch, { message: string }>({
    mutationFn: (b) => api.post(`/sales-imports/${b.id}/validate`, {}),
    invalidate: INVALIDATE,
    successMessage: "Đã kiểm tra hợp lệ dữ liệu bán hàng.",
  });

  const commitBatchMutation = useApiMutation<SalesImportBatch, { message: string }>({
    mutationFn: (b) =>
      api.post(`/sales-imports/${b.id}/commit`, {}, { idempotencyKey: `web:sales-import:${b.id}` }),
    invalidate: INVALIDATE,
    successMessage: "Đã ghi nhận dữ liệu bán hàng vào hệ thống tiêu hao.",
  });

  // Columns for Mappings
  const mappingColumns: Column<MenuItemMapping>[] = [
    {
      key: "name",
      header: "Tên món trên hệ thống",
      render: (m) => (
        <Cell2
          top={m.menuItemName}
          bottom={`Nguồn: ${m.source}`}
        />
      ),
    },
    {
      key: "externalKey",
      header: "Mã món iPOS",
      width: "180px",
      render: (m) => <Code>{m.externalItemKey}</Code>,
    },
    {
      key: "facility",
      header: "Cơ sở áp dụng",
      render: (m) => <span className="text-xs">{m.facility?.name ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "120px",
      align: "center",
      render: (m) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            m.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
          }`}
        >
          {m.active ? "Đang dùng" : "Ngừng dùng"}
        </span>
      ),
    },
  ];

  // Columns for Recipes
  const recipeColumns: Column<RecipeVersion>[] = [
    {
      key: "item",
      header: "Món áp dụng",
      render: (r) => (
        <Cell2
          top={r.mapping?.menuItemName ?? "Món thực đơn"}
          bottom={r.mapping?.externalItemKey}
        />
      ),
    },
    {
      key: "location",
      header: "Kho chế biến",
      render: (r) => (
        <Cell2
          top={r.stockLocation?.name ?? "Kho"}
          bottom={r.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "version",
      header: "Phiên bản",
      width: "100px",
      align: "center",
      render: (r) => <span className="text-xs font-semibold">v{r.version}</span>,
    },
    {
      key: "effective",
      header: "Hiệu lực từ",
      width: "150px",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{formatDate(r.effectiveFrom)}</span>
      ),
    },
    {
      key: "ingredients",
      header: "Số thành phần",
      width: "120px",
      align: "center",
      render: (r) => (
        <span className="text-xs font-semibold">{r.ingredients?.length ?? 0} nguyên liệu</span>
      ),
    },
  ];

  // Columns for Sales Imports
  const salesColumns: Column<SalesImportBatch>[] = [
    {
      key: "batch",
      header: "Mã đợt dữ liệu",
      width: "180px",
      render: (s) => (
        <div className="flex flex-col">
          <Code className="font-semibold text-primary">{s.externalKey}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(s.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "facility",
      header: "Cơ sở bán hàng",
      render: (s) => (
        <Cell2
          top={s.facility?.name ?? s.facilityId}
          bottom={`Nguồn: ${s.source}`}
        />
      ),
    },
    {
      key: "records",
      header: "Số dòng bán hàng",
      width: "130px",
      align: "center",
      render: (s) => <span className="text-xs font-semibold">{s._count?.records ?? 0}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "140px",
      align: "center",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "180px",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canManageSales && s.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => validateBatchMutation.mutate(s)}
              disabled={validateBatchMutation.isPending}
            >
              Kiểm tra
            </Button>
          )}
          {canCommitSales && s.status === "VALIDATED" && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => commitBatchMutation.mutate(s)}
              disabled={commitBatchMutation.isPending}
            >
              Ghi nhận
            </Button>
          )}
          {canReadSales && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPreviewId(s.id)}>
              Xem trước
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Columns for Variance
  const varianceColumns: Column<VarianceResult>[] = [
    {
      key: "ingredient",
      header: "Nguyên liệu",
      render: (v) => (
        <Cell2
          top={v.ingredient?.name ?? v.ingredientId}
          bottom={v.ingredient?.code}
        />
      ),
    },
    {
      key: "location",
      header: "Kho lưu trữ",
      render: (v) => <span className="text-xs">{v.stockLocation?.name ?? "—"}</span>,
    },
    {
      key: "expected",
      header: "Tồn dự kiến",
      width: "120px",
      align: "right",
      render: (v) => (
        <span className="font-mono text-xs">{v.expectedClosingSnapshot ? formatQty(v.expectedClosingSnapshot) : "—"}</span>
      ),
    },
    {
      key: "actual",
      header: "Thực tế kiểm kê",
      width: "120px",
      align: "right",
      render: (v) => (
        <span className="font-mono text-xs font-semibold">{formatQty(v.actualClosingSnapshot)}</span>
      ),
    },
    {
      key: "variance",
      header: "Chênh lệch",
      width: "110px",
      align: "right",
      render: (v) => {
        const val = Number(v.varianceQuantity);
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              val < 0 ? "text-destructive" : val > 0 ? "text-blue-600" : "text-muted-foreground"
            }`}
          >
            {v.varianceQuantity ? (val > 0 ? `+${formatQty(v.varianceQuantity)}` : formatQty(v.varianceQuantity)) : "—"}
          </span>
        );
      },
    },
    {
      key: "rate",
      header: "Tỷ lệ lệch",
      width: "100px",
      align: "right",
      render: (v) => (
        <span className="font-mono text-xs font-semibold">
          {v.varianceRate ? `${Number(v.varianceRate).toFixed(1)}%` : "0%"}
        </span>
      ),
    },
  ];

  // Columns for Alerts
  const alertColumns: Column<AlertRule>[] = [
    {
      key: "target",
      header: "Đối tượng áp dụng",
      render: (a) => (
        <Cell2
          top={a.ingredient?.name ?? "Tất cả nguyên liệu"}
          bottom={a.facility?.name ?? "Toàn bộ cơ sở"}
        />
      ),
    },
    {
      key: "type",
      header: "Loại ngưỡng",
      width: "150px",
      render: (a) => (
        <span className="text-xs font-medium">
          {a.thresholdType === "PERCENT" ? "Theo tỷ lệ an toàn (%)" : "Theo lượng cố định"}
        </span>
      ),
    },
    {
      key: "value",
      header: "Mức ngưỡng",
      width: "120px",
      align: "right",
      render: (a) => (
        <span className="font-mono text-xs font-bold text-amber-600">
          {a.thresholdType === "PERCENT" ? `${a.thresholdValue}%` : formatQty(a.thresholdValue)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "120px",
      align: "center",
      render: (a) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            a.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
          }`}
        >
          {a.active ? "Kích hoạt" : "Tắt"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="iPOS, định mức & tiêu hao"
        description="Nhập dữ liệu bán hàng từ iPOS, tính lượng nguyên liệu dự kiến sử dụng và phát hiện chênh lệch."
        icon={Utensils}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "mappings") mappingsQuery.refetch();
                if (activeTab === "recipes") recipesQuery.refetch();
                if (activeTab === "sales") salesQuery.refetch();
                if (activeTab === "variance") varianceQuery.refetch();
                if (activeTab === "alerts") alertsQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            {activeTab === "mappings" && canManageMapping && (
              <Button data-tour="operations-create-mapping" size="sm" onClick={() => setOpenMappingDialog(true)}>
                <Plus className="h-4 w-4" />
                Thêm món iPOS
              </Button>
            )}
            {activeTab === "recipes" && canManageRecipe && (
              <Button data-tour="operations-create-recipe" size="sm" onClick={() => setOpenRecipeDialog(true)}><Plus className="h-4 w-4" />Thêm định mức</Button>
            )}
            {activeTab === "sales" && canManageSales && (
              <Button data-tour="operations-create-sales-import" size="sm" onClick={() => setOpenSalesDialog(true)}><UploadCloud className="h-4 w-4" />Nhập dữ liệu bán</Button>
            )}
            {activeTab === "variance" && canRecalculateVariance && (
              <Button data-tour="operations-recalculate" size="sm" onClick={() => setOpenRecalculateDialog(true)}><RefreshCw className="h-4 w-4" />Tính lại</Button>
            )}
            {activeTab === "alerts" && canManageAlerts && (
              <Button data-tour="operations-create-alert" size="sm" onClick={() => setOpenAlertDialog(true)}>
                <Plus className="h-4 w-4" />
                Thêm ngưỡng cảnh báo
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-3 sm:space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "mappings" | "recipes" | "sales" | "variance" | "alerts")
          }
          className="space-y-4"
        >

          {/* Mappings Tab */}
          <TabsContent value="mappings" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <FacilitySelect
                value={mappingList.filters.facility_id}
                onChange={(v) => mappingList.setFilter("facility_id", v)}
                allLabel="Tất cả cơ sở"
                className="w-56"
              />
              {mappingList.hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={mappingList.reset}>
                  Đặt lại lọc
                </Button>
              )}
            </div>

            <DataTable
              columns={mappingColumns}
              data={mappingsQuery.data?.items ?? []}
              total={mappingsQuery.data?.meta?.total}
              page={mappingList.page}
              pageSize={mappingList.pageSize}
              onPageChange={mappingList.setPage}
              onPageSizeChange={mappingList.setPageSize}
              loading={mappingsQuery.isLoading}
              emptyMessage="Không có món iPOS nào được liên kết."
            />
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <DataTable
              columns={recipeColumns}
              data={recipesQuery.data?.items ?? []}
              total={recipesQuery.data?.meta?.total}
              page={recipeList.page}
              pageSize={recipeList.pageSize}
              onPageChange={recipeList.setPage}
              onPageSizeChange={recipeList.setPageSize}
              loading={recipesQuery.isLoading}
              emptyMessage="Chưa có phiên bản công thức chế biến nào."
            />
          </TabsContent>

          {/* Sales Imports Tab */}
          <TabsContent data-tour="operations-sales-list" value="sales" className="space-y-4">
            {adapterQuery.data && (
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                <span>Bộ kết nối: <strong>{adapterQuery.data.adapter}</strong></span>
                <span className={adapterQuery.data.real_ipos_api_connected ? "text-emerald-600" : "text-amber-600"}>
                  {adapterQuery.data.real_ipos_api_connected ? "Đã kết nối iPOS" : "Chưa kết nối tự động với iPOS — đang nhập thủ công"}
                </span>
              </div>
            )}
            <DataTable
              columns={salesColumns}
              data={salesQuery.data?.items ?? []}
              total={salesQuery.data?.meta?.total}
              page={salesList.page}
              pageSize={salesList.pageSize}
              onPageChange={salesList.setPage}
              onPageSizeChange={salesList.setPageSize}
              loading={salesQuery.isLoading}
              emptyMessage="Chưa có đợt nhập bán hàng nào từ POS."
            />
          </TabsContent>

          {/* Variance Tab */}
          <TabsContent value="variance" className="space-y-4">
            <DataTable
              columns={varianceColumns}
              data={varianceQuery.data?.items ?? []}
              total={varianceQuery.data?.meta?.total}
              page={varianceList.page}
              pageSize={varianceList.pageSize}
              onPageChange={varianceList.setPage}
              onPageSizeChange={varianceList.setPageSize}
              loading={varianceQuery.isLoading}
              emptyMessage="Không có kết quả so sánh tiêu hao nào."
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <DataTable
              columns={alertColumns}
              data={alertsQuery.data?.items ?? []}
              total={alertsQuery.data?.meta?.total}
              page={alertsList.page}
              pageSize={alertsList.pageSize}
              onPageChange={alertsList.setPage}
              onPageSizeChange={alertsList.setPageSize}
              loading={alertsQuery.isLoading}
              emptyMessage="Chưa có quy tắc cảnh báo nào."
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateMappingDialog
        open={openMappingDialog}
        onOpenChange={setOpenMappingDialog}
        onCreated={() => mappingsQuery.refetch()}
      />

      <CreateAlertRuleDialog
        open={openAlertDialog}
        onOpenChange={setOpenAlertDialog}
        onCreated={() => alertsQuery.refetch()}
      />

      <CreateRecipeDialog open={openRecipeDialog} onOpenChange={setOpenRecipeDialog} onCreated={() => recipesQuery.refetch()} />
      <CreateSalesImportDialog open={openSalesDialog} onOpenChange={setOpenSalesDialog} onCreated={() => salesQuery.refetch()} />
      <RecalculateVarianceDialog open={openRecalculateDialog} onOpenChange={setOpenRecalculateDialog} onDone={() => varianceQuery.refetch()} />

      <DetailSheet
        open={Boolean(previewId)}
        onOpenChange={(open) => !open && setPreviewId(null)}
        title={previewQuery.data ? `Xem trước ${previewQuery.data.externalKey}` : "Xem trước đợt nhập"}
        badge={previewQuery.data && <StatusBadge status={previewQuery.data.status} />}
        wide
      >
        {previewQuery.data && <div className="space-y-5">
          <InfoGrid columns={3} items={[
            { label: "Nguồn", value: previewQuery.data.source },
            { label: "Cơ sở", value: previewQuery.data.facility?.name ?? previewQuery.data.facilityId },
            { label: "Số dòng", value: previewQuery.data.records?.length ?? 0 },
          ]} />
          <Section title="Dữ liệu bán hàng">
            <MiniTable headers={[{ label: "Mã giao dịch" }, { label: "Mã món" }, { label: "Thời gian" }, { label: "Số lượng", className: "text-right" }, { label: "Kiểm tra" }]} rows={(previewQuery.data.records ?? []).map((record) => [
              <Code key="key">{record.externalKey}</Code>,
              <Code key="item">{record.externalItemKey}</Code>,
              formatDateTime(record.soldAt),
              formatQty(record.quantity),
              record.validationError ? <span key="error" className="text-destructive">{record.validationError}</span> : <span key="ok" className="text-emerald-600">Hợp lệ</span>,
            ])} />
          </Section>
        </div>}
      </DetailSheet>
    </AdminLayout>
  );
}
