"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Truck,
  Plus,
  Search,
  PackageCheck,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Check,
  AlertCircle,
  FileText,
  UserCheck,
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
  type Dispatch,
  type Receipt,
  type Discrepancy,
  type Facility,
  type DiscrepancyType,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function DeliveryPage() {
  const [dispatches, setDispatches] = React.useState<Dispatch[]>([]);
  const [receipts, setReceipts] = React.useState<Receipt[]>([]);
  const [discrepancies, setDiscrepancies] = React.useState<Discrepancy[]>([]);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);

  // Create Dispatch State
  const [openDispatchDialog, setOpenDispatchDialog] = React.useState(false);
  const [dspToFac, setDspToFac] = React.useState("");
  const [dspDriver, setDspDriver] = React.useState("");
  const [dspPlate, setDspPlate] = React.useState("");
  const [dspSeal, setDspSeal] = React.useState("");

  // Resolve Discrepancy State
  const [openResolveDialog, setOpenResolveDialog] = React.useState(false);
  const [selectedDisc, setSelectedDisc] = React.useState<Discrepancy | null>(null);
  const [resolveNote, setResolveNote] = React.useState("");

  const loadData = () => {
    setDispatches(dicaStore.getDispatches());
    setReceipts(dicaStore.getReceipts());
    setDiscrepancies(dicaStore.getDiscrepancies());
    setFacilities(dicaStore.getFacilities());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handlePostDispatch = (id: string) => {
    const updated = dispatches.map((d) => {
      if (d.id === id) {
        return { ...d, status: "POSTED" as const };
      }
      return d;
    });
    setDispatches(updated);
    dicaStore.saveDispatches(updated);
    toast.success(`Đã xuất kho và niêm phong xe giao vận ${id}`);
  };

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dspToFac || !dspDriver || !dspPlate) {
      toast.error("Vui lòng điền đủ điểm nhận, tài xế và biển số xe!");
      return;
    }

    const targetFac = facilities.find((f) => f.id === dspToFac);

    const newDsp: Dispatch = {
      id: `dsp-${Date.now()}`,
      code: `DSP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(dispatches.length + 1).padStart(2, "0")}`,
      order_id: `ord-${Date.now()}`,
      orderCode: `FO-AUTO-${String(dispatches.length + 1).padStart(3, "0")}`,
      from_facility: "Kho Tổng Bình Tân",
      to_facility: targetFac?.name || "Chi nhánh",
      driver_name: dspDriver,
      license_plate: dspPlate.toUpperCase(),
      seal_code: dspSeal ? dspSeal.toUpperCase() : `SEAL-DICA-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "POSTED",
      dispatched_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      total_items: 4,
    };

    const updated = [newDsp, ...dispatches];
    setDispatches(updated);
    dicaStore.saveDispatches(updated);

    toast.success(`Đã tạo phiếu xuất kho ${newDsp.code} thành công!`);
    setOpenDispatchDialog(false);
    setDspDriver("");
    setDspPlate("");
    setDspSeal("");
  };

  const handleOpenResolve = (disc: Discrepancy) => {
    setSelectedDisc(disc);
    setResolveNote("");
    setOpenResolveDialog(true);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisc || !resolveNote) {
      toast.error("Vui lòng nhập phương án xử lý sai lệch!");
      return;
    }

    const updated = discrepancies.map((d) => {
      if (d.id === selectedDisc.id) {
        return {
          ...d,
          status: "RESOLVED" as const,
          resolution_note: resolveNote,
        };
      }
      return d;
    });

    setDiscrepancies(updated);
    dicaStore.saveDiscrepancies(updated);

    toast.success(`Đã xử lý xong sai lệch cho phiếu ${selectedDisc.receipt_code}`);
    setOpenResolveDialog(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Giao Nhận & Kiểm Soát Sai Lệch (Logistics)
            </h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi lộ trình xe tải, mã niêm chì (Seal), biên bản nhận hàng và xử lý hao hụt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openDispatchDialog} onOpenChange={setOpenDispatchDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Tạo phiếu xuất kho xe tải</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Phiếu Xuất Giao Vận (Dispatch)
                  </DialogTitle>
                  <DialogDescription>
                    Khởi tạo chuyến xe vận chuyển hàng hóa từ Kho Tổng tới các chi nhánh.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDispatch} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Cơ sở nhận hàng</Label>
                    <Select value={dspToFac} onValueChange={setDspToFac}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chi nhánh..." />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities
                          .filter((f) => f.type === "BRANCH" || f.type === "CENTRAL_KITCHEN")
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="driver">Tên tài xế phụ trách</Label>
                      <Input
                        id="driver"
                        placeholder="VD: Nguyễn Văn Bình"
                        value={dspDriver}
                        onChange={(e) => setDspDriver(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plate">Biển số xe tải</Label>
                      <Input
                        id="plate"
                        placeholder="VD: 51D-921.45"
                        value={dspPlate}
                        onChange={(e) => setDspPlate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seal">Mã niêm chì thùng lạnh (Seal Code)</Label>
                    <Input
                      id="seal"
                      placeholder="VD: SEAL-DICA-8841 (Để trống sẽ sinh tự động)"
                      value={dspSeal}
                      onChange={(e) => setDspSeal(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit">Phát hành phiếu xuất kho</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs: Dispatches, Receipts, Discrepancies */}
        <Tabs defaultValue="dispatches" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="dispatches" className="gap-2 text-xs">
              <Truck className="size-4" />
              <span>Phiếu Xuất Kho ({dispatches.length})</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-2 text-xs">
              <PackageCheck className="size-4" />
              <span>Phiếu Nhập Hàng ({receipts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="gap-2 text-xs">
              <AlertTriangle className="size-4 text-amber-500" />
              <span>Xử Lý Sai Lệch ({discrepancies.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DISPATCHES */}
          <TabsContent value="dispatches" className="space-y-4">
            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Mã Xuất Kho</TableHead>
                    <TableHead>Mã Đơn Lệnh</TableHead>
                    <TableHead>Từ Cơ Sở</TableHead>
                    <TableHead>Đến Cơ Sở</TableHead>
                    <TableHead>Tài Xế / Biển Số</TableHead>
                    <TableHead>Mã Seal Niêm Chì</TableHead>
                    <TableHead>Thời Gian Xuất</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dsp) => (
                    <TableRow key={dsp.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {dsp.code}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {dsp.orderCode}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dsp.from_facility}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {dsp.to_facility}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {dsp.driver_name} • <span className="font-mono">{dsp.license_plate}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary font-bold">
                        {dsp.seal_code}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {dsp.dispatched_at}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            dsp.status === "POSTED"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {dsp.status === "POSTED" ? "Đã Đăng Sổ" : "Bản Nháp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {dsp.status === "DRAFT" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handlePostDispatch(dsp.id)}
                          >
                            Đăng sổ xuất
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: RECEIPTS */}
          <TabsContent value="receipts" className="space-y-4">
            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Mã Nhập Kho</TableHead>
                    <TableHead>Mã Phiếu Xuất Kèm</TableHead>
                    <TableHead>Cơ Sở Nhận Hàng</TableHead>
                    <TableHead>Người Tiếp Nhận</TableHead>
                    <TableHead>Thời Gian Giao Nhận</TableHead>
                    <TableHead className="text-center">Sai Lệch</TableHead>
                    <TableHead className="text-right">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((rcp) => (
                    <TableRow key={rcp.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {rcp.code}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {rcp.dispatch_code || "--"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {rcp.received_facility}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rcp.received_by}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {rcp.received_at}
                      </TableCell>
                      <TableCell className="text-center">
                        {rcp.discrepancy_count > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {rcp.discrepancy_count} sai lệch
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600">
                            Khớp 100%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            rcp.status === "POSTED"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {rcp.status === "POSTED" ? "Hoàn Tất" : "Chờ Duyệt Thừa/Thiếu"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: DISCREPANCIES */}
          <TabsContent value="discrepancies" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Ghi nhận các trường hợp giao thiếu hàng (Shortage), thừa hàng (Excess) hoặc hỏng hóc (Damaged).
              </p>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Phiếu Nhập Gốc</TableHead>
                    <TableHead>Nguyên Vật Liệu</TableHead>
                    <TableHead>Phân Loại Sai Lệch</TableHead>
                    <TableHead className="text-right">Số Lượng Gốc</TableHead>
                    <TableHead className="text-right">Thực Tế Nhận</TableHead>
                    <TableHead className="text-right">Chênh Lệch</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Phương Án Xử Lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancies.map((disc) => (
                    <TableRow key={disc.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {disc.receipt_code}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {disc.ingredient_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            disc.type === "SHORTAGE"
                              ? "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5"
                              : disc.type === "EXCESS"
                              ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                              : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                          )}
                        >
                          {disc.type === "SHORTAGE"
                            ? "Thiếu Hàng"
                            : disc.type === "EXCESS"
                            ? "Thừa Hàng"
                            : "Hư Hỏng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {disc.expected_quantity} {disc.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {disc.actual_quantity} {disc.unit}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs font-bold",
                          disc.difference < 0 ? "text-red-600 dark:text-red-400" : "text-blue-600"
                        )}
                      >
                        {disc.difference > 0 ? `+${disc.difference}` : disc.difference} {disc.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={disc.status === "RESOLVED" ? "default" : "secondary"}
                          className={
                            disc.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px]"
                              : "bg-red-500/15 text-red-700 dark:text-red-400 text-[10px]"
                          }
                        >
                          {disc.status === "RESOLVED" ? "Đã Xử Lý" : "Chưa Giải Quyết"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {disc.status === "OPEN" ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => handleOpenResolve(disc)}
                          >
                            Xử lý biên bản
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px] ml-auto">
                            {disc.resolution_note || "Đã giải quyết"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resolve Discrepancy Dialog */}
        <Dialog open={openResolveDialog} onOpenChange={setOpenResolveDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg">
                Giải Quyết Sai Lệch Giao Nhận
              </DialogTitle>
              <DialogDescription>
                Quyết định phương án xử lý hao hụt / sai lệch cho mặt hàng{" "}
                <span className="font-bold text-foreground">
                  {selectedDisc?.ingredient_name}
                </span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmResolve} className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <p>
                  Phiếu nhận: <span className="font-mono font-bold">{selectedDisc?.receipt_code}</span>
                </p>
                <p>
                  Chênh lệch:{" "}
                  <span className="font-mono font-bold text-red-600">
                    {selectedDisc?.difference} {selectedDisc?.unit}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resNote">Phương án giải quyết (Biên bản đối chiếu)</Label>
                <Input
                  id="resNote"
                  placeholder="VD: Nhà xe chịu 50% tiền hàng, kho tổng ghi nhận hao hụt tự nhiên"
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenResolveDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Xác nhận giải quyết</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
