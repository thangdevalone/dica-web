"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Boxes,
  Plus,
  Search,
  Scale,
  FolderTree,
  Building,
  ArrowRightLeft,
  DollarSign,
  Calculator,
  Barcode,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  type Ingredient,
  type IngredientGroup,
  type Unit,
  type UnitConversion,
  type Supplier,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [groups, setGroups] = React.useState<IngredientGroup[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [conversions, setConversions] = React.useState<UnitConversion[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Search & Filter state
  const [searchSKU, setSearchSKU] = React.useState("");
  const [filterGroup, setFilterGroup] = React.useState("ALL");

  // New Ingredient Modal
  const [openIngDialog, setOpenIngDialog] = React.useState(false);
  const [ingCode, setIngCode] = React.useState("");
  const [ingName, setIngName] = React.useState("");
  const [ingGroupId, setIngGroupId] = React.useState("");
  const [ingUnitId, setIngUnitId] = React.useState("");
  const [ingCost, setIngCost] = React.useState("");
  const [ingMinStock, setIngMinStock] = React.useState("");
  const [ingMaxStock, setIngMaxStock] = React.useState("");
  const [ingShelfLife, setIngShelfLife] = React.useState("");
  const [ingBarcode, setIngBarcode] = React.useState("");

  // New Unit Modal
  const [openUnitDialog, setOpenUnitDialog] = React.useState(false);
  const [unitCode, setUnitCode] = React.useState("");
  const [unitName, setUnitName] = React.useState("");
  const [unitSymbol, setUnitSymbol] = React.useState("");

  // New Conversion Modal
  const [openConvDialog, setOpenConvDialog] = React.useState(false);
  const [convFromId, setConvFromId] = React.useState("");
  const [convToId, setConvToId] = React.useState("");
  const [convFactor, setConvFactor] = React.useState("");

  // New Supplier Modal
  const [openSupDialog, setOpenSupDialog] = React.useState(false);
  const [supCode, setSupCode] = React.useState("");
  const [supName, setSupName] = React.useState("");
  const [supContact, setSupContact] = React.useState("");
  const [supPhone, setSupPhone] = React.useState("");
  const [supEmail, setSupEmail] = React.useState("");
  const [supLeadTime, setSupLeadTime] = React.useState("2");
  const [supTaxCode, setSupTaxCode] = React.useState("");

  // Interactive Conversion Calculator Widget state
  const [calcAmount, setCalcAmount] = React.useState<string>("10");
  const [calcFromUnit, setCalcFromUnit] = React.useState<string>("u-3"); // Thùng
  const [calcToUnit, setCalcToUnit] = React.useState<string>("u-4"); // Lon
  const [calcResult, setCalcResult] = React.useState<string>("");

  const loadData = () => {
    setIngredients(dicaStore.getIngredients());
    setGroups(dicaStore.getGroups());
    setUnits(dicaStore.getUnits());
    setConversions(dicaStore.getConversions());
    setSuppliers(dicaStore.getSuppliers());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Update conversion calculator result
  React.useEffect(() => {
    const val = parseFloat(calcAmount);
    if (isNaN(val) || !calcFromUnit || !calcToUnit) {
      setCalcResult("--");
      return;
    }

    if (calcFromUnit === calcToUnit) {
      setCalcResult(`${val}`);
      return;
    }

    // Direct match
    const direct = conversions.find(
      (c) => c.from_unit_id === calcFromUnit && c.to_unit_id === calcToUnit
    );
    if (direct) {
      setCalcResult(`${val * direct.factor}`);
      return;
    }

    // Reverse match
    const reverse = conversions.find(
      (c) => c.from_unit_id === calcToUnit && c.to_unit_id === calcFromUnit
    );
    if (reverse) {
      setCalcResult(`${(val / reverse.factor).toFixed(4)}`);
      return;
    }

    setCalcResult("Chưa có quy tắc chuyển đổi trực tiếp");
  }, [calcAmount, calcFromUnit, calcToUnit, conversions]);

  const filteredIngredients = ingredients.filter((ing) => {
    const matchSearch =
      ing.name.toLowerCase().includes(searchSKU.toLowerCase()) ||
      ing.code.toLowerCase().includes(searchSKU.toLowerCase()) ||
      (ing.barcode && ing.barcode.includes(searchSKU));
    const matchGroup = filterGroup === "ALL" || ing.group_id === filterGroup;
    return matchSearch && matchGroup;
  });

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingCode || !ingName || !ingGroupId || !ingUnitId) {
      toast.error("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }

    const selectedGroup = groups.find((g) => g.id === ingGroupId);
    const selectedUnit = units.find((u) => u.id === ingUnitId);

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      code: ingCode.trim().toUpperCase(),
      name: ingName.trim(),
      group_id: ingGroupId,
      groupName: selectedGroup?.name,
      base_unit_id: ingUnitId,
      baseUnitSymbol: selectedUnit?.symbol,
      cost_price: parseFloat(ingCost) || 0,
      min_stock: parseFloat(ingMinStock) || 10,
      max_stock: parseFloat(ingMaxStock) || 100,
      shelf_life_days: parseInt(ingShelfLife, 10) || 30,
      barcode: ingBarcode.trim() || undefined,
      active: true,
    };

    const updated = [newIng, ...ingredients];
    setIngredients(updated);
    dicaStore.saveIngredients(updated);

    toast.success(`Đã thêm nguyên vật liệu ${newIng.name} (${newIng.code})`);
    setOpenIngDialog(false);
    setIngCode("");
    setIngName("");
    setIngCost("");
    setIngMinStock("");
    setIngMaxStock("");
    setIngShelfLife("");
    setIngBarcode("");
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode || !unitName || !unitSymbol) {
      toast.error("Vui lòng điền đủ mã, tên và ký hiệu đơn vị!");
      return;
    }

    const newUnit: Unit = {
      id: `u-${Date.now()}`,
      code: unitCode.trim().toUpperCase(),
      name: unitName.trim(),
      symbol: unitSymbol.trim().toLowerCase(),
    };

    const updated = [...units, newUnit];
    setUnits(updated);
    dicaStore.saveUnits(updated);

    toast.success(`Đã thêm đơn vị tính ${newUnit.name} (${newUnit.symbol})`);
    setOpenUnitDialog(false);
    setUnitCode("");
    setUnitName("");
    setUnitSymbol("");
  };

  const handleCreateConversion = (e: React.FormEvent) => {
    e.preventDefault();
    const factorNum = parseFloat(convFactor);
    if (!convFromId || !convToId || isNaN(factorNum) || factorNum <= 0) {
      toast.error("Vui lòng chọn 2 đơn vị và hệ số quy đổi dương!");
      return;
    }

    const fromU = units.find((u) => u.id === convFromId);
    const toU = units.find((u) => u.id === convToId);

    const newConv: UnitConversion = {
      id: `conv-${Date.now()}`,
      from_unit_id: convFromId,
      fromUnitName: `${fromU?.name} (${fromU?.symbol})`,
      to_unit_id: convToId,
      toUnitName: `${toU?.name} (${toU?.symbol})`,
      factor: factorNum,
    };

    const updated = [newConv, ...conversions];
    setConversions(updated);
    dicaStore.saveConversions(updated);

    toast.success(`Đã tạo quy tắc: 1 ${fromU?.symbol} = ${factorNum} ${toU?.symbol}`);
    setOpenConvDialog(false);
    setConvFactor("");
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCode || !supName) {
      toast.error("Vui lòng điền mã và tên nhà cung cấp!");
      return;
    }

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      code: supCode.trim().toUpperCase(),
      name: supName.trim(),
      contact_person: supContact.trim() || "Chưa có",
      phone: supPhone.trim() || "Chưa có",
      email: supEmail.trim() || "Chưa có",
      address: "Việt Nam",
      lead_time_days: parseInt(supLeadTime, 10) || 2,
      tax_code: supTaxCode.trim() || "0000000000",
      rating: 5.0,
      active: true,
    };

    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    dicaStore.saveSuppliers(updated);

    toast.success(`Đã thêm nhà cung cấp ${newSup.name}`);
    setOpenSupDialog(false);
    setSupCode("");
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupTaxCode("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Quản Trị Danh Mục & Nguồn Cung
            </h1>
            <p className="text-sm text-muted-foreground">
              Master Data nguyên vật liệu SKU, hệ số quy đổi đơn vị, nhóm hàng và đối tác cung ứng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openIngDialog} onOpenChange={setOpenIngDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Thêm nguyên vật liệu (SKU)</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Mới Nguyên Vật Liệu (SKU)
                  </DialogTitle>
                  <DialogDescription>
                    Khai báo mã hàng chuẩn cho toàn bộ chuỗi nhà hàng và bếp trung tâm.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateIngredient} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="skuCode">Mã SKU</Label>
                      <Input
                        id="skuCode"
                        placeholder="VD: SKU-BEEF-003"
                        value={ingCode}
                        onChange={(e) => setIngCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skuGroup">Nhóm nguyên liệu</Label>
                      <Select value={ingGroupId} onValueChange={setIngGroupId}>
                        <SelectTrigger id="skuGroup">
                          <SelectValue placeholder="Chọn nhóm..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skuName">Tên nguyên vật liệu</Label>
                    <Input
                      id="skuName"
                      placeholder="VD: Thăn Bò Úc Cắt Steak 200g"
                      value={ingName}
                      onChange={(e) => setIngName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="baseUnit">Đơn vị đo chuẩn (Base Unit)</Label>
                      <Select value={ingUnitId} onValueChange={setIngUnitId}>
                        <SelectTrigger id="baseUnit">
                          <SelectValue placeholder="Chọn đơn vị..." />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Giá vốn dự kiến (VNĐ)</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        placeholder="VD: 320000"
                        value={ingCost}
                        onChange={(e) => setIngCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Tồn an toàn (Min)</Label>
                      <Input
                        id="minStock"
                        type="number"
                        placeholder="VD: 20"
                        value={ingMinStock}
                        onChange={(e) => setIngMinStock(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Tồn tối đa (Max)</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        placeholder="VD: 200"
                        value={ingMaxStock}
                        onChange={(e) => setIngMaxStock(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shelfLife">HSD (Ngày)</Label>
                      <Input
                        id="shelfLife"
                        type="number"
                        placeholder="VD: 45"
                        value={ingShelfLife}
                        onChange={(e) => setIngShelfLife(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Mã vạch Barcode (Tùy chọn)</Label>
                    <Input
                      id="barcode"
                      placeholder="VD: 8938001099"
                      value={ingBarcode}
                      onChange={(e) => setIngBarcode(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenIngDialog(false)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit">Lưu SKU</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabbed view */}
        <Tabs defaultValue="ingredients" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="ingredients" className="gap-2 text-xs">
              <Boxes className="size-4" />
              <span>Nguyên vật liệu ({ingredients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="conversions" className="gap-2 text-xs">
              <Scale className="size-4" />
              <span>Đơn vị & Quy đổi tỷ lệ</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2 text-xs">
              <FolderTree className="size-4" />
              <span>Nhóm nguyên liệu ({groups.length})</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2 text-xs">
              <Building className="size-4" />
              <span>Nhà cung cấp ({suppliers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INGREDIENTS LIST */}
          <TabsContent value="ingredients" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm SKU theo tên, mã hoặc barcode..."
                  className="pl-9 h-9 text-xs"
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="h-9 w-52 text-xs">
                    <SelectValue placeholder="Tất cả nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả nhóm</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
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
                    <TableHead>Nhóm Hàng</TableHead>
                    <TableHead>Đơn Vị Chuẩn</TableHead>
                    <TableHead className="text-right">Giá Vốn Dự Kiến</TableHead>
                    <TableHead className="text-center">Định Mức (Min - Max)</TableHead>
                    <TableHead className="text-center">HSD (Ngày)</TableHead>
                    <TableHead className="text-right">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {ing.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs text-foreground">{ing.name}</div>
                        {ing.barcode && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                            <Barcode className="size-3" />
                            <span>{ing.barcode}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ing.groupName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {ing.baseUnitSymbol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {ing.cost_price.toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{ing.min_stock}</span>
                        {" - "}
                        <span>{ing.max_stock}</span> {ing.baseUnitSymbol}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        {ing.shelf_life_days} ngày
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                        >
                          Đang dùng
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: UNITS & CONVERSIONS + INTERACTIVE CALCULATOR */}
          <TabsContent value="conversions" className="space-y-6">
            {/* Interactive Calculator Widget */}
            <Card className="border-border/80 bg-gradient-to-r from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="size-5 text-primary" />
                  <CardTitle className="font-heading text-base font-bold">
                    Công Cụ Tính Toán Quy Đổi Đơn Vị Tức Thời
                  </CardTitle>
                </div>
                <CardDescription>
                  Kiểm tra hệ số quy đổi giữa đơn vị nhập mua (Thùng, Hộp, Khay) và đơn vị sử dụng (Kg, Gam, Lon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Số lượng gốc</Label>
                    <Input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Từ đơn vị</Label>
                    <Select value={calcFromUnit} onValueChange={setCalcFromUnit}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center pt-5">
                    <ArrowRightLeft className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Sang đơn vị đích</Label>
                    <Select value={calcToUnit} onValueChange={setCalcToUnit}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Kết quả tương đương</Label>
                    <div className="flex h-9 items-center rounded-md border border-primary/30 bg-primary/10 px-3 font-mono text-sm font-bold text-primary">
                      {calcResult} {units.find((u) => u.id === calcToUnit)?.symbol}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Split layout: Units table and Conversions table */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Units */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Danh Sách Đơn Vị Đo Lường ({units.length})
                  </h3>
                  <Dialog open={openUnitDialog} onOpenChange={setOpenUnitDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <Plus className="size-3.5" />
                        <span>Thêm đơn vị</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-lg">
                          Thêm Đơn Vị Đo Lường
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateUnit} className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="uCode">Mã đơn vị (Code)</Label>
                          <Input
                            id="uCode"
                            placeholder="VD: LITER"
                            value={unitCode}
                            onChange={(e) => setUnitCode(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="uName">Tên đơn vị</Label>
                          <Input
                            id="uName"
                            placeholder="VD: Lít"
                            value={unitName}
                            onChange={(e) => setUnitName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="uSymbol">Ký hiệu hiển thị</Label>
                          <Input
                            id="uSymbol"
                            placeholder="VD: l"
                            value={unitSymbol}
                            onChange={(e) => setUnitSymbol(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button type="submit">Lưu đơn vị</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên Đơn Vị</TableHead>
                        <TableHead>Ký Hiệu</TableHead>
                        <TableHead>Mô Tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-xs font-semibold">{u.code}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{u.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {u.symbol}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.description || "--"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>

              {/* Right: Conversions rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Ma Trận Quy Đổi Tỷ Lệ ({conversions.length})
                  </h3>
                  <Dialog open={openConvDialog} onOpenChange={setOpenConvDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <Plus className="size-3.5" />
                        <span>Tạo quy tắc mới</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-lg">
                          Tạo Quy Tắc Quy Đổi Đơn Vị
                        </DialogTitle>
                        <DialogDescription>
                          Định nghĩa hệ số nhân: 1 [Đơn vị nguồn] = X [Đơn vị đích].
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateConversion} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Từ đơn vị nguồn</Label>
                            <Select value={convFromId} onValueChange={setConvFromId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn..." />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name} ({u.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Sang đơn vị đích</Label>
                            <Select value={convToId} onValueChange={setConvToId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn..." />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name} ({u.symbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="factor">Hệ số quy đổi (Factor)</Label>
                          <Input
                            id="factor"
                            type="number"
                            step="any"
                            placeholder="VD: 24 (nghĩa là 1 Thùng = 24 Lon)"
                            value={convFactor}
                            onChange={(e) => setConvFactor(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button type="submit">Lưu quy tắc</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đơn Vị Gốc</TableHead>
                        <TableHead className="text-center">Tỷ Lệ</TableHead>
                        <TableHead>Đơn Vị Đích</TableHead>
                        <TableHead className="text-right">Biểu Thức Quy Đổi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversions.map((conv) => (
                        <TableRow key={conv.id}>
                          <TableCell className="font-semibold text-xs text-foreground">
                            {conv.fromUnitName}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-primary font-bold">
                            = {conv.factor} ×
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {conv.toUnitName}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            1 {conv.fromUnitName.split(" ")[0]} = {conv.factor} {conv.toUnitName.split(" ")[0]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: GROUPS */}
          <TabsContent value="groups" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((grp) => {
                const count = ingredients.filter((i) => i.group_id === grp.id).length;
                return (
                  <Card key={grp.id} className="border-border/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {grp.code}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {count} mặt hàng
                        </span>
                      </div>
                      <CardTitle className="font-heading text-base font-bold pt-1">
                        {grp.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      {grp.description || "Danh mục nguyên liệu chuyên dụng cho chuỗi F&B."}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 4: SUPPLIERS */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Danh bạ các nhà cung cấp thịt, hải sản, nông sản Đà Lạt và đồ uống đã ký hợp đồng SCM.
              </p>
              <Dialog open={openSupDialog} onOpenChange={setOpenSupDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="size-3.5" />
                    <span>Thêm nhà cung cấp</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-lg">
                      Thêm Mới Nhà Cung Cấp
                    </DialogTitle>
                    <DialogDescription>
                      Thiết lập hồ sơ nhà cung cấp và thời gian giao hàng (Lead Time).
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSupplier} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="supCode">Mã NCC</Label>
                        <Input
                          id="supCode"
                          placeholder="VD: NCC-VISSAN"
                          value={supCode}
                          onChange={(e) => setSupCode(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supLead">Lead Time (Ngày)</Label>
                        <Input
                          id="supLead"
                          type="number"
                          value={supLeadTime}
                          onChange={(e) => setSupLeadTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supName">Tên công ty / HTX</Label>
                      <Input
                        id="supName"
                        placeholder="VD: Công ty Cổ phần Thực phẩm Vissan"
                        value={supName}
                        onChange={(e) => setSupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="supCont">Người liên hệ</Label>
                        <Input
                          id="supCont"
                          placeholder="VD: Nguyễn Văn A"
                          value={supContact}
                          onChange={(e) => setSupContact(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supPhone">Số điện thoại</Label>
                        <Input
                          id="supPhone"
                          placeholder="VD: 0909 123 456"
                          value={supPhone}
                          onChange={(e) => setSupPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="supMail">Email nhận PO</Label>
                        <Input
                          id="supMail"
                          placeholder="VD: po@vissan.com.vn"
                          value={supEmail}
                          onChange={(e) => setSupEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supTax">Mã số thuế</Label>
                        <Input
                          id="supTax"
                          placeholder="VD: 0300123456"
                          value={supTaxCode}
                          onChange={(e) => setSupTaxCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="submit">Lưu nhà cung cấp</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((sup) => (
                <Card key={sup.id} className="border-border/80">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {sup.code}
                      </Badge>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="size-3 fill-amber-500 text-amber-500" />
                        <span>{sup.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="font-heading text-base font-bold pt-1">
                      {sup.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Đại diện: {sup.contact_person}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span>{sup.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span>{sup.email}</span>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span>Thời gian giao: {sup.lead_time_days} ngày</span>
                      <span className="font-mono text-[10px]">MST: {sup.tax_code}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
