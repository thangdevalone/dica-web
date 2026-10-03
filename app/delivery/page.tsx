"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Truck,
  Plus,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DispatchFormDialog } from "@/components/forms/dispatch-form-dialog";
import {
  useDispatchesQuery,
  useReceiptsQuery,
  useDiscrepanciesQuery,
  useFacilitiesQuery,
  useCreateDispatchMutation,
  usePostDispatchMutation,
  useResolveDiscrepancyMutation,
} from "@/hooks";

export default function DeliveryPage() {
  const { data: dispatches = [], refetch: refetchDispatches } = useDispatchesQuery();
  const { data: receipts = [], refetch: refetchReceipts } = useReceiptsQuery();
  const { data: discrepancies = [], refetch: refetchDiscrepancies } = useDiscrepanciesQuery();
  const { data: facilities = [] } = useFacilitiesQuery();

  const { mutate: createDispatch } = useCreateDispatchMutation();
  const { mutate: postDispatch } = usePostDispatchMutation();
  const { mutate: resolveDiscrepancy } = useResolveDiscrepancyMutation();

  // Dialog states
  const [openDispatchDialog, setOpenDispatchDialog] = React.useState(false);
  const [openResolveDialog, setOpenResolveDialog] = React.useState(false);
  const [selectedDiscId, setSelectedDiscId] = React.useState<string | null>(null);
  const [resolveNote, setResolveNote] = React.useState("");

  const handleRefresh = () => {
    refetchDispatches();
    refetchReceipts();
    refetchDiscrepancies();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Giao Nhận, Vận Chuyển & Xử Lý Sai Lệch
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Kiểm soát xuất kho Dispatch, biên bản nhận hàng Receipt và đối soát sai lệch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-3.5" />
              <span>Làm mới</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl shadow-xs"
              onClick={() => setOpenDispatchDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Tạo lệnh xuất kho</span>
            </Button>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <Tabs defaultValue="dispatches" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-[480px] rounded-xl border border-border bg-muted/40 p-1">
            <TabsTrigger value="dispatches" className="text-xs rounded-lg gap-1.5">
              <Truck className="size-3.5" />
              <span>Xuất Kho ({dispatches.length})</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="text-xs rounded-lg gap-1.5">
              <PackageCheck className="size-3.5" />
              <span>Biên Bản Nhận ({receipts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="text-xs rounded-lg gap-1.5">
              <AlertTriangle className="size-3.5" />
              <span>Sai Lệch ({discrepancies.filter((d) => d.status === "OPEN").length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dispatches */}
          <TabsContent value="dispatches" className="mt-4">
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Mã Lệnh</TableHead>
                    <TableHead>Đơn Gốc</TableHead>
                    <TableHead>Từ Cơ Sở</TableHead>
                    <TableHead>Đến Điểm Nhận</TableHead>
                    <TableHead>Tài Xế / Biển Số</TableHead>
                    <TableHead>Niêm Phong Chì</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có lệnh xuất kho nào được khởi tạo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dispatches.map((dsp) => (
                      <TableRow key={dsp.id} className="border-border">
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {dsp.code}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {dsp.orderCode}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {dsp.from_facility}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {dsp.to_facility}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {dsp.driver_name} ({dsp.license_plate})
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {dsp.seal_code}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border bg-muted text-foreground font-semibold"
                          >
                            {dsp.status === "POSTED" ? "Đã niêm phong" : "Bản nháp"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {dsp.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] rounded-lg border-border hover:bg-muted"
                              onClick={() => postDispatch(dsp.id)}
                            >
                              Niêm phong & Xuất
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 2: Receipts */}
          <TabsContent value="receipts" className="mt-4">
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Mã Biên Bản</TableHead>
                    <TableHead>Lệnh Xuất Gốc</TableHead>
                    <TableHead>Cơ Sở Nhận</TableHead>
                    <TableHead>Người Nhận Hàng</TableHead>
                    <TableHead>Ngày Nhận</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có biên bản nhận hàng nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((rcp) => (
                      <TableRow key={rcp.id} className="border-border">
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {rcp.code}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {rcp.dispatch_code || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {rcp.received_facility}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rcp.received_by}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {rcp.received_at?.substring(0, 10)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border bg-muted text-foreground font-semibold"
                          >
                            {rcp.status === "POSTED"
                              ? "Hoàn tất"
                              : rcp.status === "PENDING_EXCESS_REVIEW"
                              ? "Chờ duyệt thừa"
                              : "Bản nháp"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 3: Discrepancies */}
          <TabsContent value="discrepancies" className="mt-4">
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Biên Bản Nhận</TableHead>
                    <TableHead>Nguyên Liệu</TableHead>
                    <TableHead>Loại Sai Lệch</TableHead>
                    <TableHead className="text-right">Dự Kiến</TableHead>
                    <TableHead className="text-right">Thực Nhận</TableHead>
                    <TableHead className="text-right">Chênh Lệch</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Xử Lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                        Không có vụ việc sai lệch nào cần giải quyết.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discrepancies.map((disc) => (
                      <TableRow key={disc.id} className="border-border">
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {disc.receipt_code}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {disc.ingredient_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border text-foreground font-medium"
                          >
                            {disc.type === "SHORTAGE"
                              ? "Thiếu hàng"
                              : disc.type === "EXCESS"
                              ? "Thừa hàng"
                              : "Hư hỏng"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {disc.expected_quantity} {disc.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground font-semibold">
                          {disc.actual_quantity} {disc.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                          {disc.difference > 0 ? `+${disc.difference}` : disc.difference} {disc.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border bg-muted text-foreground font-semibold"
                          >
                            {disc.status === "RESOLVED" ? "Đã giải quyết" : "Đang chờ"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {disc.status === "OPEN" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] rounded-lg border-border hover:bg-muted"
                              onClick={() => {
                                setSelectedDiscId(disc.id);
                                setResolveNote("");
                                setOpenResolveDialog(true);
                              }}
                            >
                              Giải quyết
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic truncate max-w-[120px] inline-block">
                              {disc.resolution_note || "Đã đóng"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dispatch Form Dialog (react-hook-form + zod) */}
        <DispatchFormDialog
          open={openDispatchDialog}
          onOpenChange={setOpenDispatchDialog}
          facilities={facilities}
          onSubmitSuccess={(values) => {
            createDispatch({
              toFacility: values.toFacility,
              driverName: values.driverName,
              licensePlate: values.licensePlate,
              sealCode: values.sealCode,
            });
          }}
        />

        {/* Resolve Discrepancy Dialog */}
        <Dialog open={openResolveDialog} onOpenChange={setOpenResolveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Xác Nhận Giải Quyết Sai Lệch Giao Nhận
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ghi chú biện pháp xử lý để lưu vết sổ cái kho
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ghi chú giải quyết</Label>
                <Input
                  placeholder="VD: Đã đối chiếu camera kiểm hàng, lập biên bản trừ công nợ NCC"
                  className="h-9 text-xs"
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenResolveDialog(false)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedDiscId) {
                    resolveDiscrepancy({
                      id: selectedDiscId,
                      note: resolveNote || "Đã xác minh và giải quyết",
                    });
                    setOpenResolveDialog(false);
                  }
                }}
              >
                Xác nhận giải quyết
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
