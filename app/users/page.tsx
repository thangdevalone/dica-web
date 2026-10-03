"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Users,
  Plus,
  Search,
  Shield,
  Key,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/forms/user-form-dialog";
import {
  useUsersQuery,
  useRolesQuery,
  useFacilitiesQuery,
  useCreateUserMutation,
  useToggleUserMutation,
} from "@/hooks";
import { PERMISSION_GROUPS } from "@/constants";

export default function UsersPage() {
  const { data: users = [], refetch: refetchUsers } = useUsersQuery();
  const { data: roles = [] } = useRolesQuery();
  const { data: facilities = [] } = useFacilitiesQuery();

  const { mutate: createUser } = useCreateUserMutation();
  const { mutate: toggleUser } = useToggleUserMutation();

  const [searchUser, setSearchUser] = React.useState("");
  const [openUserDialog, setOpenUserDialog] = React.useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tài Khoản & Phân Quyền (RBAC)
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Quản trị người dùng, vai trò bảo mật và phạm vi truy cập dữ liệu chi nhánh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              onClick={() => refetchUsers()}
            >
              <RefreshCw className="size-3.5" />
              <span>Làm mới</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl shadow-xs"
              onClick={() => setOpenUserDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Cấp tài khoản mới</span>
            </Button>
          </div>
        </div>

        {/* Tabs: Users List & Roles/Permissions Matrix */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-80 rounded-xl border border-border bg-muted/40 p-1">
            <TabsTrigger value="users" className="text-xs rounded-lg gap-1.5">
              <Users className="size-3.5" />
              <span>Tài Khoản ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs rounded-lg gap-1.5">
              <Shield className="size-3.5" />
              <span>Ma Trận Quyền ({roles.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Users */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm nhân sự theo tên, email hoặc username..."
                className="pl-9 h-9 text-xs rounded-xl"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Họ & Tên</TableHead>
                    <TableHead>Tên Đăng Nhập</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai Trò Hệ Thống</TableHead>
                    <TableHead>Phạm Vi Cơ Sở</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-border">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {u.full_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        @{u.username}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-border text-foreground font-medium">
                          {u.role_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {u.facility_assigned || "Toàn Chuỗi"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border bg-muted text-foreground font-semibold"
                        >
                          {u.active ? "Đang hoạt động" : "Tạm khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 rounded-lg border-border hover:bg-muted"
                          onClick={() => toggleUser(u.id)}
                        >
                          {u.active ? (
                            <>
                              <UserX className="size-3 text-muted-foreground" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-3 text-muted-foreground" />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 2: Permissions Matrix */}
          <TabsContent value="roles" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id} className="rounded-2xl border-border bg-card/90 p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {role.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {role.code}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-border text-foreground">
                      {role.permissions_count || 12} quyền
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {role.description}
                  </p>
                </Card>
              ))}
            </div>

            {/* Permission Catalogue */}
            <Card className="rounded-2xl border-border bg-card/90 p-5 mt-6 shadow-xs">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Danh Mục 24 Quyền Hạn Trong Hệ Thống DICA
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {PERMISSION_GROUPS.map((grp) => (
                  <div key={grp.module} className="space-y-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {grp.module}
                    </p>
                    <div className="space-y-1.5">
                      {grp.permissions.map((perm) => (
                        <div
                          key={perm.code}
                          className="rounded-xl border border-border/60 bg-muted/20 p-2 text-xs"
                        >
                          <p className="font-mono text-[11px] font-bold text-foreground">
                            {perm.code}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {perm.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Form Dialog (react-hook-form + zod) */}
        <UserFormDialog
          open={openUserDialog}
          onOpenChange={setOpenUserDialog}
          roles={roles}
          facilities={facilities}
          onSubmitSuccess={(values) => {
            createUser(values);
          }}
        />
      </div>
    </AdminLayout>
  );
}
