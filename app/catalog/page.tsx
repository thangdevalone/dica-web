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
  Barcode,
  Clock,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  IngredientFormDialog,
  UnitFormDialog,
  UnitConversionDialog,
  SupplierFormDialog,
} from "@/components/forms";
import {
  useIngredientsQuery,
  useGroupsQuery,
  useUnitsQuery,
  useConversionsQuery,
  useSuppliersQuery,
} from "@/hooks";
import { formatCurrency } from "@/lib/formatters";

export default function CatalogPage() {
  // TanStack React Query Hooks
  const { data: ingredients = [], refetch: refetchIngredients } = useIngredientsQuery();
  const { data: groups = [], refetch: refetchGroups } = useGroupsQuery();
  const { data: units = [], refetch: refetchUnits } = useUnitsQuery();
  const { data: conversions = [], refetch: refetchConversions } = useConversionsQuery();
  const { data: suppliers = [], refetch: refetchSuppliers } = useSuppliersQuery();

  // Search & Filter state
  const [searchSKU, setSearchSKU] = React.useState("");
  const [filterGroup, setFilterGroup] = React.useState("ALL");

  // Modal Triggers
  const [openIngDialog, setOpenIngDialog] = React.useState(false);
  const [openUnitDialog, setOpenUnitDialog] = React.useState(false);
  const [openConvDialog, setOpenConvDialog] = React.useState(false);
  const [openSupDialog, setOpenSupDialog] = React.useState(false);

  const handleRefresh = () => {
    refetchIngredients();
    refetchGroups();
    refetchUnits();
    refetchConversions();
    refetchSuppliers();
  };

  // Filtered ingredients
  const filteredIngredients = React.useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch =
        ing.name.toLowerCase().includes(searchSKU.toLowerCase()) ||
        ing.code.toLowerCase().includes(searchSKU.toLowerCase()) ||
        (ing.barcode && ing.barcode.includes(searchSKU));
      const matchGroup = filterGroup === "ALL" || ing.group_id === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [ingredients, searchSKU, filterGroup]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Danh Mục SKU & Nhà Cung Cấp
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Quản lý định mức nguyên vật liệu, đơn vị đo lường, quy tắc chuyển đổi và bảng giá đối tác.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-3.5" />
              <span>Làm mới</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs shadow-sm"
              onClick={() => setOpenIngDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Thêm mặt hàng mới</span>
            </Button>
          </div>
        </div>

        {/* Master Catalog Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="items" className="gap-2 text-xs">
              <Boxes className="size-4" />
              <span>Mặt hàng & SKU ({ingredients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2 text-xs">
              <Scale className="size-4" />
              <span>Đơn vị tính ({units.length})</span>
            </TabsTrigger>
            <TabsTrigger value="conversions" className="gap-2 text-xs">
              <ArrowRightLeft className="size-4" />
              <span>Hệ số quy đổi ({conversions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2 text-xs">
              <Building className="size-4" />
              <span>Nhà cung cấp ({suppliers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INGREDIENTS */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm SKU theo tên, mã hoặc mã vạch..."
                  className="pl-9 h-9 text-xs"
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="h-9 w-52 text-xs">
                    <SelectValue placeholder="Tất cả nhóm hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả nhóm hàng</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
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
                    <TableHead className="w-[140px] text-xs">Mã SKU</TableHead>
                    <TableHead className="text-xs">Tên Nguyên Liệu / Hàng Hóa</TableHead>
                    <TableHead className="text-xs">Nhóm Danh Mục</TableHead>
                    <TableHead className="text-xs">Đơn Vị Cơ Sở</TableHead>
                    <TableHead className="text-right text-xs">Giá Vốn Tiêu Chuẩn</TableHead>
                    <TableHead className="text-right text-xs">Ngưỡng An Toàn</TableHead>
                    <TableHead className="text-right text-xs">Hạn Dùng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {ing.code}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{ing.name}</p>
                          {ing.barcode && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                              <Barcode className="size-3" />
                              {ing.barcode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                          {ing.groupName || "Khác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ing.baseUnitSymbol || "kg"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {formatCurrency(ing.cost_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        Min: {ing.min_stock} / Max: {ing.max_stock}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {ing.shelf_life_days} ngày
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: UNITS */}
          <TabsContent value="units" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Định nghĩa các đơn vị tính cơ sở dùng trong đo lường, xuất nhập và định lượng công thức.
              </p>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setOpenUnitDialog(true)}
              >
                <Plus className="size-3.5" />
                <span>Thêm đơn vị mới</span>
              </Button>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-xs">Mã Đơn Vị</TableHead>
                    <TableHead className="text-xs">Tên Đơn Vị</TableHead>
                    <TableHead className="text-xs">Ký Hiệu Hiển Thị</TableHead>
                    <TableHead className="text-xs">Mô Tả Quy Cách</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {u.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{u.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {u.symbol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: CONVERSIONS */}
          <TabsContent value="conversions" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Tỷ lệ quy đổi giữa đơn vị mua hàng (Thùng, Bao, Khay) sang đơn vị lưu kho và tiêu hao (Kg, Gram, Lon).
              </p>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setOpenConvDialog(true)}
              >
                <Plus className="size-3.5" />
                <span>Thiết lập quy đổi</span>
              </Button>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Đơn Vị Nguồn</TableHead>
                    <TableHead className="text-center text-xs">Chuyển Đổi</TableHead>
                    <TableHead className="text-xs">Đơn Vị Đích</TableHead>
                    <TableHead className="text-right text-xs">Hệ Số Tỷ Lệ</TableHead>
                    <TableHead className="text-xs">Áp Dụng Cho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium text-xs">
                        1 {conv.fromUnitName}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        =
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {conv.factor} {conv.toUnitName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-primary font-semibold">
                        x{conv.factor}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conv.ingredientName || "Toàn bộ danh mục"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 4: SUPPLIERS */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mạng lưới nhà cung cấp thực phẩm, hải sản, đồ uống và gia vị cho chuỗi nhà hàng DICA.
              </p>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setOpenSupDialog(true)}
              >
                <Plus className="size-3.5" />
                <span>Thêm nhà cung cấp</span>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((sup) => (
                <Card key={sup.id} className="border-border/80">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {sup.code}
                      </Badge>
                      <span className="text-xs text-amber-500 font-semibold">
                        ★ {sup.rating}
                      </span>
                    </div>
                    <CardTitle className="font-heading text-base font-bold pt-1">
                      {sup.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                    <p className="font-medium text-foreground">
                      Người liên hệ: {sup.contact_person}
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5" />
                      <span>{sup.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5" />
                      <span>{sup.email}</span>
                    </div>
                    <p className="pt-2 border-t border-border/60 text-[11px]">
                      Lead time: <span className="font-semibold text-foreground">{sup.lead_time_days} ngày</span> • MST: {sup.tax_code}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modular Form Dialogs (react-hook-form + zod) */}
        <IngredientFormDialog
          open={openIngDialog}
          onOpenChange={setOpenIngDialog}
        />
        <UnitFormDialog
          open={openUnitDialog}
          onOpenChange={setOpenUnitDialog}
        />
        <UnitConversionDialog
          open={openConvDialog}
          onOpenChange={setOpenConvDialog}
        />
        <SupplierFormDialog
          open={openSupDialog}
          onOpenChange={setOpenSupDialog}
        />
      </div>
    </AdminLayout>
  );
}
