"use client";

import * as React from "react";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Cell2, Code, DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Field, FormDialog, OptionSelect, SearchInput } from "@/components/shared/form";
import {
  DepartmentSelect,
  FacilitySelect,
  StockLocationSelect,
  SupplierSelect,
} from "@/components/shared/entity-select";
import { useApiMutation, useApiQuery, usePagedQuery } from "@/hooks/use-api";
import { useListState } from "@/hooks/use-list-state";
import { api } from "@/lib/api/client";
import type {
  Role,
  RoleGrant,
  ScopeType,
  User,
  UserKind,
} from "@/lib/api/types";
import { SCOPE_TYPE_LABELS, labelOf } from "@/constants/labels";
import { useCan, useUser } from "@/stores/use-auth-store";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { toast } from "sonner";

const INVALIDATE = ["/users", "/roles", "/grants", "/dashboard/summary"];

// ---------------------------------------------------------------------------
// Create User Dialog
// ---------------------------------------------------------------------------

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [kind, setKind] = React.useState<UserKind>("INTERNAL");
  const [supplierId, setSupplierId] = React.useState("");

  const create = useApiMutation<void, User>({
    mutationFn: () =>
      api.post<User>("/users", {
        username: username.trim(),
        display_name: displayName.trim(),
        password: password.trim(),
        kind,
        ...(kind === "SUPPLIER" && supplierId ? { supplier_id: supplierId } : {}),
      }),
    invalidate: INVALIDATE,
    successMessage: "Đã tạo tài khoản người dùng.",
    onSuccess: () => {
      onOpenChange(false);
      setUsername("");
      setDisplayName("");
      setPassword("");
      setKind("INTERNAL");
      setSupplierId("");
      onCreated();
    },
  });

  const isValid =
    username.trim().length >= 3 &&
    displayName.trim().length >= 2 &&
    password.trim().length >= 8 &&
    (kind === "INTERNAL" || Boolean(supplierId));

  return (
    <FormDialog
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
            onChange={(v) => setKind(v as UserKind)}
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

        <Field label="Tên đăng nhập" required hint="Tối thiểu 3 ký tự (viết liền không dấu)">
          <Input
            placeholder="VD: nguyenvanan"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field label="Họ tên hiển thị" required>
          <Input
            placeholder="VD: Nguyễn Văn An"
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
      </div>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Reset Password Dialog
// ---------------------------------------------------------------------------

function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = React.useState("");

  const reset = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!user) throw new Error("No user");
      return api.post(`/users/${user.id}/reset-password`, {
        password: password.trim(),
      });
    },
    invalidate: INVALIDATE,
    successMessage: `Đã đặt lại mật khẩu cho tài khoản ${user?.username}.`,
    onSuccess: () => {
      onOpenChange(false);
      setPassword("");
    },
  });

  const isValid = password.trim().length >= 8;

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
  );
}

// ---------------------------------------------------------------------------
// Assign Grant Dialog
// ---------------------------------------------------------------------------

function AssignGrantDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [userId, setUserId] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [scopeType, setScopeType] = React.useState<ScopeType>("ORGANIZATION");
  const [facilityId, setFacilityId] = React.useState("");
  const [stockLocationId, setStockLocationId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");

  const usersQuery = usePagedQuery<User>("/users", { page: 1, page_size: 100 }, { enabled: open });
  const rolesQuery = usePagedQuery<Role>("/roles", { page: 1, page_size: 50 }, { enabled: open });

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
      onOpenChange(false);
      setUserId("");
      setRoleId("");
      setScopeType("ORGANIZATION");
      setFacilityId("");
      setStockLocationId("");
      setDepartmentId("");
      onCreated();
    },
  });

  const isValid = Boolean(userId) && Boolean(roleId);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Phân quyền tài khoản (Assign Grant)"
      description="Gán vai trò cùng phạm vi truy cập dữ liệu (Cơ sở, Kho hoặc Bộ phận)."
      submitLabel="Gán quyền"
      loading={assign.isPending}
      disabled={!isValid}
      onSubmit={() => assign.mutate()}
    >
      <div className="space-y-4">
        <Field label="Chọn người dùng" required>
          <OptionSelect
            value={userId}
            onChange={setUserId}
            options={(usersQuery.data?.items ?? []).map((u) => ({
              value: u.id,
              label: `${u.displayName} (@${u.username})`,
              hint: u.kind,
            }))}
            placeholder="Chọn tài khoản..."
          />
        </Field>

        <Field label="Chọn vai trò (Role)" required>
          <OptionSelect
            value={roleId}
            onChange={setRoleId}
            options={(rolesQuery.data?.items ?? []).map((r) => ({
              value: r.id,
              label: `${r.name} (${r.code})`,
            }))}
            placeholder="Chọn vai trò..."
          />
        </Field>

        <Field label="Phạm vi truy cập (Scope)" required>
          <OptionSelect
            value={scopeType}
            onChange={(v) => {
              setScopeType(v as ScopeType);
              setFacilityId("");
              setStockLocationId("");
              setDepartmentId("");
            }}
            options={Object.entries(SCOPE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Field>

        {scopeType === "FACILITY" && (
          <Field label="Cơ sở được ủy quyền" required>
            <FacilitySelect value={facilityId} onChange={setFacilityId} />
          </Field>
        )}

        {scopeType === "STOCK_LOCATION" && (
          <Field label="Kho lưu trữ được ủy quyền" required>
            <StockLocationSelect value={stockLocationId} onChange={setStockLocationId} />
          </Field>
        )}

        {scopeType === "DEPARTMENT" && (
          <div className="space-y-3">
            <Field label="Cơ sở trực thuộc" required>
              <FacilitySelect
                value={facilityId}
                onChange={(f) => {
                  setFacilityId(f);
                  setDepartmentId("");
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
  );
}

// ---------------------------------------------------------------------------
// Main Users Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const [activeTab, setActiveTab] = React.useState<"users" | "roles" | "grants">("users");

  const canCreateUser = useCan("user.create");
  const canUpdateUser = useCan("user.update");
  const canResetPassword = useCan("user.reset_password");
  const canDeactivateUser = useCan("user.deactivate");
  const canAssignGrant = useCan("grant.assign");
  const canRevokeGrant = useCan("grant.revoke");

  // State dialogs
  const [openCreateUser, setOpenCreateUser] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<User | null>(null);
  const [openAssignGrant, setOpenAssignGrant] = React.useState(false);
  const [revokeTarget, setRevokeTarget] = React.useState<RoleGrant | null>(null);

  // Lists
  const usersList = useListState();
  const rolesList = useListState();
  const grantsList = useListState();

  // Queries
  const usersQuery = usePagedQuery<User>(
    "/users",
    { page: usersList.page, page_size: usersList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "users" }
  );

  const rolesQuery = usePagedQuery<Role>(
    "/roles",
    { page: rolesList.page, page_size: rolesList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "roles" }
  );

  const grantsQuery = usePagedQuery<RoleGrant>(
    "/grants",
    { page: grantsList.page, page_size: grantsList.pageSize },
    { keepPreviousData: true, enabled: activeTab === "grants" }
  );

  // User status toggling mutations
  const toggleUserStatusMutation = useApiMutation<User, { message: string }>({
    mutationFn: (u) => {
      const endpoint = u.active ? `/users/${u.id}/deactivate` : `/users/${u.id}/activate`;
      return api.patch(endpoint, {});
    },
    invalidate: INVALIDATE,
    successMessage: "Đã cập nhật trạng thái hoạt động của tài khoản.",
  });

  const revokeGrantMutation = useApiMutation<void, { message: string }>({
    mutationFn: () => {
      if (!revokeTarget) throw new Error("No grant");
      return api.delete(`/grants/${revokeTarget.id}`);
    },
    invalidate: INVALIDATE,
    successMessage: "Đã thu hồi phân quyền của người dùng.",
    onSuccess: () => setRevokeTarget(null),
  });

  // Columns for Users
  const userColumns: Column<User>[] = [
    {
      key: "username",
      header: "Tên đăng nhập",
      width: "160px",
      render: (u) => (
        <div className="flex flex-col">
          <Code className="font-semibold text-primary">@{u.username}</Code>
          <span className="text-[11px] text-muted-foreground">{formatDate(u.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Họ và tên",
      render: (u) => <span className="font-medium text-xs text-foreground">{u.displayName}</span>,
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
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
            u.active ? "bg-emerald-100 text-emerald-800" : "bg-destructive/15 text-destructive"
          }`}
        >
          {u.active ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canResetPassword && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
              title="Đặt lại mật khẩu"
              onClick={() => setResetTarget(u)}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
          {canDeactivateUser && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 ${
                u.active
                  ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
              title={u.active ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
              onClick={() => toggleUserStatusMutation.mutate(u)}
              disabled={toggleUserStatusMutation.isPending}
            >
              {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Columns for Roles
  const roleColumns: Column<Role>[] = [
    {
      key: "name",
      header: "Tên vai trò",
      render: (r) => (
        <Cell2
          top={r.name}
          bottom={`Mã: ${r.code}`}
        />
      ),
    },
    {
      key: "system",
      header: "Phân loại",
      width: "130px",
      align: "center",
      render: (r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            r.system ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground"
          }`}
        >
          {r.system ? "Hệ thống" : "Tùy biến"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Quyền hạn được cấp",
      render: (r) => {
        const perms = r.permissions ?? [];
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {perms.slice(0, 4).map((p) => (
              <span
                key={p.permissionCode}
                className="text-[10px] font-mono bg-muted/80 text-foreground px-1.5 py-0.5 rounded border border-border/50"
              >
                {p.permissionCode}
              </span>
            ))}
            {perms.length > 4 && (
              <span className="text-[10px] text-muted-foreground font-semibold self-center">
                +{perms.length - 4} quyền
              </span>
            )}
          </div>
        );
      },
    },
  ];

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
        <Cell2
          top={g.role?.name ?? g.roleId}
          bottom={g.role?.code}
        />
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
            : undefined;

        return (
          <Cell2
            top={labelOf(SCOPE_TYPE_LABELS, g.scopeType)}
            bottom={target}
          />
        );
      },
    },
    {
      key: "createdAt",
      header: "Thời điểm cấp",
      width: "150px",
      render: (g) => (
        <span className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      render: (g) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          {canRevokeGrant && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Thu hồi quyền"
              onClick={() => setRevokeTarget(g)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Tài Khoản & Phân Quyền (RBAC)"
        description="Quản lý định danh người dùng, danh mục vai trò và chính sách phân quyền dữ liệu theo phạm vi."
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "users") usersQuery.refetch();
                if (activeTab === "roles") rolesQuery.refetch();
                if (activeTab === "grants") grantsQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Làm mới
            </Button>
            {activeTab === "users" && canCreateUser && (
              <Button size="sm" onClick={() => setOpenCreateUser(true)}>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Tạo tài khoản
              </Button>
            )}
            {activeTab === "grants" && canAssignGrant && (
              <Button size="sm" onClick={() => setOpenAssignGrant(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Gán quyền (Grant)
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-4"
        >
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Người dùng & Tài khoản
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Vai trò & Quyền hạn
            </TabsTrigger>
            <TabsTrigger value="grants" className="text-xs">
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Phân quyền theo phạm vi (Grants)
            </TabsTrigger>
          </TabsList>

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
          if (!o) setResetTarget(null);
        }}
      />

      <AssignGrantDialog
        open={openAssignGrant}
        onOpenChange={setOpenAssignGrant}
        onCreated={() => grantsQuery.refetch()}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
        title="Thu hồi quyền người dùng?"
        description={`Bạn có chắc chắn muốn thu hồi vai trò "${revokeTarget?.role?.name ?? ""}" khỏi tài khoản "${revokeTarget?.user?.displayName ?? ""}"?`}
        confirmLabel="Thu hồi quyền"
        variant="destructive"
        loading={revokeGrantMutation.isPending}
        onConfirm={() => revokeGrantMutation.mutate()}
      />
    </AdminLayout>
  );
}
