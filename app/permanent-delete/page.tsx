"use client"

import * as React from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useFacilities,
  useIngredients,
  useStockLocations,
  useSuppliers,
} from "@/hooks/use-lookups"
import { useApiMutation } from "@/hooks/use-api"
import { api } from "@/lib/api/client"

type Kind = "facility" | "stock_location" | "ingredient" | "supplier"
interface Preview {
  id: string
  kind: Kind
  name: string
  counts: Record<string, number>
  previewHash: string
}
const LABELS: Record<string, string> = {
  facilities: "Cơ sở",
  stock_locations: "Kho",
  ingredients: "Nguyên liệu",
  suppliers: "Nhà cung cấp",
  users: "Tài khoản",
  supply_requests: "Phiếu xin hàng",
  fulfillment_orders: "Đơn hàng",
  fulfillment_lines: "Dòng đơn hàng",
  transfers: "Phiếu điều chuyển",
  dispatches: "Phiếu xuất",
  receipts: "Phiếu nhận",
  stocktakes: "Phiếu kiểm kê",
  damage_reports: "Phiếu báo hỏng",
  return_documents: "Phiếu hoàn",
  stock_ledger_entries: "Bút toán tồn kho",
  stock_balances: "Số dư tồn",
  attachments: "Ảnh chứng từ",
  audit_events: "Nhật ký",
  notifications: "Thông báo",
  payment_tracking: "Theo dõi thanh toán",
}

export default function PermanentDeletePage() {
  const facilities = useFacilities()
  const locations = useStockLocations()
  const ingredients = useIngredients()
  const suppliers = useSuppliers()
  const [kind, setKind] = React.useState<Kind>("ingredient")
  const [id, setId] = React.useState("")
  const [preview, setPreview] = React.useState<Preview | null>(null)
  const [password, setPassword] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const items =
    kind === "facility"
      ? facilities.data
      : kind === "stock_location"
        ? locations.data
        : kind === "supplier"
          ? suppliers.data
          : ingredients.data
  const inspect = useApiMutation<void, Preview>({
    mutationFn: () => api.get<Preview>(`/permanent-delete/${kind}/${id}`),
    successMessage: false,
    onSuccess: (data) => {
      setPreview(data)
      setPassword("")
      setConfirmation("")
    },
  })
  const remove = useApiMutation({
    mutationFn: () =>
      api.post(`/permanent-delete/${preview!.kind}/${preview!.id}`, {
        password,
        preview_hash: preview!.previewHash,
      }),
    invalidate: [
      "/facilities",
      "/stock-locations",
      "/ingredients",
      "/suppliers",
      "/users",
      "/audit-events",
      "/price-rules",
    ],
    onSuccess: () => {
      setPreview(null)
      setId("")
      setPassword("")
      setConfirmation("")
    },
    onError: () => {
      setPreview(null)
      setPassword("")
      setConfirmation("")
    },
  })
  const locked = inspect.isPending || remove.isPending
  return (
    <AdminLayout permission="system.purge">
      <PageHeader
        title="Xóa dữ liệu vĩnh viễn"
        description="Chỉ dành cho tài khoản ADMIN cấu hình. Có thể dùng Ngừng sử dụng ở trang danh mục nếu cần giữ lịch sử."
      />
      <Card className="max-w-2xl gap-4 border-destructive/40 p-6">
        <p className="text-sm font-medium text-destructive">
          Thao tác sẽ xóa cả các chứng từ liên quan, có thể ảnh hưởng đến nhiều
          cơ sở. Tồn kho được tính lại từ lịch sử còn lại. Không thể hoàn tác
          trong ứng dụng.
        </p>
        <div className="space-y-2">
          <Label htmlFor="delete-kind">Loại dữ liệu</Label>
          <select
            id="delete-kind"
            disabled={locked}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind)
              setId("")
              setPreview(null)
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="ingredient">Nguyên liệu</option>
            <option value="supplier">Nhà cung cấp</option>
            <option value="facility">Cơ sở</option>
            <option value="stock_location">Kho</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="delete-item">Dữ liệu cần xóa</Label>
          <select
            id="delete-item"
            disabled={locked}
            value={id}
            onChange={(e) => {
              setId(e.target.value)
              setPreview(null)
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Chọn dữ liệu</option>
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          disabled={!id || locked}
          onClick={() => inspect.mutate()}
        >
          Kiểm tra phạm vi xóa
        </Button>
        {preview && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (confirmation === preview.name) remove.mutate()
            }}
            className="space-y-4 border-t pt-4"
          >
            <h2 className="font-semibold">Xác nhận xóa {preview.name}</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(preview.counts)
                .filter(([name]) => LABELS[name])
                .map(([name, count]) => (
                  <li key={name}>
                    {LABELS[name]}: {count}
                  </li>
                ))}
              <li className="font-semibold">
                Tổng:{" "}
                {Object.values(preview.counts).reduce(
                  (sum, count) => sum + count,
                  0
                )}{" "}
                bản ghi, gồm các dòng chi tiết và liên kết
              </li>
            </ul>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Nhập lại tên: {preview.name}
              </Label>
              <Input
                id="delete-confirm"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-password">Mật khẩu ADMIN hiện tại</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              disabled={locked || !password || confirmation !== preview.name}
            >
              Xóa vĩnh viễn cùng lịch sử
            </Button>
          </form>
        )}
      </Card>
    </AdminLayout>
  )
}
