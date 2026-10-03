"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  ClipboardList,
  Plus,
  Search,
  Check,
  X,
  Eye,
  DollarSign,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupplyRequestDialog } from "@/components/forms";
import {
  useSupplyRequestsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} from "@/hooks";
import { useAppStore } from "@/stores/use-app-store";
import type { SupplyRequest } from "@/types";
import { cn } from "@/lib/utils";

export default function SupplyRequestsPage() {
  const selectedFacilityId = useAppStore((state) => state.selectedFacilityId);

  // TanStack Query
  const {
    data: requests = [],
    refetch,
    isLoading,
  } = useSupplyRequestsQuery(
    selectedFacilityId !== "ALL" ? selectedFacilityId : undefined
  );
  const { mutate: approveRequest, isPending: isApproving } = useApproveRequestMutation();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectRequestMutation();

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [selectedReq, setSelectedReq] = React.useState<SupplyRequest | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = React.useState(false);

  // Filtered requests
  const filteredRequests = React.useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.destinationFacilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requested_by.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Status counts
  const submittedCount = requests.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const draftCount = requests.filter((r) => r.status === "DRAFT").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Yêu Cầu Cấp Hàng Nội Bộ
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Quy trình phê duyệt phiếu đề xuất nguyên liệu từ chi nhánh tới Kho Tổng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="size-3.5" />
              <span>Làm mới</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs shadow-sm"
              onClick={() => setOpenCreateDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Tạo phiếu yêu cầu</span>
            </Button>
          </div>
        </div>

        {/* Pipeline Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all hover:border-primary/50",
              statusFilter === "ALL" && "border-primary bg-muted/30"
            )}
            onClick={() => setStatusFilter("ALL")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">TỔNG SỐ PHIẾU</p>
                <p className="text-xl font-bold font-mono text-foreground">{requests.length}</p>
              </div>
              <ClipboardList className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all hover:border-primary/50",
              statusFilter === "SUBMITTED" && "border-primary bg-muted/30"
            )}
            onClick={() => setStatusFilter("SUBMITTED")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">CHỜ DUYỆT</p>
                <p className="text-xl font-bold font-mono text-foreground">{submittedCount}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Cần xử lý
              </Badge>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all hover:border-primary/50",
              statusFilter === "APPROVED" && "border-primary bg-muted/30"
            )}
            onClick={() => setStatusFilter("APPROVED")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">ĐÃ PHÊ DUYỆT</p>
                <p className="text-xl font-bold font-mono text-foreground">{approvedCount}</p>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Sẵn sàng xuất
              </Badge>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all hover:border-primary/50",
              statusFilter === "DRAFT" && "border-primary bg-muted/30"
            )}
            onClick={() => setStatusFilter("DRAFT")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">BẢN NHÁP</p>
                <p className="text-xl font-bold font-mono text-foreground">{draftCount}</p>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Chưa gửi
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã phiếu, chi nhánh hoặc người tạo..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Requests Table */}
        <Card className="border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px] text-xs">Mã Phiếu</TableHead>
                <TableHead className="text-xs">Cơ Sở Tiếp Nhận</TableHead>
                <TableHead className="text-xs">Nguồn Cấp</TableHead>
                <TableHead className="text-xs">Người Yêu Cầu</TableHead>
                <TableHead className="text-right text-xs">Số Mặt Hàng</TableHead>
                <TableHead className="text-right text-xs">Tổng Giá Trị</TableHead>
                <TableHead className="text-center text-xs">Trạng Thái</TableHead>
                <TableHead className="text-right text-xs">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Không tìm thấy phiếu yêu cầu nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {req.code}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {req.destinationFacilityName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.sourceFacilityName || "Kho Tổng"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.requested_by}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {req.total_items} SKU
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                      {req.total_value.toLocaleString("vi-VN")} ₫
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          req.status === "APPROVED"
                            ? "outline"
                            : req.status === "SUBMITTED"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {req.status === "SUBMITTED"
                          ? "Chờ duyệt"
                          : req.status === "APPROVED"
                          ? "Đã duyệt"
                          : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setSelectedReq(req);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {req.status === "SUBMITTED" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              disabled={isApproving}
                              onClick={() => approveRequest(req.id)}
                            >
                              <Check className="size-3" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                              disabled={isRejecting}
                              onClick={() => rejectRequest({ id: req.id })}
                            >
                              <X className="size-3" />
                              <span>Từ chối</span>
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

        {/* Modular Request Creation Dialog (react-hook-form + zod) */}
        <SupplyRequestDialog
          open={openCreateDialog}
          onOpenChange={setOpenCreateDialog}
        />

        {/* Request Detail Modal */}
        {selectedReq && (
          <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-base font-bold font-mono">
                      {selectedReq.code}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Chi tiết mặt hàng yêu cầu cấp cho {selectedReq.destinationFacilityName}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedReq.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
                  <p>
                    <span className="text-muted-foreground">Người lập: </span>
                    <span className="font-semibold text-foreground">{selectedReq.requested_by}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Thời gian: </span>
                    <span className="font-mono text-foreground">
                      {new Date(selectedReq.created_at).toLocaleString("vi-VN")}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ghi chú: </span>
                    <span className="text-foreground">{selectedReq.notes || "Không có"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tổng giá trị: </span>
                    <span className="font-bold text-foreground font-mono">
                      {selectedReq.total_value.toLocaleString("vi-VN")} ₫
                    </span>
                  </p>
                </div>

                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Mặt Hàng</TableHead>
                        <TableHead className="text-right text-xs">SL Yêu Cầu</TableHead>
                        <TableHead className="text-right text-xs">SL Duyệt</TableHead>
                        <TableHead className="text-right text-xs">Thành Tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReq.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="text-xs font-medium">
                            {it.ingredientName} ({it.ingredientCode})
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {it.requested_quantity} {it.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                            {it.approved_quantity} {it.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-foreground">
                            {it.estimated_cost.toLocaleString("vi-VN")} ₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setOpenDetailDialog(false)}
                >
                  Đóng
                </Button>
                {selectedReq.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      approveRequest(selectedReq.id);
                      setOpenDetailDialog(false);
                    }}
                  >
                    <Check className="size-3.5" />
                    <span>Duyệt phiếu này</span>
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
