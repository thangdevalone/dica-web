"use client"

import * as React from "react"
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
  SearchInput,
} from "@/components/shared/form"
import {
  DepartmentSelect,
  FacilitySelect,
  StockLocationSelect,
  SupplierSelect,
} from "@/components/shared/entity-select"
import { useApiMutation, usePagedQuery } from "@/hooks/use-api"
import { useListState } from "@/hooks/use-list-state"
import { useTabSync } from "@/hooks/use-tab-sync"
import { api } from "@/lib/api/client"
import type {
  Permission,
  Role,
  RoleGrant,
  ScopeType,
  User,
  UserKind,
} from "@/lib/api/types"
import { SCOPE_TYPE_LABELS, labelOf } from "@/constants/labels"
import { useAuthStore, useCan } from "@/stores/use-auth-store"
import { formatDate, formatDateTime } from "@/lib/formatters"

const INVALIDATE = ["/users", "/roles", "/grants", "/dashboard/summary"]

const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  user: "Tài khoản",
  role: "Vai trò",
  grant: "Phân quyền",
  facility: "Cơ sở",
  stock_location: "Kho",
  department: "Bộ phận",
  ingredient: "Nguyên liệu",
  ingredient_group: "Nhóm nguyên liệu",
  unit: "Đơn vị",
  conversion: "Quy đổi",
  supplier: "Nhà cung cấp",
  supplier_ingredient: "Hàng nhà cung cấp",
  eligibility: "Hàng được phép yêu cầu",
  source_rule: "Nguồn cấp hàng",
  request: "Yêu cầu cấp hàng",
  order: "Đơn cấp hàng",
  transfer: "Điều chuyển",
  dispatch: "Xuất hàng",
  receipt: "Nhận hàng",
  discrepancy: "Chênh lệch giao nhận",
  stock: "Tồn kho",
  stock_ledger: "Lịch sử nhập xuất",
  adjustment: "Điều chỉnh kho",
  stocktake: "Kiểm kê",
  damage: "Báo hỏng",
  variance: "Hao hụt",
  alert_rule: "Cảnh báo",
  recipe: "Định lượng",
  ipos_mapping: "Liên kết món iPOS",
  sales_import: "Dữ liệu bán hàng",
  payment_tracking: "Thanh toán",
  report: "Báo cáo",
  audit: "Nhật ký",
  attachment: "Tệp đính kèm",
  notification: "Thông báo",
  backup: "Sao lưu",
  supplier_order: "Đơn nhà cung cấp",
  dashboard: "Tổng quan",
}

const PERMISSION_ACTION_LABELS: Record<string, string> = {
  read: "Xem",
  read_own: "Xem dữ liệu của mình",
  create: "Tạo mới",
  update: "Cập nhật",
  update_draft: "Sửa bản nháp",
  manage: "Quản lý",
  deactivate: "Khóa tài khoản",
  reset_password: "Đặt lại mật khẩu",
  revoke_sessions: "Thu hồi phiên đăng nhập",
  assign: "Cấp quyền",
  revoke: "Thu hồi quyền",
  bulk_update: "Cập nhật hàng loạt",
  revise: "Yêu cầu sửa lại",
  submit: "Gửi duyệt",
  cancel: "Hủy",
  approve: "Phê duyệt",
  reject: "Từ chối",
  release: "Phát hành",
  export: "Xuất dữ liệu",
  change_source: "Đổi nguồn",
  close_outstanding: "Đóng phần còn lại",
  post: "Ghi nhận vào kho",
  resolve: "Xử lý",
  reopen: "Mở lại",
  confirm: "Xác nhận",
  recalculate: "Tính lại",
  commit: "Chốt dữ liệu",
  mark_own: "Đánh dấu thông báo",
  stock: "Tồn kho",
  fulfillment: "Mức độ đáp ứng",
  damage: "Báo hỏng",
  variance: "Hao hụt",
  payment: "Thanh toán",
}

function permissionParts(code: string) {
  const [resource = code, action = ""] = code.split(".")
  return {
    group: PERMISSION_RESOURCE_LABELS[resource] ?? resource,
    action: PERMISSION_ACTION_LABELS[action] ?? action,
  }
}

