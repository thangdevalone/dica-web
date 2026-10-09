"use client"

import * as React from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAllQuery, useApiMutation, useApiQuery } from "@/hooks/use-api"
import { useIngredients } from "@/hooks/use-lookups"
import { useCan } from "@/stores/use-auth-store"
import { api, errorMessage } from "@/lib/api/client"

interface Policy {
  paymentApprovalRequired: boolean
  attachmentRetentionMonths: number
}
interface Rule {
  id: string
  ingredientId: string
  basePrice: string
  tolerancePercent: string
}

function PolicyForm({ policy }: { policy: Policy }) {
  const [approval, setApproval] = React.useState(policy.paymentApprovalRequired)
  const [months, setMonths] = React.useState(
    String(policy.attachmentRetentionMonths)
  )
  const save = useApiMutation({
    mutationFn: () =>
      api.put("/workflow-policy", {
        payment_approval_required: approval,
        attachment_retention_months: Number(months),
      }),
    invalidate: ["/workflow-policy"],
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="payment-approval">
          Tách người nhập và người xác nhận thanh toán
        </Label>
        <Switch
          id="payment-approval"
          checked={approval}
          onCheckedChange={setApproval}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Khi bật, khoản tiền chờ xác nhận chỉ được ghi nhận sau khi một người có
        quyền khác phê duyệt trên mobile.
      </p>
      <div className="space-y-2">
        <Label htmlFor="retention">
          Lưu ảnh nhận hàng, báo hỏng và hoàn hàng (tháng)
        </Label>
        <Input
          id="retention"
          type="number"
          min={6}
          max={12}
          step={1}
          required
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Từ 6 đến 12 tháng. Ảnh hết thời hạn sẽ được xóa tự động; giảm thời hạn
          có thể làm ảnh cũ bị xóa trong lần xử lý tiếp theo.
        </p>
      </div>
      <Button disabled={save.isPending}>Lưu chính sách</Button>
    </form>
  )
}

export default function WorkflowPolicyPage() {
  const canPolicy = useCan("workflow_policy.manage")
  const canRules = useCan("price_rule.manage")
  const policy = useApiQuery<Policy>("/workflow-policy", undefined, {
    enabled: canPolicy,
  })
  const rules = useAllQuery<Rule>("/price-rules", undefined, {
    enabled: canRules,
  })
  const ingredients = useIngredients()
  const [ingredientId, setIngredientId] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [tolerance, setTolerance] = React.useState("10")
  const save = useApiMutation({
    mutationFn: () =>
      api.put("/price-rules", {
        ingredient_id: ingredientId,
        base_price: price,
        tolerance_percent: tolerance,
      }),
    invalidate: ["/price-rules"],
    onSuccess: () => {
      setIngredientId("")
      setPrice("")
      setTolerance("10")
    },
  })
  const selected = ingredients.data?.find((item) => item.id === ingredientId)
  return (
    <AdminLayout permission={["workflow_policy.manage", "price_rule.manage"]}>
      <PageHeader
        title="Chính sách nghiệp vụ"
        description="Cấu hình giá chuẩn, cảnh báo sai giá, xác nhận thanh toán và thời hạn lưu ảnh."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {canPolicy && (
          <Card className="gap-4 p-6">
            <h2 className="text-lg font-semibold">Thanh toán & ảnh chứng từ</h2>
            {policy.isLoading ? (
              <p>Đang tải...</p>
            ) : policy.error ? (
              <p role="alert">{errorMessage(policy.error)}</p>
            ) : (
              policy.data && (
                <PolicyForm
                  key={`${policy.data.paymentApprovalRequired}-${policy.data.attachmentRetentionMonths}`}
                  policy={policy.data}
                />
              )
            )}
          </Card>
        )}
        {canRules && (
          <Card className="gap-4 p-6">
            <h2 className="text-lg font-semibold">
              Giá chuẩn theo nguyên liệu
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="price-ingredient">Nguyên liệu</Label>
                <select
                  id="price-ingredient"
                  required
                  value={ingredientId}
                  onChange={(e) => {
                    const id = e.target.value
                    setIngredientId(id)
                    const rule = rules.data?.find(
                      (item) => item.ingredientId === id
                    )
                    setPrice(rule?.basePrice ?? "")
                    setTolerance(rule?.tolerancePercent ?? "10")
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Chọn nguyên liệu</option>
                  {ingredients.data
                    ?.filter((item) => item.active)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.baseUnit?.code})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-price">
                  Giá chuẩn / {selected?.baseUnit?.code ?? "đơn vị cơ sở"}
                </Label>
                <Input
                  id="base-price"
                  type="number"
                  min="0.0001"
                  max="999999999999"
                  step="0.0001"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-tolerance">Chênh lệch tối đa (%)</Label>
                <Input
                  id="price-tolerance"
                  type="number"
                  min="0"
                  max="9999"
                  step="0.0001"
                  required
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Khi giá nhập vượt ngưỡng theo cả hai chiều, hệ thống thông báo
                cho ADMIN và người được cấp quyền nhận cảnh báo giá.
              </p>
              {(rules.error || ingredients.error) && (
                <p role="alert">
                  {errorMessage(rules.error ?? ingredients.error)}
                </p>
              )}
              <Button
                disabled={save.isPending || rules.isLoading || !!rules.error}
              >
                Lưu giá chuẩn
              </Button>
            </form>
          </Card>
        )}
      </div>
      {canRules && (
        <Card className="mt-6 gap-3 p-6">
          <h2 className="text-lg font-semibold">Giá chuẩn đã cấu hình</h2>
          {rules.isLoading ? (
            <p>Đang tải...</p>
          ) : !rules.data?.length ? (
            <p className="text-sm text-muted-foreground">
              Chưa cấu hình giá chuẩn.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">Nguyên liệu</th>
                    <th className="p-2">Giá / đơn vị cơ sở</th>
                    <th className="p-2">Ngưỡng</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.data.map((rule) => {
                    const ingredient = ingredients.data?.find(
                      (item) => item.id === rule.ingredientId
                    )
                    return (
                      <tr key={rule.id} className="border-t">
                        <td className="p-2">
                          {ingredient?.name ?? rule.ingredientId}
                        </td>
                        <td className="p-2">
                          {rule.basePrice} / {ingredient?.baseUnit?.code}
                        </td>
                        <td className="p-2">{rule.tolerancePercent}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </AdminLayout>
  )
}
