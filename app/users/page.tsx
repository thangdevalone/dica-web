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
  Building2,
  Lock,
  Check,
  X,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  dicaStore,
  type User,
  type Role,
  type Facility,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

const PERMISSION_GROUPS = [
  {
    module: "Cơ Cấu Tổ Chức",
    permissions: [
      { code: "facility.read", desc: "Xem danh sách chi nhánh & kho" },
      { code: "facility.manage", desc: "Tạo và cấu hình cơ sở" },
      { code: "stock_location.manage", desc: "Quản lý điểm lưu kho" },
    ],
  },
  {
    module: "Danh Mục & Nhà Cung Cấp",
    permissions: [
      { code: "ingredient.read", desc: "Xem danh mục nguyên vật liệu SKU" },
      { code: "ingredient.manage", desc: "Thêm sửa xóa nguyên vật liệu" },
      { code: "conversion.manage", desc: "Cấu hình tỷ lệ quy đổi đơn vị" },
      { code: "supplier.manage", desc: "Quản lý đối tác cung ứng" },
    ],
  },
  {
    module: "Yêu Cầu & Đơn Hàng",
    permissions: [
      { code: "request.create", desc: "Lập phiếu xin cấp hàng" },
      { code: "request.approve", desc: "Phê duyệt yêu cầu cấp hàng" },
      { code: "order.close_outstanding", desc: "Tất toán đơn đặt hàng thiếu" },
    ],
  },
  {
    module: "Giao Nhận & Kho Vận",
    permissions: [
      { code: "dispatch.post", desc: "Xuất kho và niêm phong xe tải" },
      { code: "receipt.post", desc: "Xác nhận nhận hàng tại chi nhánh" },
      { code: "discrepancy.resolve", desc: "Xử lý sai lệch thiếu / thừa" },
      { code: "stock.read", desc: "Xem số dư tồn kho tức thời" },
    ],
  },
  {
    module: "iPOS & Định Mức Món",
    permissions: [
      { code: "recipe.manage", desc: "Thiết lập định lượng món ăn (BOM)" },
      { code: "variance.recalculate", desc: "Tính toán hao hụt thực tế" },
      { code: "alert_rule.manage", desc: "Cấu hình quy tắc cảnh báo" },
    ],
  },
  {
    module: "Quản Trị Hệ Thống",
    permissions: [
      { code: "user.create", desc: "Tạo và phân quyền tài khoản" },
      { code: "user.deactivate", desc: "Đình chỉ tài khoản nhân viên" },
      { code: "audit.read", desc: "Tra cứu nhật ký thao tác hệ thống" },
    ],
  },
];

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);

  // Search
  const [searchUser, setSearchUser] = React.useState("");

  // Create User State
  const [openUserDialog, setOpenUserDialog] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState("");
  const [newFullName, setNewFullName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState("");
  const [newFac, setNewFac] = React.useState("");
  const [newKind, setNewKind] = React.useState<"INTERNAL" | "SUPPLIER">("INTERNAL");

  const loadData = () => {
    setUsers(dicaStore.getUsers());
    setRoles(dicaStore.getRoles());
    setFacilities(dicaStore.getFacilities());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleToggleActive = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextState = !u.active;
        toast.info(nextState ? `Đã kích hoạt lại tài khoản ${u.username}` : `Đã đình chỉ tài khoản ${u.username}`);
        return { ...u, active: nextState };
      }
      return u;
    });
    setUsers(updated);
    dicaStore.saveUsers(updated);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFullName || !newEmail || !newRole) {
      toast.error("Vui lòng điền đủ các trường bắt buộc!");
      return;
    }

    const fac = facilities.find((f) => f.id === newFac);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      full_name: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      kind: newKind,
      role_name: newRole,
      facility_assigned: fac?.name,
      active: true,
      created_at: new Date().toISOString(),
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    dicaStore.saveUsers(updated);

    toast.success(`Đã cấp tài khoản cho ${newUser.full_name}`);
    setOpenUserDialog(false);
    setNewUsername("");
    setNewFullName("");
    setNewEmail("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Tài Khoản & Phân Quyền Truy Cập (RBAC)
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản trị người dùng nội bộ, cổng nhà cung cấp và phân bổ quyền hạn đa chi nhánh.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Cấp tài khoản mới</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Tài Khoản Người Dùng Mới
                  </DialogTitle>
                  <DialogDescription>
                    Khởi tạo thông tin đăng nhập và gán vai trò vận hành trong hệ thống.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="uName">Tên đăng nhập (Username)</Label>
                      <Input
                        id="uName"
                        placeholder="VD: chef.q7"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loại tài khoản</Label>
                      <Select
                        value={newKind}
                        onValueChange={(val) => setNewKind(val as "INTERNAL" | "SUPPLIER")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Nhân viên nội bộ</SelectItem>
                          <SelectItem value="SUPPLIER">Nhà cung cấp đối tác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input
                      id="fullName"
                      placeholder="VD: Trần Văn Nam"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email công việc</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="VD: nam.chef@dica.vn"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Vai trò (Role)</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cơ sở phân công</Label>
                      <Select value={newFac} onValueChange={setNewFac}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toàn quyền / Chi nhánh" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilities.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit">Lưu và cấp tài khoản</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs: Users and Roles Matrix */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="users" className="gap-2 text-xs">
              <Users className="size-4" />
              <span>Danh Sách Tài Khoản ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2 text-xs">
              <Shield className="size-4" />
              <span>Vai Trò & Ma Trận Phân Quyền</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tài khoản theo tên, email hoặc username..."
                  className="pl-9 h-9 text-xs"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Người Dùng</TableHead>
                    <TableHead>Tài Khoản (Username)</TableHead>
                    <TableHead>Vai Trò Đảm Nhiệm</TableHead>
                    <TableHead>Phạm Vi Cơ Sở</TableHead>
                    <TableHead>Phân Loại</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="text-xs font-semibold text-foreground">{u.full_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary font-bold">
                        {u.username}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium">
                        {u.role_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.facility_assigned || "Toàn hệ thống (HQ)"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            u.kind === "INTERNAL"
                              ? "border-purple-500/30 text-purple-700 dark:text-purple-400"
                              : "border-blue-500/30 text-blue-700 dark:text-blue-400"
                          )}
                        >
                          {u.kind === "INTERNAL" ? "Nội bộ" : "Nhà cung cấp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            u.active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-500/15 text-red-700 dark:text-red-400"
                          )}
                        >
                          {u.active ? "Đang hoạt động" : "Đã đình chỉ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 text-xs gap-1",
                            u.active ? "text-red-500 hover:text-red-700" : "text-emerald-600"
                          )}
                          onClick={() => handleToggleActive(u.id)}
                        >
                          {u.active ? (
                            <>
                              <UserX className="size-3.5" />
                              <span>Đình chỉ</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-3.5" />
                              <span>Mở lại</span>
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

          {/* TAB 2: ROLES & PERMISSIONS */}
          <TabsContent value="roles" className="space-y-6">
            {/* Roles cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <Card key={role.id} className="border-border/80">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {role.code}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-primary">
                        {role.permissions_count} quyền
                      </span>
                    </div>
                    <CardTitle className="font-heading text-sm font-bold pt-1">
                      {role.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed">
                    {role.description}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comprehensive Permission Matrix */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold">
                  Ma Trận Phân Quyền Chi Tiết (Role Permission Matrix)
                </CardTitle>
                <CardDescription>
                  Quy định quyền truy cập các endpoint và nghiệp vụ theo RBAC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.module} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                      {group.module}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.permissions.map((perm) => (
                        <div
                          key={perm.code}
                          className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5"
                        >
                          <div className="mt-0.5 flex size-4 items-center justify-center rounded bg-primary/10 text-primary">
                            <Check className="size-2.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {perm.code}
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {perm.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
