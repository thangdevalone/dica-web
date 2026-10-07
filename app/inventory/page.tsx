"use client";

import * as React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Flame,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Warehouse,
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
import { useStockLocations } from "@/hooks/use-lookups";
import { useUrlParam } from "@/hooks/use-system";
import { api } from "@/lib/api/client";
import type {
  DamageReport,
  InventoryAdjustment,
  LedgerEntryType,
  StockBalance,
  StockLedgerEntry,
  Stocktake,
} from "@/lib/api/types";
import { LEDGER_ENTRY_LABELS, STATUS_LABELS, labelOf } from "@/constants/labels";
import { useFacilityFilter } from "@/stores/use-app-store";
import { useCan } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { formatQty } from "@/lib/num";
import { toast } from "sonner";

const INVALIDATE = [
  "/stock-balances",
  "/stock-ledger",
  "/inventory-adjustments",
  "/stocktakes",
  "/damage-reports",
  "/dashboard/summary",
];

// ---------------------------------------------------------------------------
// Create Adjustment Dialog
// ---------------------------------------------------------------------------

function CreateAdjustmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [stockLocationId, setStockLocationId] = React.useState("");
  const [ingredientId, setIngredientId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");

  const create = useApiMutation<void, InventoryAdjustment>({
    mutationFn: () =>
      api.post<InventoryAdjustment>("/inventory-adjustments", {
        stock_location_id: stockLocationId,
        ingredient_id: ingredientId,
        quantity: quantity.trim(),
        reason: reason.trim(),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã tạo phiếu điều chỉnh tồn kho.",
    onSuccess: () => {
      onOpenChange(false);
      setStockLocationId("");
      setIngredientId("");
      setQuantity("");
      setReason("");
      onCreated();
    },
  });

  const isValid =
    Boolean(stockLocationId) &&
    Boolean(ingredientId) &&
    /^-?(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(quantity.trim()) &&
    Number(quantity.trim()) !== 0 &&
    reason.trim().length >= 3;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo phiếu điều chỉnh tồn kho"
      description="Điều chỉnh tăng (+) hoặc giảm (-) số lượng tồn kho của một mặt hàng."
      submitLabel="Tạo phiếu điều chỉnh"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Kho lưu trữ" required>
          <StockLocationSelect
            value={stockLocationId}
            onChange={setStockLocationId}
            physicalOnly
          />
        </Field>
        <Field label="Nguyên liệu cần điều chỉnh" required>
          <IngredientSelect value={ingredientId} onChange={setIngredientId} />
        </Field>
        <Field
          label="Số lượng điều chỉnh (+ hoặc -)"
          required
          hint="VD: +5 hoặc -2.5 (dấu trừ nếu hao hụt, dấu cộng nếu nhập thêm ngoài luồng)"
        >
          <Input
            placeholder="VD: -2.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </Field>
        <Field label="Lý do điều chỉnh" required hint="Tối thiểu 3 ký tự">
          <Textarea
            placeholder="VD: Kiểm đếm bù trừ chênh lệch đầu ca..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Create Damage Report Dialog
// ---------------------------------------------------------------------------

function CreateDamageDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [stockLocationId, setStockLocationId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [ingredientId, setIngredientId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [lineReason, setLineReason] = React.useState("");

  const create = useApiMutation<void, DamageReport>({
    mutationFn: () =>
      api.post<DamageReport>("/damage-reports", {
        stock_location_id: stockLocationId,
        reason: reason.trim(),
        lines: [
          {
            ingredient_id: ingredientId,
            quantity: quantity.trim(),
            ...(lineReason.trim() ? { reason: lineReason.trim() } : {}),
          },
        ],
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã tạo biên bản báo hỏng nguyên liệu.",
    onSuccess: () => {
      onOpenChange(false);
      setStockLocationId("");
      setReason("");
      setIngredientId("");
      setQuantity("");
      setLineReason("");
      onCreated();
    },
  });

  const isValid =
    Boolean(stockLocationId) &&
    reason.trim().length >= 3 &&
    Boolean(ingredientId) &&
    /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(quantity.trim()) &&
    Number(quantity.trim()) > 0;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Lập biên bản báo hỏng / hết hạn"
      description="Ghi nhận nguyên vật liệu hỏng, ôi thiu hoặc rách vỡ cần loại bỏ khỏi tồn kho."
      submitLabel="Tạo biên bản"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Kho lưu trữ" required>
          <StockLocationSelect
            value={stockLocationId}
            onChange={setStockLocationId}
            physicalOnly
          />
        </Field>
        <Field label="Lý do chung" required hint="Lý do lập biên bản hủy hỏng">
          <Textarea
            placeholder="VD: Hàng hỏng do mất điện kho lạnh..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </Field>
        <div className="space-y-3 pt-2 border-t border-border/60">
          <Field label="Nguyên liệu hỏng" required>
            <IngredientSelect value={ingredientId} onChange={setIngredientId} />
          </Field>
          <Field label="Số lượng hỏng" required>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="VD: 3.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Ghi chú chi tiết mặt hàng">
            <Input
              placeholder="VD: Bao bì rách vỡ..."
              value={lineReason}
              onChange={(e) => setLineReason(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Main Inventory Page
// ---------------------------------------------------------------------------

export default function InventoryPage() {
  const globalFacility = useFacilityFilter();
  const [activeTab, setActiveTab] = React.useState<
    "balances" | "ledger" | "adjustments" | "stocktakes" | "damage"
  >("balances");
  const [urlTab, clearUrlTab] = useUrlParam("tab");

  const canReadBalances = useCan("stock.read");
  const canReadLedger = useCan("stock_ledger.read");
  const canReadAdjustments = useCan("adjustment.read");
  const canReadStocktakes = useCan("stocktake.read");
  const canReadDamage = useCan("damage.read");
  const canAdjust = useCan("adjustment.create");
  const canApproveAdjust = useCan("adjustment.approve");
  const canPostAdjust = useCan("adjustment.post");
  const canStocktake = useCan("stocktake.create");
  const canDamage = useCan("damage.create");
  const canSubmitDamage = useCan("damage.submit");
  const canConfirmDamage = useCan("damage.confirm");

  React.useEffect(() => {
    const permissions = {
      balances: canReadBalances,
      ledger: canReadLedger,
      adjustments: canReadAdjustments,
      stocktakes: canReadStocktakes,
      damage: canReadDamage,
    };
    if (urlTab && urlTab in permissions) {
      const tab = urlTab as keyof typeof permissions;
      if (permissions[tab]) setActiveTab(tab);
      clearUrlTab();
      return;
    }
    if (permissions[activeTab]) return;
    const allowed = (Object.keys(permissions) as Array<keyof typeof permissions>).find(
      (tab) => permissions[tab]
    );
    if (allowed) setActiveTab(allowed);
  }, [activeTab, canReadAdjustments, canReadBalances, canReadDamage, canReadLedger, canReadStocktakes, clearUrlTab, urlTab]);

  // State dialogs
  const [openAdjustDialog, setOpenAdjustDialog] = React.useState(false);
  const [openDamageDialog, setOpenDamageDialog] = React.useState(false);

  // Lists
  const balanceList = useListState({
    initialFilters: { facility_id: globalFacility ?? "", stock_location_id: "" },
  });
  const ledgerList = useListState({
    initialFilters: { stock_location_id: "", entry_type: "" },
  });
  const adjustList = useListState();
  const stocktakeList = useListState();
  const damageList = useListState();

  React.useEffect(() => {
    balanceList.setFilter("facility_id", globalFacility ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFacility]);

  // Queries
  const balancesQuery = usePagedQuery<StockBalance>(
    "/stock-balances",
    {
      page: balanceList.page,
      page_size: balanceList.pageSize,
      search: balanceList.search || undefined,
      facility_id: balanceList.filters.facility_id || undefined,
      stock_location_id: balanceList.filters.stock_location_id || undefined,
    },
    { keepPreviousData: true, enabled: activeTab === "balances" && canReadBalances }
  );

  const ledgerQuery = usePagedQuery<StockLedgerEntry>(
    "/stock-ledger",
    {
      page: ledgerList.page,
      page_size: ledgerList.pageSize,
      stock_location_id: ledgerList.filters.stock_location_id || undefined,
      entry_type: ledgerList.filters.entry_type || undefined,
    },
    { keepPreviousData: true, enabled: activeTab === "ledger" && canReadLedger }
  );

  const adjustmentsQuery = usePagedQuery<InventoryAdjustment>(
    "/inventory-adjustments",
    { page: adjustList.page, page_size: adjustList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "adjustments" && canReadAdjustments }
  );

  const stocktakesQuery = usePagedQuery<Stocktake>(
    "/stocktakes",
    { page: stocktakeList.page, page_size: stocktakeList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "stocktakes" && canReadStocktakes }
  );

  const damagesQuery = usePagedQuery<DamageReport>(
    "/damage-reports",
    { page: damageList.page, page_size: damageList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "damage" && canReadDamage }
  );

  // Action mutations for adjustments
  const approveAdjustMutation = useApiMutation<InventoryAdjustment, { message: string }>({
    mutationFn: (adj) =>
      api.post(`/inventory-adjustments/${adj.id}/approve`, { expected_version: adj.version }),
    invalidate: INVALIDATE,
    successMessage: "Đã phê duyệt phiếu điều chỉnh.",
  });

  const postAdjustMutation = useApiMutation<InventoryAdjustment, { message: string }>({
    mutationFn: (adj) =>
      api.post(
        `/inventory-adjustments/${adj.id}/post`,
        { expected_version: adj.version },
        { idempotencyKey: `web:adjustment:${adj.id}:v${adj.version}` }
      ),
    invalidate: INVALIDATE,
    successMessage: "Đã ghi sổ điều chỉnh tồn kho vào sổ cái.",
  });

  // Action mutations for damage
  const submitDamageMutation = useApiMutation<DamageReport, DamageReport>({
    mutationFn: (d) =>
      api.post<DamageReport>(`/damage-reports/${d.id}/submit`, {
        expected_version: d.version,
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã gửi báo hỏng chờ người có quyền xác nhận.",
  });

  const confirmDamageMutation = useApiMutation<DamageReport, DamageReport>({
    mutationFn: (d) =>
      api.post<DamageReport>(`/damage-reports/${d.id}/confirm`, {
        expected_version: d.version,
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã xác nhận báo hỏng và xuất trừ tồn kho.",
  });

  // Columns for Balances
  const balanceColumns: Column<StockBalance>[] = [
    {
      key: "ingredient",
      header: "Nguyên liệu",
      render: (b) => (
        <Cell2
          top={b.ingredient?.name ?? b.ingredientId}
          bottom={b.ingredient?.code}
        />
      ),
    },
    {
      key: "location",
      header: "Kho lưu trữ",
      render: (b) => (
        <Cell2
          top={b.stockLocation?.name ?? b.stockLocationId}
          bottom={b.stockLocation?.facility?.name ?? b.stockLocation?.code}
        />
      ),
    },
    {
      key: "unit",
      header: "ĐVT",
      width: "80px",
      render: (b) => <span className="text-xs">{b.ingredient?.baseUnit?.code ?? "—"}</span>,
    },
    {
      key: "quantity",
      header: "Tồn kho thực tế",
      width: "140px",
      align: "right",
      render: (b) => {
        const q = Number(b.quantity);
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              q <= 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatQty(b.quantity)}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      header: "Cập nhật lúc",
      width: "160px",
      render: (b) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(b.updatedAt)}</span>
      ),
    },
  ];

  // Columns for Ledger
  const ledgerColumns: Column<StockLedgerEntry>[] = [
    {
      key: "time",
      header: "Thời điểm ghi sổ",
      width: "160px",
      render: (l) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(l.postedAt)}</span>
      ),
    },
    {
      key: "location",
      header: "Kho ghi sổ",
      render: (l) => (
        <Cell2
          top={l.stockLocation?.name ?? l.stockLocationId}
          bottom={l.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "ingredient",
      header: "Nguyên liệu",
      render: (l) => (
        <Cell2
          top={l.ingredient?.name ?? l.ingredientId}
          bottom={l.ingredient?.code}
        />
      ),
    },
    {
      key: "type",
      header: "Nghiệp vụ",
      width: "150px",
      render: (l) => (
        <span className="text-xs font-medium text-foreground">
          {labelOf(LEDGER_ENTRY_LABELS, l.entryType)}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Số lượng ghi nhận",
      width: "140px",
      align: "right",
      render: (l) => {
        const q = Number(l.quantity);
        const isPos = q > 0;
        return (
          <span
            className={`font-mono text-xs font-semibold inline-flex items-center gap-0.5 ${
              isPos ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {isPos ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {formatQty(l.quantity)}
          </span>
        );
      },
    },
    {
      key: "postingKey",
      header: "Mã giao dịch",
      width: "160px",
      render: (l) => <Code className="text-[11px]">{l.postingKey}</Code>,
    },
  ];

  // Columns for Adjustments
  const adjustColumns: Column<InventoryAdjustment>[] = [
    {
      key: "date",
      header: "Ngày lập",
      width: "120px",
      render: (a) => <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>,
    },
    {
      key: "location",
      header: "Kho điều chỉnh",
      render: (a) => (
        <Cell2
          top={a.stockLocation?.name ?? a.stockLocationId}
          bottom={a.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "ingredient",
      header: "Nguyên liệu",
      render: (a) => (
        <Cell2
          top={a.ingredient?.name ?? a.ingredientId}
          bottom={a.ingredient?.code}
        />
      ),
    },
    {
      key: "quantity",
      header: "Biến động",
      width: "110px",
      align: "right",
      render: (a) => {
        const q = Number(a.quantity);
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              q > 0 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {q > 0 ? `+${formatQty(a.quantity)}` : formatQty(a.quantity)}
          </span>
        );
      },
    },
    {
      key: "reason",
      header: "Lý do",
      render: (a) => <span className="text-xs text-foreground">{a.reason}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "130px",
      align: "center",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "140px",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canApproveAdjust && a.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              onClick={() => approveAdjustMutation.mutate(a)}
              disabled={approveAdjustMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Duyệt
            </Button>
          )}
          {canPostAdjust && a.status === "APPROVED" && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => postAdjustMutation.mutate(a)}
              disabled={postAdjustMutation.isPending}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              Ghi sổ
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Columns for Stocktakes
  const stocktakeColumns: Column<Stocktake>[] = [
    {
      key: "date",
      header: "Ngày kiểm kê",
      width: "130px",
      render: (s) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{formatDate(s.businessDate)}</span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(s.cutoffAt)}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Kho kiểm kê",
      render: (s) => (
        <Cell2
          top={s.stockLocation?.name ?? s.stockLocationId}
          bottom={s.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "lines",
      header: "Số mặt hàng",
      width: "110px",
      align: "center",
      render: (s) => (
        <span className="text-xs font-medium">{s._count?.lines ?? s.lines?.length ?? 0}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "130px",
      align: "center",
      render: (s) => <StatusBadge status={s.status} />,
    },
  ];

  // Columns for Damage Reports
  const damageColumns: Column<DamageReport>[] = [
    {
      key: "code",
      header: "Mã biên bản",
      width: "140px",
      render: (d) => (
        <div className="flex flex-col">
          <Code className="font-semibold text-primary">{d.code}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(d.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Kho lưu trữ",
      render: (d) => (
        <Cell2
          top={d.stockLocation?.name ?? d.stockLocationId}
          bottom={d.stockLocation?.facility?.name}
        />
      ),
    },
    {
      key: "reason",
      header: "Lý do hủy hỏng",
      render: (d) => <span className="text-xs text-foreground">{d.reason}</span>,
    },
    {
      key: "lines",
      header: "Số mặt hàng",
      width: "100px",
      align: "center",
      render: (d) => <span className="text-xs font-medium">{d._count?.lines ?? d.lines?.length ?? 0}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "130px",
      align: "center",
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "130px",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {canSubmitDamage && d.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => submitDamageMutation.mutate(d)}
              disabled={submitDamageMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" />
              Gửi xác nhận
            </Button>
          )}
          {canConfirmDamage && d.status === "SUBMITTED" && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs bg-destructive hover:bg-destructive/90"
              onClick={() => confirmDamageMutation.mutate(d)}
              disabled={confirmDamageMutation.isPending}
            >
              <Flame className="h-3.5 w-3.5" />
              Xác nhận hủy
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Kho & Quản Lý Tồn Kho"
        description="Tra cứu tồn kho tức thời, theo dõi sổ cái biến động, điều chỉnh, kiểm kê và xử lý hao hụt."
        icon={Warehouse}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "balances") balancesQuery.refetch();
                if (activeTab === "ledger") ledgerQuery.refetch();
                if (activeTab === "adjustments") adjustmentsQuery.refetch();
                if (activeTab === "stocktakes") stocktakesQuery.refetch();
                if (activeTab === "damage") damagesQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            {activeTab === "adjustments" && canAdjust && (
              <Button size="sm" onClick={() => setOpenAdjustDialog(true)}>
                <Plus className="h-4 w-4" />
                Lập phiếu điều chỉnh
              </Button>
            )}
            {activeTab === "damage" && canDamage && (
              <Button size="sm" onClick={() => setOpenDamageDialog(true)}>
                <Plus className="h-4 w-4" />
                Lập biên bản báo hỏng
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "balances" | "ledger" | "adjustments" | "stocktakes" | "damage")
          }
          className="space-y-4"
        >
          <TabsList className="bg-muted/70 p-1">
            {canReadBalances && <TabsTrigger value="balances" className="text-xs">
              <Boxes className="h-3.5 w-3.5" />
              Tồn kho tức thời
            </TabsTrigger>}
            {canReadLedger && <TabsTrigger value="ledger" className="text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Sổ cái kho (Ledger)
            </TabsTrigger>}
            {canReadAdjustments && <TabsTrigger value="adjustments" className="text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Điều chỉnh tồn
            </TabsTrigger>}
            {canReadStocktakes && <TabsTrigger value="stocktakes" className="text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Kiểm kê định kỳ
            </TabsTrigger>}
            {canReadDamage && <TabsTrigger value="damage" className="text-xs">
              <Flame className="h-3.5 w-3.5 text-destructive" />
              Hao hụt & Hủy hỏng
            </TabsTrigger>}
          </TabsList>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <SearchInput
                placeholder="Tìm tên hoặc mã nguyên liệu..."
                value={balanceList.search}
                onChange={balanceList.setSearch}
                className="w-64"
              />
              <FacilitySelect
                value={balanceList.filters.facility_id}
                onChange={(v) => {
                  balanceList.setFilter("facility_id", v);
                  balanceList.setFilter("stock_location_id", "");
                }}
                allLabel="Tất cả cơ sở"
                className="w-56"
              />
              <StockLocationSelect
                facilityId={balanceList.filters.facility_id || undefined}
                value={balanceList.filters.stock_location_id}
                onChange={(v) => balanceList.setFilter("stock_location_id", v)}
                allLabel="Tất cả kho"
                className="w-56"
              />
              {balanceList.hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={balanceList.reset}>
                  Đặt lại lọc
                </Button>
              )}
            </div>

            <DataTable
              columns={balanceColumns}
              data={balancesQuery.data?.items ?? []}
              total={balancesQuery.data?.meta?.total}
              page={balanceList.page}
              pageSize={balanceList.pageSize}
              onPageChange={balanceList.setPage}
              onPageSizeChange={balanceList.setPageSize}
              loading={balancesQuery.isLoading}
              emptyMessage="Không có dữ liệu tồn kho nào."
            />
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <StockLocationSelect
                value={ledgerList.filters.stock_location_id}
                onChange={(v) => ledgerList.setFilter("stock_location_id", v)}
                allLabel="Tất cả kho"
                className="w-56"
              />
              <OptionSelect
                value={ledgerList.filters.entry_type}
                onChange={(v) => ledgerList.setFilter("entry_type", v)}
                options={Object.entries(LEDGER_ENTRY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                placeholder="Tất cả nghiệp vụ"
                allLabel="Tất cả nghiệp vụ"
                className="w-52"
              />
              {ledgerList.hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={ledgerList.reset}>
                  Đặt lại lọc
                </Button>
              )}
            </div>

            <DataTable
              columns={ledgerColumns}
              data={ledgerQuery.data?.items ?? []}
              total={ledgerQuery.data?.meta?.total}
              page={ledgerList.page}
              pageSize={ledgerList.pageSize}
              onPageChange={ledgerList.setPage}
              onPageSizeChange={ledgerList.setPageSize}
              loading={ledgerQuery.isLoading}
              emptyMessage="Không có bản ghi sổ cái nào."
            />
          </TabsContent>

          {/* Adjustments Tab */}
          <TabsContent value="adjustments" className="space-y-4">
            <DataTable
              columns={adjustColumns}
              data={adjustmentsQuery.data?.items ?? []}
              total={adjustmentsQuery.data?.meta?.total}
              page={adjustList.page}
              pageSize={adjustList.pageSize}
              onPageChange={adjustList.setPage}
              onPageSizeChange={adjustList.setPageSize}
              loading={adjustmentsQuery.isLoading}
              emptyMessage="Không có phiếu điều chỉnh tồn kho nào."
            />
          </TabsContent>

          {/* Stocktakes Tab */}
          <TabsContent value="stocktakes" className="space-y-4">
            <DataTable
              columns={stocktakeColumns}
              data={stocktakesQuery.data?.items ?? []}
              total={stocktakesQuery.data?.meta?.total}
              page={stocktakeList.page}
              pageSize={stocktakeList.pageSize}
              onPageChange={stocktakeList.setPage}
              onPageSizeChange={stocktakeList.setPageSize}
              loading={stocktakesQuery.isLoading}
              emptyMessage="Không có đợt kiểm kê nào."
            />
          </TabsContent>

          {/* Damage Tab */}
          <TabsContent value="damage" className="space-y-4">
            <DataTable
              columns={damageColumns}
              data={damagesQuery.data?.items ?? []}
              total={damagesQuery.data?.meta?.total}
              page={damageList.page}
              pageSize={damageList.pageSize}
              onPageChange={damageList.setPage}
              onPageSizeChange={damageList.setPageSize}
              loading={damagesQuery.isLoading}
              emptyMessage="Không có biên bản báo hỏng nào."
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateAdjustmentDialog
        open={openAdjustDialog}
        onOpenChange={setOpenAdjustDialog}
        onCreated={() => adjustmentsQuery.refetch()}
      />

      <CreateDamageDialog
        open={openDamageDialog}
        onOpenChange={setOpenDamageDialog}
        onCreated={() => damagesQuery.refetch()}
      />
    </AdminLayout>
  );
}
