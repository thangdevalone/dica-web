"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  ShoppingCart,
  Plus,
  Search,
  Archive,
  Ban,
  RefreshCw,
} from "lucide-react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { PurchaseOrderDialog } from "@/components/forms/purchase-order-dialog";
import {
  useOrdersQuery,
  useSuppliersQuery,
  useCreatePOMutation,
  useCloseOrderMutation,
  useCancelOrderMutation,
} from "@/hooks";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const { data: orders = [], refetch: refetchOrders } = useOrdersQuery();
  const { data: suppliers = [] } = useSuppliersQuery();
  const { mutate: createPO } = useCreatePOMutation();
  const { mutate: closeOrder } = useCloseOrderMutation();
  const { mutate: cancelOrder } = useCancelOrderMutation();

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Create Supplier PO Dialog
  const [openPODialog, setOpenPODialog] = React.useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.source_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.destination_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Đơn Thực Hiện & Đặt Mua (PO / FO)
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi chu kỳ thực hiện đơn hàng, đặt mua nhà cung cấp và tất toán công nợ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              onClick={() => refetchOrders()}
            >
              <RefreshCw className="size-3.5" />
              <span>Làm mới</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl shadow-xs"
              onClick={() => setOpenPODialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Phát hành đơn PO</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn, nguồn cấp hoặc điểm đến..."
              className="pl-9 h-9 text-xs rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44 text-xs rounded-xl">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="RELEASED">Đang xử lý (Released)</SelectItem>
                <SelectItem value="COMPLETED">Hoàn tất (Completed)</SelectItem>
                <SelectItem value="CLOSED">Đã tất toán (Closed)</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy (Cancelled)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table in Pure Monochrome */}
        <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
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
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="border-border">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {ord.code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border text-foreground font-medium"
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
                      {formatCurrency(ord.total_amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {ord.order_date.substring(0, 10)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border bg-muted text-foreground font-semibold"
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
                              className="h-7 text-[11px] gap-1 rounded-lg border-border hover:bg-muted"
                              onClick={() => closeOrder(ord.id)}
                              title="Tất toán phần còn lại"
                            >
                              <Archive className="size-3 text-muted-foreground" />
                              <span>Đóng đơn</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => cancelOrder(ord.id)}
                              title="Hủy đơn"
                            >
                              <Ban className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Purchase Order Dialog (react-hook-form + zod) */}
        <PurchaseOrderDialog
          open={openPODialog}
          onOpenChange={setOpenPODialog}
          suppliers={suppliers}
          onSubmitSuccess={(values) => {
            const supplier = suppliers.find((s) => s.id === values.supplierId);
            createPO({
              supplierId: values.supplierId,
              supplierName: supplier?.name || "Nhà Cung Cấp",
              destinationName: "Kho Tổng Bình Tân",
              totalAmount: values.estimatedAmount,
              expectedDate: values.expectedDeliveryDate,
            });
          }}
        />
      </div>
    </AdminLayout>
  );
}