function ManageRoleDialog({
  open,
  role,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  role: Role | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [code, setCode] = React.useState(role?.code ?? "")
  const [name, setName] = React.useState(role?.name ?? "")
  const [permissionCodes, setPermissionCodes] = React.useState<string[]>(
    role?.permissions?.map((item) => item.permissionCode) ?? []
  )
  const [search, setSearch] = React.useState("")
  const actorPermissions = useAuthStore((state) => state.permissions)
  const actorGrants = useAuthStore((state) => state.grants)
  const isAdminOwner = actorGrants.some(
    (grant) => grant.roleCode === "ADMIN_OWNER"
  )
  const permissionsQuery = usePagedQuery<Permission>(
    "/permissions",
    { page: 1, page_size: 100 },
    { enabled: open }
  )

  const save = useApiMutation<void, Role>({
    mutationFn: () => {
      const body = {
        ...(!role?.system ? { name: name.trim() } : {}),
        permission_codes: permissionCodes,
      }
      return role
        ? api.patch<Role>(`/roles/${role.id}`, body)
        : api.post<Role>("/roles", { ...body, code: code.trim().toUpperCase() })
    },
    invalidate: INVALIDATE,
    successMessage: role
      ? "Đã cập nhật vai trò và bộ quyền."
      : "Đã tạo vai trò tùy chỉnh.",
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    },
  })

  const permissions = (permissionsQuery.data?.items ?? []).filter(
    (permission) => isAdminOwner || actorPermissions.includes(permission.code)
  )
  const normalizedSearch = search.trim().toLowerCase()
  const visiblePermissions = permissions.filter((permission) => {
    const parts = permissionParts(permission.code)
    return `${permission.code} ${permission.description} ${parts.group} ${parts.action}`
      .toLowerCase()
      .includes(normalizedSearch)
  })
  const groupedPermissions = visiblePermissions.reduce<
    Record<string, Permission[]>
  >((groups, permission) => {
    const group = permissionParts(permission.code).group
    ;(groups[group] ??= []).push(permission)
    return groups
  }, {})
  const togglePermission = (permissionCode: string, checked: boolean) => {
    setPermissionCodes((current) =>
      checked
        ? [...new Set([...current, permissionCode])]
        : current.filter((item) => item !== permissionCode)
    )
  }
  const validCode = /^[a-zA-Z][a-zA-Z0-9_]{1,79}$/.test(code.trim())

  return (
    <FormDialog
      tourId={role ? undefined : "users-role-form"}
      open={open}
      onOpenChange={onOpenChange}
      title={role ? `Cập nhật vai trò ${role.name}` : "Tạo vai trò tùy chỉnh"}
      description={
        role?.system
          ? "Vai trò gốc: có thể điều chỉnh bộ quyền nhưng mã, tên và trạng thái được bảo vệ."
          : "Chọn chính xác các thao tác mà người mang vai trò này được thực hiện. Phạm vi dữ liệu được gán riêng ở mục Phân quyền."
      }
      submitLabel={role ? "Lưu vai trò" : "Tạo vai trò"}
      size="xl"
      loading={save.isPending}
      disabled={
        (!role?.system && name.trim().length < 2) ||
        (!role && !validCode) ||
        permissionCodes.length === 0
      }
      onSubmit={() => save.mutate()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Mã vai trò"
          required
          hint="Viết liền không dấu; mã không thể đổi sau khi tạo."
        >
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ví dụ: QUAN_LY_BEP"
            maxLength={80}
            disabled={Boolean(role)}
          />
        </Field>
        <Field label="Tên hiển thị" required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Quản lý bếp"
            maxLength={150}
            disabled={Boolean(role?.system)}
          />
        </Field>
      </div>

      <Field
        label={`Bộ quyền (${permissionCodes.length} quyền đã chọn)`}
        required
        hint={
          role?.code === "ADMIN_OWNER"
            ? "Không thể bỏ các quyền quản trị tài khoản, vai trò và phân quyền cốt lõi để tránh khóa hệ thống."
            : "Chỉ chọn những quyền thực sự cần cho công việc của vai trò."
        }
      >
        <div className="space-y-3 rounded-xl border border-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tên hoặc mã quyền..."
              className="sm:max-w-sm"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPermissionCodes((current) => [
                    ...new Set([
                      ...current,
                      ...visiblePermissions.map((item) => item.code),
                    ]),
                  ])
                }
              >
                Chọn kết quả
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPermissionCodes([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
          <div className="max-h-[45vh] space-y-4 overflow-y-auto pr-1">
            {Object.entries(groupedPermissions).map(([group, items]) => (
              <section key={group} className="space-y-2">
                <h3 className="sticky top-0 bg-card py-1 text-xs font-bold text-foreground">
                  {group}
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((permission) => {
                    const parts = permissionParts(permission.code)
                    return (
                      <label
                        key={permission.code}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/70 p-2.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={permissionCodes.includes(permission.code)}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.code, checked === true)
                          }
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium">
                            {parts.action}
                          </span>
                          <span className="block truncate font-mono text-[10px] text-muted-foreground">
                            {permission.code}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </section>
            ))}
            {!permissionsQuery.isLoading && visiblePermissions.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Không tìm thấy quyền phù hợp.
              </p>
            )}
          </div>
        </div>
      </Field>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Create User Dialog
// ---------------------------------------------------------------------------

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [username, setUsername] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [kind, setKind] = React.useState<UserKind>("INTERNAL")
  const [supplierId, setSupplierId] = React.useState("")
  const [roleId, setRoleId] = React.useState("")
  const [scopeType, setScopeType] = React.useState<ScopeType>("ORGANIZATION")
  const [facilityId, setFacilityId] = React.useState("")
  const [stockLocationId, setStockLocationId] = React.useState("")
  const [departmentId, setDepartmentId] = React.useState("")

  const rolesQuery = usePagedQuery<Role>(
    "/roles",
    { page: 1, page_size: 50 },
    { enabled: open }
  )
  const roleOptions = (rolesQuery.data?.items ?? [])
    .filter(
      (role) =>
        role.active &&
        (kind === "SUPPLIER"
          ? role.code === "SUPPLIER"
          : role.code !== "SUPPLIER")
    )
    .map((role) => ({ value: role.id, label: `${role.name} (${role.code})` }))

  const create = useApiMutation<void, User>({
    mutationFn: () =>
      api.post<User>("/users", {
        username: username.trim(),
        display_name: displayName.trim(),
        password: password.trim(),
        kind,
        role_id: roleId,
        scope_type: kind === "SUPPLIER" ? "SUPPLIER" : scopeType,
        ...(kind === "SUPPLIER" && supplierId
          ? { supplier_id: supplierId }
          : {}),
        ...(facilityId ? { facility_id: facilityId } : {}),
        ...(stockLocationId ? { stock_location_id: stockLocationId } : {}),
        ...(departmentId ? { department_id: departmentId } : {}),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã tạo tài khoản người dùng.",
    onSuccess: () => {
      onOpenChange(false)
      setUsername("")
      setDisplayName("")
      setPassword("")
      setKind("INTERNAL")
      setSupplierId("")
      setRoleId("")
      setScopeType("ORGANIZATION")
      setFacilityId("")
      setStockLocationId("")
      setDepartmentId("")
      onCreated()
    },
  })

  const isValid =
    username.trim().length >= 3 &&
    password.trim().length >= 8 &&
    Boolean(roleId) &&
    (kind === "INTERNAL" || Boolean(supplierId)) &&
    (kind === "SUPPLIER" ||
      scopeType === "ORGANIZATION" ||
      scopeType === "OWN" ||
      (scopeType === "FACILITY" && Boolean(facilityId)) ||
      (scopeType === "STOCK_LOCATION" &&
        Boolean(facilityId) &&
        Boolean(stockLocationId)) ||
      (scopeType === "DEPARTMENT" &&
        Boolean(facilityId) &&
        Boolean(departmentId)))

  return (
    <FormDialog
      tourId="users-user-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo tài khoản người dùng"
      description="Tạo tài khoản nhân viên nội bộ hoặc tài khoản đại diện nhà cung cấp."
      submitLabel="Tạo tài khoản"
      loading={create.isPending}
      disabled={!isValid}
      onSubmit={() => create.mutate()}
    >
      <div className="space-y-4">
        <Field label="Loại tài khoản" required>
          <OptionSelect
            value={kind}
            onChange={(v) => {
              const nextKind = v as UserKind
              setKind(nextKind)
              setRoleId("")
              setScopeType(
                nextKind === "SUPPLIER" ? "SUPPLIER" : "ORGANIZATION"
              )
              setFacilityId("")
              setStockLocationId("")
              setDepartmentId("")
            }}
            options={[
              { value: "INTERNAL", label: "Nhân viên nội bộ F&B" },
              { value: "SUPPLIER", label: "Tài khoản Nhà cung cấp" },
            ]}
          />
        </Field>

        {kind === "SUPPLIER" && (
          <Field label="Nhà cung cấp đại diện" required>
            <SupplierSelect value={supplierId} onChange={setSupplierId} />
          </Field>
        )}

        <Field
          label="Tên đăng nhập"
          required
          hint="Tối thiểu 3 ký tự (viết liền không dấu)"
        >
          <Input
            placeholder="Ví dụ: nguyenvanan"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field
          label="Họ tên hiển thị"
          hint="Không bắt buộc, nhân viên có thể cập nhật sau"
        >
          <Input
            placeholder="Ví dụ: Nguyễn Văn An"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>

        <Field label="Mật khẩu khởi tạo" required hint="Tối thiểu 8 ký tự">
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Vai trò" required>
          <OptionSelect
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            placeholder="Chọn vai trò..."
          />
        </Field>

        {kind === "INTERNAL" && (
          <Field label="Phạm vi truy cập" required>
            <OptionSelect
              value={scopeType}
              onChange={(value) => {
                setScopeType(value as ScopeType)
                setFacilityId("")
                setStockLocationId("")
                setDepartmentId("")
              }}
              options={Object.entries(SCOPE_TYPE_LABELS)
                .filter(([value]) => value !== "SUPPLIER")
                .map(([value, label]) => ({ value, label }))}
            />
          </Field>
        )}

        {kind === "INTERNAL" &&
          ["FACILITY", "STOCK_LOCATION", "DEPARTMENT"].includes(scopeType) && (
            <Field label="Cơ sở" required>
              <FacilitySelect
                value={facilityId}
                onChange={(value) => {
                  setFacilityId(value)
                  setStockLocationId("")
                  setDepartmentId("")
                }}
              />
            </Field>
          )}

        {kind === "INTERNAL" &&
          scopeType === "STOCK_LOCATION" &&
          facilityId && (
            <Field label="Kho" required>
              <StockLocationSelect
                facilityId={facilityId}
                value={stockLocationId}
                onChange={setStockLocationId}
              />
            </Field>
          )}

        {kind === "INTERNAL" && scopeType === "DEPARTMENT" && facilityId && (
          <Field label="Bộ phận" required>
            <DepartmentSelect
              facilityId={facilityId}
              value={departmentId}
              onChange={setDepartmentId}
            />
          </Field>
        )}
      </div>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Reset Password Dialog
// ---------------------------------------------------------------------------

function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = React.useState("")

  const reset = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!user) throw new Error("No user")
      return api.post(`/users/${user.id}/reset-password`, {
        password: password.trim(),
      })
    },
    invalidate: INVALIDATE,
    successMessage: `Đã đặt lại mật khẩu cho tài khoản ${user?.username}.`,
    onSuccess: () => {
      onOpenChange(false)
      setPassword("")
    },
  })

  const isValid = password.trim().length >= 8

  return (
    <FormDialog
      open={Boolean(user)}
      onOpenChange={onOpenChange}
      title={`Đặt lại mật khẩu cho ${user?.displayName ?? ""}`}
      description={`Tài khoản: ${user?.username ?? ""}`}
      submitLabel="Xác nhận đổi mật khẩu"
      loading={reset.isPending}
      disabled={!isValid}
      onSubmit={() => reset.mutate()}
    >
      <div className="space-y-4">
        <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự">
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Assign Grant Dialog
// ---------------------------------------------------------------------------

function AssignGrantDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [userId, setUserId] = React.useState("")
  const [roleId, setRoleId] = React.useState("")
  const [scopeType, setScopeType] = React.useState<ScopeType>("ORGANIZATION")
  const [facilityId, setFacilityId] = React.useState("")
  const [stockLocationId, setStockLocationId] = React.useState("")
  const [departmentId, setDepartmentId] = React.useState("")

  const usersQuery = usePagedQuery<User>(
    "/users",
    { page: 1, page_size: 100 },
    { enabled: open }
  )
  const rolesQuery = usePagedQuery<Role>(
    "/roles",
    { page: 1, page_size: 50 },
    { enabled: open }
  )
  const selectedUser = (usersQuery.data?.items ?? []).find(
    (user) => user.id === userId
  )
  const roleOptions = (rolesQuery.data?.items ?? [])
    .filter(
      (role) =>
        role.active &&
        (selectedUser?.kind === "SUPPLIER"
          ? role.code === "SUPPLIER"
          : role.code !== "SUPPLIER")
    )
    .map((role) => ({ value: role.id, label: `${role.name} (${role.code})` }))

  const assign = useApiMutation<void, RoleGrant>({
    mutationFn: () =>
      api.post<RoleGrant>("/grants", {
        user_id: userId,
        role_id: roleId,
        scope_type: scopeType,
        ...(facilityId ? { facility_id: facilityId } : {}),
        ...(stockLocationId ? { stock_location_id: stockLocationId } : {}),
        ...(departmentId ? { department_id: departmentId } : {}),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã gán vai trò và phạm vi cho người dùng.",
    onSuccess: () => {
      onOpenChange(false)
      setUserId("")
      setRoleId("")
      setScopeType("ORGANIZATION")
      setFacilityId("")
      setStockLocationId("")
      setDepartmentId("")
      onCreated()
    },
  })

  const isValid =
    Boolean(userId) &&
    Boolean(roleId) &&
    (scopeType === "ORGANIZATION" ||
      scopeType === "OWN" ||
      scopeType === "SUPPLIER" ||
      (scopeType === "FACILITY" && Boolean(facilityId)) ||
      (scopeType === "STOCK_LOCATION" &&
        Boolean(facilityId) &&
        Boolean(stockLocationId)) ||
      (scopeType === "DEPARTMENT" &&
        Boolean(facilityId) &&
        Boolean(departmentId)))

  return (
    <FormDialog
      tourId="users-grant-form"
      open={open}
      onOpenChange={onOpenChange}
      title="Phân quyền tài khoản"
      description="Chọn vai trò và giới hạn dữ liệu tài khoản được phép truy cập theo cơ sở, kho hoặc bộ phận."
      submitLabel="Gán quyền"
      loading={assign.isPending}
      disabled={!isValid}
      onSubmit={() => assign.mutate()}
    >
      <div className="space-y-4">
        <Field label="Chọn người dùng" required>
          <OptionSelect
            value={userId}
            onChange={(value) => {
              setUserId(value)
              const user = (usersQuery.data?.items ?? []).find(
                (item) => item.id === value
              )
              setRoleId("")
              setScopeType(
                user?.kind === "SUPPLIER" ? "SUPPLIER" : "ORGANIZATION"
              )
              setFacilityId("")
              setStockLocationId("")
              setDepartmentId("")
            }}
            options={(usersQuery.data?.items ?? []).map((u) => ({
              value: u.id,
              label: `${u.displayName} (@${u.username})`,
              hint: u.kind === "INTERNAL" ? "Nhân viên nội bộ" : "Nhà cung cấp",
            }))}
            placeholder="Chọn tài khoản..."
          />
        </Field>

        <Field label="Chọn vai trò" required>
          <OptionSelect
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            placeholder="Chọn vai trò..."
          />
        </Field>

        <Field label="Phạm vi truy cập" required>
          <OptionSelect
            value={scopeType}
            onChange={(v) => {
              setScopeType(v as ScopeType)
              setFacilityId("")
              setStockLocationId("")
              setDepartmentId("")
            }}
            options={Object.entries(SCOPE_TYPE_LABELS)
              .filter(([value]) =>
                selectedUser?.kind === "SUPPLIER"
                  ? value === "SUPPLIER"
                  : value !== "SUPPLIER"
              )
              .map(([k, v]) => ({ value: k, label: v }))}
            disabled={!selectedUser}
          />
        </Field>

        {scopeType === "FACILITY" && (
          <Field label="Cơ sở được ủy quyền" required>
            <FacilitySelect value={facilityId} onChange={setFacilityId} />
          </Field>
        )}

        {scopeType === "STOCK_LOCATION" && (
          <div className="space-y-3">
            <Field label="Cơ sở trực thuộc" required>
              <FacilitySelect
                value={facilityId}
                onChange={(value) => {
                  setFacilityId(value)
                  setStockLocationId("")
                }}
              />
            </Field>
            {facilityId && (
              <Field label="Kho lưu trữ được ủy quyền" required>
                <StockLocationSelect
                  facilityId={facilityId}
                  value={stockLocationId}
                  onChange={setStockLocationId}
                />
              </Field>
            )}
          </div>
        )}

        {scopeType === "DEPARTMENT" && (
          <div className="space-y-3">
            <Field label="Cơ sở trực thuộc" required>
              <FacilitySelect
                value={facilityId}
                onChange={(f) => {
                  setFacilityId(f)
                  setDepartmentId("")
                }}
              />
            </Field>
            {facilityId && (
              <Field label="Bộ phận được ủy quyền" required>
                <DepartmentSelect
                  facilityId={facilityId}
                  value={departmentId}
                  onChange={setDepartmentId}
                />
              </Field>
            )}
          </div>
        )}
      </div>
    </FormDialog>
  )
}

// ---------------------------------------------------------------------------
// Main Users Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const canCreateUserAccount = useCan("user.create")
  const canAssignNewUser = useCan("grant.assign")
  const canCreateUser = canCreateUserAccount && canAssignNewUser
  const canUpdateUser = useCan("user.update")
  const canReadUsers = useCan("user.read")
  const canReadRoles = useCan("role.read")
  const canManageRoles = useCan("role.manage")
  const canReadGrants = useCan("grant.read")
  const validTabs = React.useMemo(
    () =>
      (["users", "roles", "grants"] as const).filter((candidate) =>
        candidate === "users"
          ? canReadUsers
          : candidate === "roles"
            ? canReadRoles
            : canReadGrants
      ),
    [canReadGrants, canReadRoles, canReadUsers]
  )
  const defaultTab = validTabs[0] ?? "users"
  const [activeTab, setActiveTab] = useTabSync(defaultTab, validTabs)
  const canResetPassword = useCan("user.reset_password")
  const canDeactivateUser = useCan("user.deactivate")
  const canAssignGrant = useCan("grant.assign")
  const canRevokeGrant = useCan("grant.revoke")

  // State dialogs
  const [openCreateUser, setOpenCreateUser] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<User | null>(null)
  const [editDisplayName, setEditDisplayName] = React.useState("")
  const [resetTarget, setResetTarget] = React.useState<User | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [roleTarget, setRoleTarget] = React.useState<Role | null>(null)
  const [openAssignGrant, setOpenAssignGrant] = React.useState(false)
  const [revokeTarget, setRevokeTarget] = React.useState<RoleGrant | null>(null)

  // Lists
  const usersList = useListState()
  const rolesList = useListState()
  const grantsList = useListState()

  // Queries
  const usersQuery = usePagedQuery<User>(
    "/users",
    { page: usersList.page, page_size: usersList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "users" && canReadUsers }
  )

  const rolesQuery = usePagedQuery<Role>(
    "/roles",
    { page: rolesList.page, page_size: rolesList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "roles" && canReadRoles }
  )

  const grantsQuery = usePagedQuery<RoleGrant>(
    "/grants",
    { page: grantsList.page, page_size: grantsList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "grants" && canReadGrants }
  )

  // User status toggling mutations
  const toggleUserStatusMutation = useApiMutation<User, { message: string }>({
    mutationFn: (u) => {
      const endpoint = u.active
        ? `/users/${u.id}/deactivate`
        : `/users/${u.id}/activate`
      return api.patch(endpoint, {})
    },
    invalidate: INVALIDATE,
    successMessage: "Đã cập nhật trạng thái hoạt động của tài khoản.",
  })

  const revokeGrantMutation = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!revokeTarget) throw new Error("No grant")
      return api.delete(`/grants/${revokeTarget.id}`)
    },
    invalidate: INVALIDATE,
    successMessage: "Đã thu hồi phân quyền của người dùng.",
    onSuccess: () => setRevokeTarget(null),
  })

  const updateUserMutation = useApiMutation<void, User>({
    mutationFn: () => {
      if (!editTarget) throw new Error("Chưa chọn tài khoản.")
      return api.patch<User>(`/users/${editTarget.id}`, {
        display_name: editDisplayName.trim(),
      })
    },
    invalidate: INVALIDATE,
    successMessage: "Đã cập nhật thông tin tài khoản.",
    onSuccess: () => setEditTarget(null),
  })

  const toggleRoleStatusMutation = useApiMutation<Role, Role>({
    mutationFn: (role) =>
      api.patch<Role>(`/roles/${role.id}`, { active: !role.active }),
    invalidate: INVALIDATE,
    successMessage: "Đã cập nhật trạng thái vai trò.",
  })

  // Columns for Users
  const userColumns: Column<User>[] = [
    {
      key: "username",
      header: "Tên đăng nhập",
      width: "160px",
      render: (u) => (
        <div className="flex flex-col">
          <Code className="font-semibold text-primary">@{u.username}</Code>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(u.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Họ và tên",
      render: (u) => (
        <span className="text-xs font-medium text-foreground">
          {u.displayName}
        </span>
      ),
    },
    {
      key: "kind",
      header: "Loại tài khoản",
      width: "170px",
      render: (u) => (
        <Cell2
          top={u.kind === "INTERNAL" ? "Nhân viên nội bộ" : "Nhà cung cấp"}
          bottom={u.supplier?.name}
        />
      ),
    },
    {
      key: "lastLogin",
      header: "Đăng nhập gần nhất",
      width: "160px",
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Chưa đăng nhập"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "130px",
      align: "center",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.active
              ? "bg-emerald-100 text-emerald-800"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {u.active ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <UserX className="h-3.5 w-3.5" />
          )}
          {u.active ? "Hoạt động" : "Khóa"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "160px",
      align: "right",
      render: (u) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canUpdateUser && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              title="Sửa tài khoản"
              onClick={() => {
                setEditDisplayName(u.displayName)
                setEditTarget(u)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canResetPassword && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary hover:bg-primary/10 hover:text-primary"
              title="Đặt lại mật khẩu"
              onClick={() => setResetTarget(u)}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
          {((u.active && canDeactivateUser) ||
            (!u.active && canUpdateUser)) && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 ${
                u.active
                  ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
              title={u.active ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
              onClick={() => toggleUserStatusMutation.mutate(u)}
              disabled={toggleUserStatusMutation.isPending}
            >
              {u.active ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ]

  // Columns for Roles
  const roleColumns: Column<Role>[] = [
    {
      key: "name",
      header: "Tên vai trò",
      render: (r) => <Cell2 top={r.name} bottom={`Mã: ${r.code}`} />,
    },
    {
      key: "system",
      header: "Phân loại",
      width: "130px",
      align: "center",
      render: (r) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            r.system
              ? "bg-blue-100 text-blue-800"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {r.system ? "Hệ thống" : "Tùy biến"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "120px",
      align: "center",
      render: (r) => <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "permissions",
      header: "Quyền hạn được cấp",
      render: (r) => {
        const perms = r.permissions ?? []
        return (
          <div className="flex max-w-md flex-wrap gap-1">
            {perms.slice(0, 4).map((p) => (
              <span
                key={p.permissionCode}
                className="rounded border border-border/50 bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
              >
                {p.permissionCode}
              </span>
            ))}
            {perms.length > 4 && (
              <span className="self-center text-[10px] font-semibold text-muted-foreground">
                +{perms.length - 4} quyền
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {canManageRoles && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                title={
                  r.system ? "Sửa bộ quyền vai trò gốc" : "Sửa tên và bộ quyền"
                }
                onClick={() => {
                  setRoleTarget(r)
                  setRoleDialogOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!r.system && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    r.active ? "h-8 text-destructive" : "h-8 text-emerald-600"
                  }
                  title={r.active ? "Vô hiệu hóa vai trò" : "Kích hoạt vai trò"}
                  disabled={toggleRoleStatusMutation.isPending}
                  onClick={() => toggleRoleStatusMutation.mutate(r)}
                >
                  {r.active ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  // Columns for Grants
  const grantColumns: Column<RoleGrant>[] = [
    {
      key: "user",
      header: "Người dùng",
      render: (g) => (
        <Cell2
          top={g.user?.displayName ?? g.userId}
          bottom={g.user?.username ? `@${g.user.username}` : undefined}
        />
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (g) => (
        <Cell2 top={g.role?.name ?? g.roleId} bottom={g.role?.code} />
      ),
    },
    {
      key: "scope",
      header: "Phạm vi dữ liệu",
      render: (g) => {
        const target =
          g.scopeType === "FACILITY"
            ? g.facility?.name
            : g.scopeType === "STOCK_LOCATION"
              ? g.stockLocation?.name
              : g.scopeType === "DEPARTMENT"
                ? g.department?.name
                : undefined

        return (
          <Cell2
            top={labelOf(SCOPE_TYPE_LABELS, g.scopeType)}
            bottom={target}
          />
        )
      },
    },
    {
      key: "createdAt",
      header: "Thời điểm cấp",
      width: "150px",
      render: (g) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(g.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      render: (g) => (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {canRevokeGrant && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Thu hồi quyền"
              onClick={() => setRevokeTarget(g)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Tài khoản & phân quyền"
        description="Quản lý tài khoản, vai trò và phạm vi dữ liệu mỗi người được phép truy cập."
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "users") usersQuery.refetch()
                if (activeTab === "roles") rolesQuery.refetch()
                if (activeTab === "grants") grantsQuery.refetch()
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            {activeTab === "users" && canCreateUser && (
              <Button
                data-tour="users-create-user"
                size="sm"
                onClick={() => setOpenCreateUser(true)}
              >
                <UserPlus className="h-4 w-4" />
                Tạo tài khoản
              </Button>
            )}
            {activeTab === "roles" && canManageRoles && (
              <Button
                data-tour="users-create-role"
                size="sm"
                onClick={() => {
                  setRoleTarget(null)
                  setRoleDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Tạo vai trò
              </Button>
            )}
            {activeTab === "grants" && canAssignGrant && (
              <Button
                data-tour="users-create-grant"
                size="sm"
                onClick={() => setOpenAssignGrant(true)}
              >
                <Plus className="h-4 w-4" />
                Gán quyền
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-3 sm:space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "users" | "roles" | "grants")}
          className="space-y-4"
        >
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <DataTable
              columns={userColumns}
              data={usersQuery.data?.items ?? []}
              total={usersQuery.data?.meta?.total}
              page={usersList.page}
              pageSize={usersList.pageSize}
              onPageChange={usersList.setPage}
              onPageSizeChange={usersList.setPageSize}
              loading={usersQuery.isLoading}
              emptyMessage="Không có tài khoản người dùng nào."
            />
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <DataTable
              columns={roleColumns}
              data={rolesQuery.data?.items ?? []}
              total={rolesQuery.data?.meta?.total}
              page={rolesList.page}
              pageSize={rolesList.pageSize}
              onPageChange={rolesList.setPage}
              onPageSizeChange={rolesList.setPageSize}
              loading={rolesQuery.isLoading}
              emptyMessage="Không có vai trò nào."
            />
          </TabsContent>

          {/* Grants Tab */}
          <TabsContent value="grants" className="space-y-4">
            <DataTable
              columns={grantColumns}
              data={grantsQuery.data?.items ?? []}
              total={grantsQuery.data?.meta?.total}
              page={grantsList.page}
              pageSize={grantsList.pageSize}
              onPageChange={grantsList.setPage}
              onPageSizeChange={grantsList.setPageSize}
              loading={grantsQuery.isLoading}
              emptyMessage="Chưa có phân quyền nào được thiết lập."
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateUserDialog
        open={openCreateUser}
        onOpenChange={setOpenCreateUser}
        onCreated={() => usersQuery.refetch()}
      />

      <ResetPasswordDialog
        user={resetTarget}
        onOpenChange={(o) => {
          if (!o) setResetTarget(null)
        }}
      />

      <FormDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title="Cập nhật tài khoản"
        description={editTarget ? `@${editTarget.username}` : undefined}
        submitLabel="Lưu thay đổi"
        loading={updateUserMutation.isPending}
        disabled={editDisplayName.trim().length < 2}
        onSubmit={() => updateUserMutation.mutate()}
      >
        <Field label="Họ và tên" required>
          <Input
            value={editDisplayName}
            onChange={(event) => setEditDisplayName(event.target.value)}
            maxLength={200}
          />
        </Field>
      </FormDialog>

      <AssignGrantDialog
        open={openAssignGrant}
        onOpenChange={setOpenAssignGrant}
        onCreated={() => grantsQuery.refetch()}
      />

      <ManageRoleDialog
        key={`${roleDialogOpen ? "open" : "closed"}-${roleTarget?.id ?? "new"}`}
        open={roleDialogOpen}
        role={roleTarget}
        onOpenChange={(open) => {
          setRoleDialogOpen(open)
          if (!open) setRoleTarget(null)
        }}
        onSaved={() => rolesQuery.refetch()}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null)
        }}
        title="Thu hồi quyền người dùng?"
        description={`Bạn có chắc chắn muốn thu hồi vai trò "${revokeTarget?.role?.name ?? ""}" khỏi tài khoản "${revokeTarget?.user?.displayName ?? ""}"?`}
        confirmLabel="Thu hồi quyền"
        variant="destructive"
        loading={revokeGrantMutation.isPending}
        onConfirm={() => revokeGrantMutation.mutate()}
      />
    </AdminLayout>
  )
}
