"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  Warehouse,
  ExternalLink,
  Ban,
  Archive,
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
  type FulfillmentOrder,
  type OrderStatus,
  type Supplier,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<FulfillmentOrder[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Create Supplier PO Dialog
  const [openPODialog, setOpenPODialog] = React.useState(false);
  const [poSupplierId, setPoSupplierId] = React.useState("");
  const [poAmount, setPoAmount] = React.useState("");
  const [poExpectedDate, setPoExpectedDate] = React.useState("");

  const loadData = () => {
    setOrders(dicaStore.getOrders());
    setSuppliers(dicaStore.getSuppliers());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.source_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.destination_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCloseOutstanding = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "CLOSED" as OrderStatus };
      }
      return o;
    });
    setOrders(updated);
    dicaStore.saveOrders(updated);
    toast.success(`Đã tất toán phần còn lại cho đơn ${orderId}`);
  };

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "CANCELLED" as OrderStatus };
      }
      return o;
    });
    setOrders(updated);
    dicaStore.saveOrders(updated);
    toast.error(`Đã hủy đơn ${orderId}`);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poAmount) {
      toast.error("Vui lòng chọn nhà cung cấp và nhập giá trị PO!");
      return;
    }

    const sup = suppliers.find((s) => s.id === poSupplierId);
    if (!sup) return;

    const newOrder: FulfillmentOrder = {
      id: `ord-${Date.now()}`,
      code: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(orders.length + 1).padStart(3, "0")}`,
      source_type: "SUPPLIER",
      source_name: sup.name,
      destination_name: "Kho Tổng Bình Tân",
      status: "RELEASED",
      order_date: new Date().toISOString(),
      expected_date:
        poExpectedDate || new Date(Date.now() + 86400000 * sup.lead_time_days).toISOString(),
      total_amount: parseFloat(poAmount) || 0,
      items_count: 3,
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    dicaStore.saveOrders(updated);

    toast.success(`Đã khởi tạo đơn đặt hàng ${newOrder.code}`);
    setOpenPODialog(false);
    setPoAmount("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Đơn Thực Hiện & Đặt Hàng (Orders & PO)
            </h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi lệnh xuất kho fulfillment và đơn đặt hàng mua ngoài từ nhà cung cấp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openPODialog} onOpenChange={setOpenPODialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Tạo đơn PO nhà cung cấp</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Đơn Đặt Hàng PO (Purchase Order)
                  </DialogTitle>
                  <DialogDescription>
                    Đặt mua nguyên vật liệu từ nhà cung cấp đưa về Kho Tổng.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePO} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nhà cung cấp đối tác</Label>
                    <Select value={poSupplierId} onValueChange={setPoSupplierId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn NCC..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Tổng giá trị đơn dự kiến (VNĐ)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="VD: 55000000"
                      value={poAmount}
                      onChange={(e) => setPoAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Ngày giao dự kiến</Label>
                    <Input
                      id="exp"
                      type="date"
                      value={poExpectedDate}
                      onChange={(e) => setPoExpectedDate(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit">Phát hành đơn PO</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn, nguồn cấp hoặc điểm đến..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="RELEASED">Đang xử lý (Released)</SelectItem>
                <SelectItem value="COMPLETED">Hoàn tất (Completed)</SelectItem>
                <SelectItem value="CLOSED">Đã đóng (Closed)</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy (Cancelled)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Mã Đơn</TableHead>
                <TableHead>Loại Đơn</TableHead>
                <TableHead>Bên Cung Cấp</TableHead>
                <TableHead>Điểm Nhận Hàng</TableHead>
                <TableHead className="text-right">Tổng Tiền</TableHead>
                <TableHead>Ngày Đặt / Dự Kiến</TableHead>
                <TableHead className="text-center">Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {ord.code}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        ord.source_type === "STOCK"
                          ? "border-purple-500/30 text-purple-600 dark:text-purple-400"
                          : "border-blue-500/30 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {ord.source_type === "STOCK" ? "Xuất kho (FO)" : "Đặt mua (PO)"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {ord.source_name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ord.destination_name}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                    {ord.total_amount.toLocaleString("vi-VN")} ₫
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {ord.order_date.substring(0, 10)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        ord.status === "COMPLETED"
                          ? "default"
                          : ord.status === "RELEASED"
                          ? "secondary"
                          : ord.status === "CANCELLED"
                          ? "destructive"
                          : "outline"
                      }
                      className={cn(
                        "text-[10px]",
                        ord.status === "RELEASED" &&
                          "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        ord.status === "COMPLETED" &&
                          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {ord.status === "RELEASED"
                        ? "Đang xử lý"
                        : ord.status === "COMPLETED"
                        ? "Hoàn tất"
                        : ord.status === "CLOSED"
                        ? "Đã tất toán"
                        : "Đã hủy"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ord.status === "RELEASED" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => handleCloseOutstanding(ord.id)}
                            title="Tất toán phần còn lại"
                          >
                            <Archive className="size-3 text-muted-foreground" />
                            <span>Đóng đơn</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleCancelOrder(ord.id)}
                            title="Hủy đơn"
                          >
                            <Ban className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
