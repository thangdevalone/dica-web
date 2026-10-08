"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ExternalLink,
  FileCheck2,
  Plus,
  Wrench,
} from "lucide-react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Cell2,
  Code,
  DataTable,
  type Column,
} from "@/components/shared/data-table"
import {
  ConfirmDialog,
  Field,
  FormDialog,
  OptionSelect,
} from "@/components/shared/form"
import {
  DetailSheet,
  InfoGrid,
  MiniTable,
  Section,
} from "@/components/shared/detail-sheet"
import { useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api"
import { useListState } from "@/hooks/use-list-state"
import { useTabSync } from "@/hooks/use-tab-sync"
import { api } from "@/lib/api/client"
import type {
  Dispatch,
  FulfillmentOrder,
  Receipt,
  DiscrepancyCase,
} from "@/lib/api/types"
import { STATUS_LABELS, labelOf } from "@/constants/labels"
import { useCan } from "@/stores/use-auth-store"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { formatQty } from "@/lib/num"

const INVALIDATE = [
  "/dispatches",
  "/receipts",
  "/discrepancies",
  "/orders",
  "/dashboard/summary",
]

// ---------------------------------------------------------------------------
// Create Dispatch Dialog
// ---------------------------------------------------------------------------

function CreateDispatchDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const [orderId, setOrderId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [quantities, setQuantities] = React.useState<Record<string, string>>({})

  const ordersQuery = usePagedQuery<FulfillmentOrder>(
    "/orders",
    { page: 1, page_size: 50 },
    { enabled: open }
  )

  const eligibleOrders = React.useMemo(
    () =>
      (ordersQuery.data?.items ?? []).filter(
        (o) => o.status === "RELEASED" || o.status === "PARTIAL"
      ),
    [ordersQuery.data]
  )

  const orderDetailQuery = useApiQuery<FulfillmentOrder>(
    orderId ? `/orders/${orderId}` : null,
    undefined,
    { enabled: Boolean(orderId) }
  )

  const effectiveQuantities = React.useMemo(() => {
    const defaults: Record<string, string> = {}
    for (const line of orderDetailQuery.data?.lines ?? []) {
      const remaining = Math.max(
        0,
        Number(line.approvedQuantity) - Number(line.dispatchedQuantity)
      )
      defaults[line.id] = remaining > 0 ? String(remaining) : "0"
    }
    return { ...defaults, ...quantities }
  }, [orderDetailQuery.data, quantities])

  const createMutation = useApiMutation<void, Dispatch>({
    mutationFn: () => {
      const lines = Object.entries(effectiveQuantities)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([lineId, qty]) => ({
          order_line_id: lineId,
          quantity: qty,
        }))

      if (lines.length === 0)
        throw new Error("Vui lòng nhập số lượng xuất cho ít nhất một mặt hàng.")

      return api.post<Dispatch>("/dispatches", {
        order_id: orderId,
        ...(note.trim() ? { note: note.trim() } : {}),
        lines,
      })
    },
    invalidate: INVALIDATE,
    successMessage: "Đã tạo phiếu xuất kho.",
    onSuccess: (res) => {
      onOpenChange(false)
      setOrderId("")
      setNote("")
      setQuantities({})
      if (res?.id) onCreated(res.id)
    },
  })

  const isValid =
    Boolean(orderId) &&
    Object.values(effectiveQuantities).some((q) => Number(q) > 0)

  return (
    <FormDialog
      tourId="delivery-dispatch-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Lập phiếu xuất kho mới"
      description="Tạo phiếu xuất kho cho đơn cấp hàng đang mở."
      submitLabel="Tạo phiếu xuất"
      submitting={createMutation.isPending}
      submitDisabled={!isValid}
      onSubmit={() => createMutation.mutate()}
      size="lg"
    >
      <div className="space-y-4">
        <Field label="Đơn cấp hàng" required hint="Chọn đơn cần xuất kho">
          <OptionSelect
            value={orderId}
            onChange={(value) => {
              setOrderId(value)
              setQuantities({})
            }}
            options={eligibleOrders.map((o) => ({
              value: o.id,
              label: `${o.code} (${labelOf(STATUS_LABELS, o.status)})`,
              hint: o.destinationStockLocation?.name,
            }))}
            placeholder="Chọn đơn hàng..."
          />
        </Field>

        <Field label="Ghi chú xuất kho">
          <Textarea
            placeholder="Thông tin xe hàng, niêm phong chì..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </Field>

        {orderDetailQuery.data && (
          <div className="space-y-2 border-t border-border/60 pt-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Số lượng xuất từng mặt hàng
            </label>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-xs">
                <thead className="border-b border-border/60 bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Nguyên liệu</th>
                    <th className="w-16 p-2 text-left font-medium">Đơn vị</th>
                    <th className="w-20 p-2 text-right font-medium">
                      Đã duyệt
                    </th>
                    <th className="w-20 p-2 text-right font-medium">Đã xuất</th>
                    <th className="w-28 p-2 text-right font-medium">
                      Xuất đợt này
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {orderDetailQuery.data.lines?.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="p-2 font-medium">
                        {line.ingredient?.name ?? line.ingredientId}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {line.unitCodeSnapshot}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatQty(line.approvedQuantity)}
                      </td>
                      <td className="p-2 text-right font-mono text-blue-600">
                        {formatQty(line.dispatchedQuantity)}
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={effectiveQuantities[line.id] ?? ""}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                          className="ml-auto h-8 w-24 text-right font-mono text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Create Receipt Dialog
// ---------------------------------------------------------------------------

function CreateReceiptDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}) {
  const [orderId, setOrderId] = React.useState("")
  const [dispatchId, setDispatchId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [quantities, setQuantities] = React.useState<Record<string, string>>({})

  const ordersQuery = usePagedQuery<FulfillmentOrder>(
    "/orders",
    { page: 1, page_size: 50 },
    { enabled: open }
  )

  const eligibleOrders = React.useMemo(
    () =>
      (ordersQuery.data?.items ?? []).filter(
        (o) => o.status === "RELEASED" || o.status === "PARTIAL"
      ),
    [ordersQuery.data]
  )

  const orderDetailQuery = useApiQuery<FulfillmentOrder>(
    orderId ? `/orders/${orderId}` : null,
    undefined,
    { enabled: Boolean(orderId) }
  )

  const postedDispatches = React.useMemo(
    () =>
      (orderDetailQuery.data?.dispatches ?? []).filter(
        (d) => d.status === "POSTED"
      ),
    [orderDetailQuery.data]
  )

  const effectiveQuantities = React.useMemo(() => {
    const defaults: Record<string, string> = {}
    for (const line of orderDetailQuery.data?.lines ?? []) {
      const remaining = Math.max(
        0,
        Number(line.dispatchedQuantity) - Number(line.receivedQuantity)
      )
      defaults[line.id] = remaining > 0 ? String(remaining) : "0"
    }
    return { ...defaults, ...quantities }
  }, [orderDetailQuery.data, quantities])

  const createMutation = useApiMutation<void, Receipt>({
    mutationFn: () => {
      const lines = Object.entries(effectiveQuantities)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([lineId, qty]) => ({
          order_line_id: lineId,
          quantity: qty,
        }))

      if (lines.length === 0)
        throw new Error("Vui lòng nhập số lượng nhận cho ít nhất một mặt hàng.")

      return api.post<Receipt>("/receipts", {
        order_id: orderId,
        ...(dispatchId ? { dispatch_id: dispatchId } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        lines,
      })
    },
    invalidate: INVALIDATE,
    successMessage: "Đã tạo phiếu nhận hàng.",
    onSuccess: (res) => {
      onOpenChange(false)
      setOrderId("")
      setDispatchId("")
      setNote("")
      setQuantities({})
      if (res?.id) onCreated(res.id)
    },
  })

  const isValid =
    Boolean(orderId) &&
    Object.values(effectiveQuantities).some((q) => Number(q) > 0)

  return (
    <FormDialog
      tourId="delivery-receipt-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Lập phiếu nhận hàng mới"
      description="Ghi nhận hàng thực nhập vào kho đích từ xe giao hoặc nhà cung cấp."
      submitLabel="Tạo phiếu nhập"
      submitting={createMutation.isPending}
      submitDisabled={!isValid}
      onSubmit={() => createMutation.mutate()}
      size="lg"
    >
      <div className="space-y-4">
        <Field label="Đơn cấp hàng" required hint="Chọn đơn hàng đang giao">
          <OptionSelect
            value={orderId}
            onChange={(val) => {
              setOrderId(val)
              setDispatchId("")
              setQuantities({})
            }}
            options={eligibleOrders.map((o) => ({
              value: o.id,
              label: `${o.code} (${labelOf(STATUS_LABELS, o.status)})`,
              hint: o.destinationStockLocation?.name,
            }))}
            placeholder="Chọn đơn hàng..."
          />
        </Field>

        {postedDispatches.length > 0 && (
          <Field
            label="Phiếu xuất kho liên quan"
            hint="Không bắt buộc; dùng để liên kết với phiếu xuất tương ứng."
          >
            <OptionSelect
              value={dispatchId}
              onChange={setDispatchId}
              options={postedDispatches.map((d) => ({
                value: d.id,
                label: `${d.code} (${formatDateTime(d.createdAt)})`,
              }))}
              placeholder="Không liên kết phiếu xuất..."
              allLabel="Không liên kết phiếu xuất"
            />
          </Field>
        )}

        <Field label="Ghi chú nhận hàng">
          <Textarea
            placeholder="Tình trạng bao bì, nhiệt độ thùng lạnh..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </Field>

        {orderDetailQuery.data && (
          <div className="space-y-2 border-t border-border/60 pt-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Số lượng thực nhận từng mặt hàng
            </label>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-xs">
                <thead className="border-b border-border/60 bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Nguyên liệu</th>
                    <th className="w-16 p-2 text-left font-medium">Đơn vị</th>
                    <th className="w-20 p-2 text-right font-medium">Đã xuất</th>
                    <th className="w-20 p-2 text-right font-medium">Đã nhận</th>
                    <th className="w-28 p-2 text-right font-medium">
                      Nhận đợt này
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {orderDetailQuery.data.lines?.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="p-2 font-medium">
                        {line.ingredient?.name ?? line.ingredientId}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {line.unitCodeSnapshot}
                      </td>
                      <td className="p-2 text-right font-mono text-blue-600">
                        {formatQty(line.dispatchedQuantity)}
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-600">
                        {formatQty(line.receivedQuantity)}
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={effectiveQuantities[line.id] ?? ""}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                          className="ml-auto h-8 w-24 text-right font-mono text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Main Delivery Page
// ---------------------------------------------------------------------------

export default function DeliveryPage() {
  const canCreateDispatch = useCan("dispatch.create")
  const canPostDispatch = useCan("dispatch.post")
  const canCreateReceipt = useCan("receipt.create")
  const canPostReceipt = useCan("receipt.post")
  const canResolveDiscrepancy = useCan("discrepancy.resolve")
  const canReadDispatch = useCan("dispatch.read")
  const canReadReceipt = useCan("receipt.read")
  const canReadDiscrepancy = useCan("discrepancy.read")
  const validTabs = React.useMemo(
    () =>
      (["dispatches", "receipts", "discrepancies"] as const).filter(
        (candidate) =>
          candidate === "dispatches"
            ? canReadDispatch
            : candidate === "receipts"
              ? canReadReceipt
              : canReadDiscrepancy
      ),
    [canReadDiscrepancy, canReadDispatch, canReadReceipt]
  )
  const defaultTab = validTabs[0] ?? "dispatches"
  const [activeTab, setActiveTab] = useTabSync(defaultTab, validTabs)

  const [openDispatchDialog, setOpenDispatchDialog] = React.useState(false)
  const [openReceiptDialog, setOpenReceiptDialog] = React.useState(false)

  const [detailDispatchId, setDetailDispatchId] = React.useState<string | null>(
    null
  )
  const [detailReceiptId, setDetailReceiptId] = React.useState<string | null>(
    null
  )

  const [postDispatchTarget, setPostDispatchTarget] =
    React.useState<Dispatch | null>(null)
  const [postReceiptTarget, setPostReceiptTarget] =
    React.useState<Receipt | null>(null)
  const [resolveTarget, setResolveTarget] =
    React.useState<DiscrepancyCase | null>(null)

  const dispatchList = useListState({})
  const receiptList = useListState({})
  const discrepancyList = useListState({})

  const dispatchesQuery = usePagedQuery<Dispatch>(
    "/dispatches",
    dispatchList.params,
    { enabled: activeTab === "dispatches" && canReadDispatch }
  )

  const receiptsQuery = usePagedQuery<Receipt>(
    "/receipts",
    receiptList.params,
    { enabled: activeTab === "receipts" && canReadReceipt }
  )

  const discrepanciesQuery = usePagedQuery<DiscrepancyCase>(
    "/discrepancies",
    discrepancyList.params,
    { enabled: activeTab === "discrepancies" && canReadDiscrepancy }
  )

  const dispatchDetailQuery = useApiQuery<Dispatch>(
    detailDispatchId ? `/dispatches/${detailDispatchId}` : null,
    undefined,
    { enabled: Boolean(detailDispatchId) }
  )

  const receiptDetailQuery = useApiQuery<Receipt>(
    detailReceiptId ? `/receipts/${detailReceiptId}` : null,
    undefined,
    { enabled: Boolean(detailReceiptId) }
  )

  const postDispatchMutation = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!postDispatchTarget) throw new Error("No target")
      return api.post(
        `/dispatches/${postDispatchTarget.id}/post`,
        {
          expected_version: postDispatchTarget.version,
        },
        {
          idempotencyKey: `web:dispatch:${postDispatchTarget.id}:v${postDispatchTarget.version}`,
        }
      )
    },
    invalidate: INVALIDATE,
    successMessage: "Đã xác nhận xuất hàng và trừ số lượng tồn kho.",
    onSuccess: () => {
      setPostDispatchTarget(null)
      if (detailDispatchId) dispatchDetailQuery.refetch()
    },
  })

  const postReceiptMutation = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!postReceiptTarget) throw new Error("No target")
      return api.post(
        `/receipts/${postReceiptTarget.id}/post`,
        {
          expected_version: postReceiptTarget.version,
        },
        {
          idempotencyKey: `web:receipt:${postReceiptTarget.id}:v${postReceiptTarget.version}`,
        }
      )
    },
    invalidate: INVALIDATE,
    successMessage: "Đã xác nhận nhận hàng và cộng số lượng vào kho đích.",
    onSuccess: () => {
      setPostReceiptTarget(null)
      if (detailReceiptId) receiptDetailQuery.refetch()
    },
  })

  const resolveDiscrepancyMutation = useApiMutation<
    string,
    { message: string }
  >({
    mutationFn: (reason) => {
      if (!resolveTarget) throw new Error("No target")
      return api.post(`/discrepancies/${resolveTarget.id}/resolve`, {
        resolution: reason || "Đã giải quyết theo quy trình giao nhận",
      })
    },
    invalidate: INVALIDATE,
    successMessage: "Đã đánh dấu xử lý chênh lệch giao nhận.",
    onSuccess: () => setResolveTarget(null),
  })

  const dispatchColumns: Column<Dispatch>[] = [
    {
      key: "code",
      header: "Mã phiếu xuất",
      cell: (d) => (
        <div className="flex flex-col">
          <Code>{d.code}</Code>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(d.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "order",
      header: "Đơn cấp hàng",
      cell: (d) => (
        <Cell2
          title={d.order?.code ?? d.orderId}
          sub={d.order?.destinationStockLocation?.name}
        />
      ),
    },
    {
      key: "lines",
      header: "Số dòng",
      className: "text-right",
      headClassName: "text-right",
      cell: (d) => (
        <span className="text-xs font-medium">
          {d._count?.lines ?? d.lines?.length ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "postedAt",
      header: "Xác nhận xuất lúc",
      cell: (d) => (
        <span className="text-xs text-muted-foreground">
          {d.postedAt ? formatDateTime(d.postedAt) : "Chưa xác nhận xuất"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (d) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canPostDispatch && d.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-emerald-300 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => setPostDispatchTarget(d)}
            >
              <FileCheck2 className="size-3.5" /> Xác nhận xuất
            </Button>
          )}
        </div>
      ),
    },
  ]

  const receiptColumns: Column<Receipt>[] = [
    {
      key: "code",
      header: "Mã phiếu nhập",
      cell: (r) => (
        <div className="flex flex-col">
          <Code>{r.code}</Code>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(r.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "order",
      header: "Đơn hàng / Phiếu xuất",
      cell: (r) => (
        <Cell2
          title={r.order?.code ?? r.orderId}
          sub={r.dispatch ? `PX: ${r.dispatch.code}` : "Nhập trực tiếp"}
        />
      ),
    },
    {
      key: "discrepancies",
      header: "Chênh lệch",
      className: "text-center",
      headClassName: "text-center",
      cell: (r) => {
        const count = r._count?.discrepancies ?? r.discrepancies?.length ?? 0
        return count > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <AlertTriangle className="size-3.5" /> {count}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        )
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "postedAt",
      header: "Xác nhận nhận lúc",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.postedAt ? formatDateTime(r.postedAt) : "Chưa xác nhận nhận"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canPostReceipt && r.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-emerald-300 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => setPostReceiptTarget(r)}
            >
              <FileCheck2 className="size-3.5" /> Xác nhận nhận
            </Button>
          )}
        </div>
      ),
    },
  ]

  const discrepancyColumns: Column<DiscrepancyCase>[] = [
    {
      key: "type",
      header: "Loại chênh lệch",
      cell: (c) => {
        const labels: Record<string, string> = {
          SHORTAGE: "Thiếu hàng",
          EXCESS: "Thừa hàng",
          DAMAGED: "Hư hỏng",
        }
        return (
          <span className="text-xs font-semibold text-destructive">
            {labels[c.type] ?? c.type}
          </span>
        )
      },
    },
    {
      key: "receipt",
      header: "Phiếu nhận hàng",
      cell: (c) => (
        <Cell2
          title={c.receipt?.code ?? c.receiptId}
          sub={c.receiptLine?.orderLine?.ingredient?.name ?? "Nguyên liệu"}
        />
      ),
    },
    {
      key: "expected",
      header: "Dự kiến",
      className: "text-right",
      headClassName: "text-right",
      cell: (c) => (
        <span className="font-mono text-xs">
          {formatQty(c.expectedQuantity)}
        </span>
      ),
    },
    {
      key: "actual",
      header: "Thực tế",
      className: "text-right",
      headClassName: "text-right",
      cell: (c) => (
        <span className="font-mono text-xs font-semibold">
          {formatQty(c.actualQuantity)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {canResolveDiscrepancy && c.status === "OPEN" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-primary/30 text-xs text-primary hover:bg-primary/10"
              onClick={() => setResolveTarget(c)}
            >
              <Wrench className="size-3" /> Xử lý
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      permission={["dispatch.read", "receipt.read", "discrepancy.read"]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Giao nhận & vận chuyển"
          description="Quản lý phiếu xuất kho, phiếu nhận hàng và xử lý chênh lệch khi giao nhận."
          actions={
            <div className="flex items-center gap-2">
              {activeTab === "dispatches" && canCreateDispatch && (
                <Button
                  data-tour="delivery-create-dispatch"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setOpenDispatchDialog(true)}
                >
                  <Plus className="size-3.5" /> Lập phiếu xuất
                </Button>
              )}
              {activeTab === "receipts" && canCreateReceipt && (
                <Button
                  data-tour="delivery-create-receipt"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setOpenReceiptDialog(true)}
                >
                  <Plus className="size-3.5" /> Lập phiếu nhập
                </Button>
              )}
            </div>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "dispatches" | "receipts" | "discrepancies")
          }
          className="space-y-4"
        >
          <TabsContent value="dispatches" className="space-y-4">
            <DataTable
              columns={dispatchColumns}
              rows={dispatchesQuery.data?.items}
              rowKey={(d) => d.id}
              loading={dispatchesQuery.isLoading}
              fetching={dispatchesQuery.isFetching}
              error={dispatchesQuery.error}
              meta={dispatchesQuery.data?.meta}
              onPageChange={dispatchList.setPage}
              onRowClick={(d) => setDetailDispatchId(d.id)}
              emptyText="Không có phiếu xuất kho nào."
            />
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <DataTable
              columns={receiptColumns}
              rows={receiptsQuery.data?.items}
              rowKey={(r) => r.id}
              loading={receiptsQuery.isLoading}
              fetching={receiptsQuery.isFetching}
              error={receiptsQuery.error}
              meta={receiptsQuery.data?.meta}
              onPageChange={receiptList.setPage}
              onRowClick={(r) => setDetailReceiptId(r.id)}
              emptyText="Không có phiếu nhận hàng nào."
            />
          </TabsContent>

          <TabsContent value="discrepancies" className="space-y-4">
            <DataTable
              columns={discrepancyColumns}
              rows={discrepanciesQuery.data?.items}
              rowKey={(c) => c.id}
              loading={discrepanciesQuery.isLoading}
              fetching={discrepanciesQuery.isFetching}
              error={discrepanciesQuery.error}
              meta={discrepanciesQuery.data?.meta}
              onPageChange={discrepancyList.setPage}
              emptyText="Không có trường hợp chênh lệch nào."
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateDispatchDialog
        open={openDispatchDialog}
        onOpenChange={setOpenDispatchDialog}
        onCreated={(id) => setDetailDispatchId(id)}
      />

      <CreateReceiptDialog
        open={openReceiptDialog}
        onOpenChange={setOpenReceiptDialog}
        onCreated={(id) => setDetailReceiptId(id)}
      />

      {/* Dispatch Detail Sheet */}
      <DetailSheet
        open={Boolean(detailDispatchId)}
        onOpenChange={(open) => !open && setDetailDispatchId(null)}
        title={
          dispatchDetailQuery.data
            ? `Phiếu xuất ${dispatchDetailQuery.data.code}`
            : "Chi tiết phiếu xuất"
        }
        badge={
          dispatchDetailQuery.data && (
            <StatusBadge status={dispatchDetailQuery.data.status} />
          )
        }
        description={
          dispatchDetailQuery.data
            ? `Tạo lúc ${formatDateTime(dispatchDetailQuery.data.createdAt)}`
            : undefined
        }
        wide
        footer={
          dispatchDetailQuery.data && (
            <div className="flex w-full items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Phiên bản #{dispatchDetailQuery.data.version}
              </span>
              {canPostDispatch &&
                dispatchDetailQuery.data.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setPostDispatchTarget(dispatchDetailQuery.data!)
                    }
                    className="bg-emerald-600 text-xs hover:bg-emerald-700"
                  >
                    <FileCheck2 className="size-3.5" /> Xác nhận xuất kho
                  </Button>
                )}
            </div>
          )
        }
      >
        {dispatchDetailQuery.data && (
          <div className="space-y-6">
            <InfoGrid
              columns={2}
              items={[
                {
                  label: "Mã phiếu",
                  value: <Code>{dispatchDetailQuery.data.code}</Code>,
                },
                {
                  label: "Đơn cấp hàng",
                  value: dispatchDetailQuery.data.order ? (
                    <Link
                      href={`/orders?id=${dispatchDetailQuery.data.order.id}`}
                      className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                    >
                      {dispatchDetailQuery.data.order.code}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Xác nhận xuất lúc",
                  value: dispatchDetailQuery.data.postedAt
                    ? formatDateTime(dispatchDetailQuery.data.postedAt)
                    : "Chưa xác nhận xuất",
                },
                {
                  label: "Ghi chú",
                  value: dispatchDetailQuery.data.note || "—",
                },
              ]}
            />

            <Section
              title={`Hàng xuất (${dispatchDetailQuery.data.lines?.length ?? 0})`}
            >
              <MiniTable
                headers={[
                  { label: "Nguyên liệu" },
                  { label: "Đơn vị" },
                  { label: "Số lượng xuất", className: "text-right" },
                ]}
                rows={(dispatchDetailQuery.data.lines ?? []).map((l) => [
                  <Cell2
                    key="i"
                    title={l.orderLine?.ingredient?.name ?? l.orderLineId}
                    sub={l.orderLine?.ingredient?.code}
                  />,
                  l.orderLine?.unitCodeSnapshot ?? "—",
                  <span key="q" className="font-semibold text-blue-600">
                    {formatQty(l.quantity)}
                  </span>,
                ])}
              />
            </Section>
          </div>
        )}
      </DetailSheet>

      {/* Receipt Detail Sheet */}
      <DetailSheet
        open={Boolean(detailReceiptId)}
        onOpenChange={(open) => !open && setDetailReceiptId(null)}
        title={
          receiptDetailQuery.data
            ? `Phiếu nhận ${receiptDetailQuery.data.code}`
            : "Chi tiết phiếu nhận hàng"
        }
        badge={
          receiptDetailQuery.data && (
            <StatusBadge status={receiptDetailQuery.data.status} />
          )
        }
        description={
          receiptDetailQuery.data
            ? `Tạo lúc ${formatDateTime(receiptDetailQuery.data.createdAt)}`
            : undefined
        }
        wide
        footer={
          receiptDetailQuery.data && (
            <div className="flex w-full items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Phiên bản #{receiptDetailQuery.data.version}
              </span>
              {canPostReceipt && receiptDetailQuery.data.status === "DRAFT" && (
                <Button
                  size="sm"
                  onClick={() => setPostReceiptTarget(receiptDetailQuery.data!)}
                  className="bg-emerald-600 text-xs hover:bg-emerald-700"
                >
                  <FileCheck2 className="size-3.5" /> Xác nhận nhập kho
                </Button>
              )}
            </div>
          )
        }
      >
        {receiptDetailQuery.data && (
          <div className="space-y-6">
            <InfoGrid
              columns={2}
              items={[
                {
                  label: "Mã phiếu",
                  value: <Code>{receiptDetailQuery.data.code}</Code>,
                },
                {
                  label: "Đơn cấp hàng",
                  value: receiptDetailQuery.data.order ? (
                    <Link
                      href={`/orders?id=${receiptDetailQuery.data.order.id}`}
                      className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                    >
                      {receiptDetailQuery.data.order.code}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Phiếu xuất tương ứng",
                  value: receiptDetailQuery.data.dispatch ? (
                    <Code>{receiptDetailQuery.data.dispatch.code}</Code>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Xác nhận nhận lúc",
                  value: receiptDetailQuery.data.postedAt
                    ? formatDateTime(receiptDetailQuery.data.postedAt)
                    : "Chưa xác nhận nhận",
                },
                {
                  label: "Ghi chú",
                  value: receiptDetailQuery.data.note || "—",
                },
              ]}
            />

            <Section
              title={`Hàng thực nhận (${receiptDetailQuery.data.lines?.length ?? 0})`}
            >
              <MiniTable
                headers={[
                  { label: "Nguyên liệu" },
                  { label: "Đơn vị" },
                  { label: "Khai báo", className: "text-right" },
                  { label: "Chấp nhận", className: "text-right" },
                ]}
                rows={(receiptDetailQuery.data.lines ?? []).map((l) => [
                  <Cell2
                    key="i"
                    title={l.orderLine?.ingredient?.name ?? l.orderLineId}
                    sub={l.orderLine?.ingredient?.code}
                  />,
                  l.orderLine?.unitCodeSnapshot ?? "—",
                  formatQty(l.reportedQuantity),
                  <span key="a" className="font-semibold text-emerald-600">
                    {formatQty(l.acceptedQuantity)}
                  </span>,
                ])}
              />
            </Section>
          </div>
        )}
      </DetailSheet>

      <ConfirmDialog
        open={Boolean(postDispatchTarget)}
        onOpenChange={(o) => !o && setPostDispatchTarget(null)}
        title="Xác nhận hàng đã rời kho?"
        description={`Phiếu ${postDispatchTarget?.code}: Hệ thống sẽ trừ tồn kho thực tế và chuyển hàng sang trạng thái trung chuyển.`}
        confirmLabel="Xác nhận xuất kho"
        loading={postDispatchMutation.isPending}
        onConfirm={() => postDispatchMutation.mutate()}
      />

      <ConfirmDialog
        open={Boolean(postReceiptTarget)}
        onOpenChange={(o) => !o && setPostReceiptTarget(null)}
        title="Xác nhận hàng đã nhập kho?"
        description={`Phiếu ${postReceiptTarget?.code}: Hệ thống sẽ cộng tồn kho thực tế vào kho đích.`}
        confirmLabel="Xác nhận nhập kho"
        loading={postReceiptMutation.isPending}
        onConfirm={() => postReceiptMutation.mutate()}
      />

      <ConfirmDialog
        open={Boolean(resolveTarget)}
        onOpenChange={(o) => !o && setResolveTarget(null)}
        title="Xử lý chênh lệch giao nhận"
        description="Ghi nhận phương án xử lý (bù hàng, trừ công nợ, xử lý hao hụt)."
        confirmLabel="Xác nhận xử lý"
        reason={{ label: "Phương án giải quyết", required: true }}
        loading={resolveDiscrepancyMutation.isPending}
        onConfirm={(reason) => resolveDiscrepancyMutation.mutate(reason ?? "")}
      />
    </AdminLayout>
  )
}
