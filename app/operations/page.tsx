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
  UploadCloud,
  Utensils,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import { FacilitySelect, IngredientSelect, StockLocationSelect } from "@/components/shared/entity-select";
import { DetailSheet, InfoGrid, MiniTable, Section } from "@/components/shared/detail-sheet";
import { useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { api } from "@/lib/api/client";
import type {
  AlertRule,
  MenuItemMapping,
  RecipeVersion,
  SalesImportBatch,
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
  "/variance-results",
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
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo liên kết món ăn iPOS"
      description="Ánh xạ mã món trên máy POS iPOS với công thức chế biến trong hệ thống."
      submitLabel="Tạo liên kết"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Cơ sở áp dụng" required>
          <FacilitySelect value={facilityId} onChange={setFacilityId} />
        </Field>
        <Field label="Nguồn POS" required>
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </Field>
        <Field label="Mã món bên iPOS (External Key)" required hint="Mã hàng hoặc ID trên hệ thống iPOS">
          <Input
            placeholder="VD: MON_CAFE_SUA"
            value={externalKey}
            onChange={(e) => setExternalKey(e.target.value)}
          />
        </Field>
        <Field label="Tên món hiển thị" required>
          <Input
            placeholder="VD: Cà phê sữa đá Sài Gòn"
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
              { value: "QUANTITY", label: "Theo số lượng cố định (ĐVT gốc)" },
              { value: "PERCENT", label: "Theo tỷ lệ phần trăm an toàn (%)" },
            ]}
          />
        </Field>
        <Field label="Giá trị ngưỡng" required hint="VD: 10 (cho 10kg) hoặc 15 (cho 15%)">
          <Input
            type="number"
            step="any"
            min="0"
            placeholder="VD: 10"
            value={thresholdValue}
            onChange={(e) => setThresholdValue(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Main Operations Page
// ---------------------------------------------------------------------------

export default function OperationsPage() {
  const globalFacility = useFacilityFilter();
  const [activeTab, setActiveTab] = React.useState<
    "mappings" | "recipes" | "sales" | "variance" | "alerts"
  >("mappings");

  const canManageMapping = useCan("ipos_mapping.manage");
  const canManageRecipe = useCan("recipe.manage");
  const canManageSales = useCan("sales_import.create");
  const canManageAlerts = useCan("alert_rule.manage");

  // State dialogs
  const [openMappingDialog, setOpenMappingDialog] = React.useState(false);
  const [openAlertDialog, setOpenAlertDialog] = React.useState(false);

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
    if (globalFacility !== undefined) {
      mappingList.setFilter("facility_id", globalFacility ?? "");
      salesList.setFilter("facility_id", globalFacility ?? "");
    }
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
    { keepPreviousData: true, enabled: activeTab === "mappings" }
  );

  const recipesQuery = usePagedQuery<RecipeVersion>(
    "/recipes",
    { page: recipeList.page, page_size: recipeList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "recipes" }
  );

  const salesQuery = usePagedQuery<SalesImportBatch>(
    "/sales-imports",
    {
      page: salesList.page,
      page_size: salesList.pageSize,
      facility_id: salesList.filters.facility_id || undefined,
    },
    { keepPreviousData: true, enabled: activeTab === "sales" }
  );

  const varianceQuery = usePagedQuery<VarianceResult>(
    "/variance-results",
    { page: varianceList.page, page_size: varianceList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "variance" }
  );

  const alertsQuery = usePagedQuery<AlertRule>(
    "/alert-rules",
    { page: alertsList.page, page_size: alertsList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "alerts" }
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
      header: "Mã đợt nhập",
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
      header: "Cơ sở POS",
      render: (s) => (
        <Cell2
          top={s.facility?.name ?? s.facilityId}
          bottom={`Nguồn: ${s.source}`}
        />
      ),
    },
    {
      key: "records",
      header: "Số hóa đơn/dòng",
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
          {canManageSales && s.status === "VALIDATED" && (
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
      header: "Lý thuyết tồn",
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
        title="iPOS, Định Mức & Hao Hụt"
        description="Đồng bộ dữ liệu bán hàng từ máy POS, tính toán hao hụt nguyên liệu lý thuyết và cảnh báo ngưỡng an toàn."
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
              <RefreshCw className="h-4 w-4 mr-1" />
              Làm mới
            </Button>
            {activeTab === "mappings" && canManageMapping && (
              <Button size="sm" onClick={() => setOpenMappingDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Thêm món iPOS
              </Button>
            )}
            {activeTab === "alerts" && canManageAlerts && (
              <Button size="sm" onClick={() => setOpenAlertDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Thêm ngưỡng cảnh báo
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "mappings" | "recipes" | "sales" | "variance" | "alerts")
          }
          className="space-y-4"
        >
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="mappings" className="text-xs">
              <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
              Món ăn iPOS
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-xs">
              <ChefHat className="h-3.5 w-3.5 mr-1.5" />
              Công thức (BOM)
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs">
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
              Đợt nhập bán hàng
            </TabsTrigger>
            <TabsTrigger value="variance" className="text-xs">
              <TrendingDown className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Đối soát hao hụt
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">
              <BellRing className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
              Quy tắc cảnh báo
            </TabsTrigger>
          </TabsList>

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
          <TabsContent value="sales" className="space-y-4">
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
              emptyMessage="Không có kết quả hao hụt nào."
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
    </AdminLayout>
  );
}
