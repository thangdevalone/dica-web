"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Warehouse,
  Plus,
  Search,
  BookOpen,
  ArrowRightLeft,
  ClipboardCheck,
  AlertTriangle,
  BadgeAlert,
  Calendar,
  Layers,
  CheckCircle2,
  DollarSign,
  Filter,
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
  type StockBalance,
  type StockLedgerEntry,
  type Transfer,
  type Stocktake,
  type Adjustment,
  type DamageReport,
  type Facility,
  type Ingredient,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const [balances, setBalances] = React.useState<StockBalance[]>([]);
  const [ledger, setLedger] = React.useState<StockLedgerEntry[]>([]);
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [stocktakes, setStocktakes] = React.useState<Stocktake[]>([]);
  const [adjustments, setAdjustments] = React.useState<Adjustment[]>([]);
  const [damages, setDamages] = React.useState<DamageReport[]>([]);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);

  // Search & Facility Filter for Stock Balances
  const [searchSKU, setSearchSKU] = React.useState("");
  const [selectedFacilityFilter, setSelectedFacilityFilter] = React.useState("ALL");

  // Create Transfer Modal State
  const [openTransferDialog, setOpenTransferDialog] = React.useState(false);
  const [trfFromFac, setTrfFromFac] = React.useState("");
  const [trfToFac, setTrfToFac] = React.useState("");
  const [trfNotes, setTrfNotes] = React.useState("");

  // Create Damage Report State
  const [openDamageDialog, setOpenDamageDialog] = React.useState(false);
  const [dmgFac, setDmgFac] = React.useState("");
  const [dmgReason, setDmgReason] = React.useState("");
  const [dmgValue, setDmgValue] = React.useState("");

  const loadData = () => {
    setBalances(dicaStore.getStockBalances());
    setLedger(dicaStore.getLedger());
    setTransfers(dicaStore.getTransfers());
    setStocktakes(dicaStore.getStocktakes());
    setAdjustments(dicaStore.getAdjustments());
    setDamages(dicaStore.getDamages());
    setFacilities(dicaStore.getFacilities());
    setIngredients(dicaStore.getIngredients());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredBalances = balances.filter((b) => {
    const matchSearch =
      b.ingredient_name.toLowerCase().includes(searchSKU.toLowerCase()) ||
      b.ingredient_code.toLowerCase().includes(searchSKU.toLowerCase()) ||
      b.batch_number.toLowerCase().includes(searchSKU.toLowerCase());
    const matchFac = selectedFacilityFilter === "ALL" || b.facility_id === selectedFacilityFilter;
    return matchSearch && matchFac;
  });

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfFromFac || !trfToFac || trfFromFac === trfToFac) {
      toast.error("Vui lòng chọn 2 cơ sở điều chuyển khác nhau!");
      return;
    }

    const fromF = facilities.find((f) => f.id === trfFromFac);
    const toF = facilities.find((f) => f.id === trfToFac);

    const newTrf: Transfer = {
      id: `trf-${Date.now()}`,
      code: `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(transfers.length + 1).padStart(3, "0")}`,
      from_facility_name: fromF?.name || "Cơ sở chuyển",
      to_facility_name: toF?.name || "Cơ sở nhận",
      status: "APPROVED",
      created_at: new Date().toISOString(),
      creator: "Nguyễn Thế Thắng (Admin)",
      items_count: 2,
      notes: trfNotes || "Điều chuyển nội bộ cân bằng tồn kho",
    };

    const updated = [newTrf, ...transfers];
    setTransfers(updated);
    dicaStore.saveTransfers(updated);

    toast.success(`Đã khởi tạo lệnh điều chuyển ${newTrf.code}`);
    setOpenTransferDialog(false);
    setTrfNotes("");
  };

  const handleCreateDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmgFac || !dmgReason || !dmgValue) {
      toast.error("Vui lòng điền đủ thông tin biên bản hủy!");
      return;
    }

    const targetFac = facilities.find((f) => f.id === dmgFac);

    const newDmg: DamageReport = {
      id: `dmg-${Date.now()}`,
      code: `DMG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(damages.length + 1).padStart(2, "0")}`,
      facility_name: targetFac?.name || "Cơ sở",
      status: "CONFIRMED",
      reason: dmgReason,
      total_loss_value: parseFloat(dmgValue) || 0,
      created_at: new Date().toISOString(),
    };

    const updated = [newDmg, ...damages];
    setDamages(updated);
    dicaStore.saveDamages(updated);

    toast.success(`Đã lập biên bản hủy hàng ${newDmg.code}`);
    setOpenDamageDialog(false);
    setDmgReason("");
    setDmgValue("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Quản Trị Kho Bãi & Sổ Cái Tồn Kho
            </h1>
            <p className="text-sm text-muted-foreground">
              Tra cứu tồn kho tức thời, thẻ kho điện tử, điều chuyển nội bộ và kiểm kê định kỳ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openTransferDialog} onOpenChange={setOpenTransferDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <ArrowRightLeft className="size-4" />
                  <span>Lập lệnh điều chuyển</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Lệnh Điều Chuyển Kho (Transfer)
                  </DialogTitle>
                  <DialogDescription>
                    Điều chuyển nguyên liệu giữa Bếp Trung Tâm và các nhà hàng chi nhánh.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTransfer} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Từ cơ sở (Xuất)</Label>
                    <Select value={trfFromFac} onValueChange={setTrfFromFac}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kho xuất..." />
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

                  <div className="space-y-2">
                    <Label>Đến cơ sở (Nhập)</Label>
                    <Select value={trfToFac} onValueChange={setTrfToFac}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kho nhận..." />
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

                  <div className="space-y-2">
                    <Label htmlFor="tNotes">Mục đích điều chuyển</Label>
                    <Input
                      id="tNotes"
                      placeholder="VD: Cân bằng lượng tồn thịt bò phục vụ lễ"
                      value={trfNotes}
                      onChange={(e) => setTrfNotes(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit">Phê duyệt lệnh điều chuyển</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openDamageDialog} onOpenChange={setOpenDamageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 gap-1.5 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10">
                  <AlertTriangle className="size-4 text-red-500" />
                  <span>Lập biên bản hủy</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Biên Bản Hủy Hàng / Hỏng Hóc (Damage)
                  </DialogTitle>
                  <DialogDescription>
                    Ghi nhận hàng hóa dập úng, hết hạn hoặc hỏng thiết bị bảo quản.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDamage} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Cơ sở xảy ra sự cố</Label>
                    <Select value={dmgFac} onValueChange={setDmgFac}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cơ sở..." />
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

                  <div className="space-y-2">
                    <Label htmlFor="dReason">Nguyên nhân chi tiết</Label>
                    <Input
                      id="dReason"
                      placeholder="VD: Tủ lạnh hỏng block làm tăng nhiệt độ rau củ"
                      value={dmgReason}
                      onChange={(e) => setDmgReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dVal">Tổng tổn thất ước tính (VNĐ)</Label>
                    <Input
                      id="dVal"
                      type="number"
                      placeholder="VD: 1500000"
                      value={dmgValue}
                      onChange={(e) => setDmgValue(e.target.value)}
                      required
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" variant="destructive">
                      Xác nhận lập biên bản
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <Tabs defaultValue="balances" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="balances" className="gap-2 text-xs">
              <Warehouse className="size-4" />
              <span>Tồn Kho Tức Thời ({balances.length})</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="gap-2 text-xs">
              <BookOpen className="size-4" />
              <span>Thẻ Kho Điện Tử (Ledger)</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2 text-xs">
              <ArrowRightLeft className="size-4" />
              <span>Lệnh Điều Chuyển ({transfers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2 text-xs">
              <ClipboardCheck className="size-4" />
              <span>Kiểm Kê & Hỏng Hủy</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STOCK ON HAND */}
          <TabsContent value="balances" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên nguyên liệu, mã SKU hoặc số lô..."
                  className="pl-9 h-9 text-xs"
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedFacilityFilter}
                  onValueChange={setSelectedFacilityFilter}
                >
                  <SelectTrigger className="h-9 w-60 text-xs">
                    <SelectValue placeholder="Lọc theo cơ sở" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả điểm kho</SelectItem>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Mã SKU</TableHead>
                    <TableHead>Tên Nguyên Vật Liệu</TableHead>
                    <TableHead>Cơ Sở & Vị Trí Kho</TableHead>
                    <TableHead className="text-right">Tồn Thực Tế</TableHead>
                    <TableHead className="text-right">Đã Giữ Chỗ</TableHead>
                    <TableHead className="text-right">Khả Dụng</TableHead>
                    <TableHead className="text-right">Định Giá Tồn</TableHead>
                    <TableHead className="text-center">Số Lô & HSD</TableHead>
                    <TableHead className="text-right">Cảnh Báo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((sb) => (
                    <TableRow key={sb.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {sb.ingredient_code}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {sb.ingredient_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{sb.facility_name}</div>
                        <div className="text-[10px] text-muted-foreground/80">{sb.location_name}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {sb.quantity_on_hand} {sb.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {sb.allocated_quantity} {sb.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-primary">
                        {sb.available_quantity} {sb.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {sb.total_value.toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        <div className="text-[11px] font-semibold text-foreground">{sb.batch_number}</div>
                        <div className="text-[10px]">{sb.expiry_date}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {sb.is_low_stock ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Dưới Min
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                          >
                            An toàn
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: STOCK LEDGER */}
          <TabsContent value="ledger" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Thẻ kho ghi nhận bất biến mọi giao dịch phát sinh (Dispatch out, Receipt in, Adjustment, Reversal).
              </p>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Thời Gian</TableHead>
                    <TableHead>Loại Nghiệp Vụ</TableHead>
                    <TableHead>Nguyên Vật Liệu</TableHead>
                    <TableHead>Điểm Kho</TableHead>
                    <TableHead className="text-right">Biến Động</TableHead>
                    <TableHead className="text-right">Tồn Sau Giao Dịch</TableHead>
                    <TableHead>Số Chứng Từ</TableHead>
                    <TableHead className="text-right">Người Thực Hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((ent) => (
                    <TableRow key={ent.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ent.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px]",
                            ent.entry_type === "SUPPLIER_RECEIPT_IN"
                              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                              : ent.entry_type === "DISPATCH_OUT"
                              ? "border-amber-500/40 text-amber-600 bg-amber-500/5"
                              : "border-blue-500/40 text-blue-600 bg-blue-500/5"
                          )}
                        >
                          {ent.entry_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {ent.ingredient_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ent.facility_name}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs font-bold",
                          ent.quantity_change > 0 ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        {ent.quantity_change > 0 ? `+${ent.quantity_change}` : ent.quantity_change}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {ent.resulting_quantity}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary font-semibold">
                        {ent.reference_doc}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {ent.performed_by}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: TRANSFERS */}
          <TabsContent value="transfers" className="space-y-4">
            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Mã Điều Chuyển</TableHead>
                    <TableHead>Kho Xuất Hàng</TableHead>
                    <TableHead>Kho Nhận Hàng</TableHead>
                    <TableHead>Số Mặt Hàng</TableHead>
                    <TableHead>Người Lập Phiếu</TableHead>
                    <TableHead>Ghi Chú</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((trf) => (
                    <TableRow key={trf.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {trf.code}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {trf.from_facility_name}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium">
                        {trf.to_facility_name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {trf.items_count} mặt hàng
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {trf.creator}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {trf.notes || "--"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px]"
                        >
                          Đã Duyệt
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 4: STOCKTAKES & DAMAGES */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Stocktakes */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Đợt Kiểm Kê Định Kỳ ({stocktakes.length})
                </h3>
                <Card className="border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã Đợt</TableHead>
                        <TableHead>Cơ Sở Kiểm Kê</TableHead>
                        <TableHead className="text-center">Mặt Hàng</TableHead>
                        <TableHead className="text-center">Sai Lệch</TableHead>
                        <TableHead className="text-right">Trạng Thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocktakes.map((stk) => (
                        <TableRow key={stk.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            {stk.code}
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {stk.facility_name}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {stk.total_items}
                          </TableCell>
                          <TableCell className="text-center">
                            {stk.variance_count > 0 ? (
                              <Badge variant="destructive" className="text-[10px]">
                                {stk.variance_count} lệch
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-emerald-600">
                                Chuẩn
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-[10px]">
                              {stk.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>

              {/* Damages */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Biên Bản Hủy Hàng / Hỏng Hóc ({damages.length})
                </h3>
                <Card className="border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã Biên Bản</TableHead>
                        <TableHead>Cơ Sở</TableHead>
                        <TableHead>Nguyên Nhân</TableHead>
                        <TableHead className="text-right">Tổn Thất</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {damages.map((dmg) => (
                        <TableRow key={dmg.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            {dmg.code}
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {dmg.facility_name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground line-clamp-1">
                            {dmg.reason}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-red-600 dark:text-red-400">
                            {dmg.total_loss_value.toLocaleString("vi-VN")} ₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
