"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Warehouse,
  Search,
  BookOpen,
  ArrowRightLeft,
  ClipboardCheck,
  SlidersHorizontal,
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
import { StockAdjustmentDialog } from "@/components/forms";
import { useStockBalancesQuery, useFacilitiesQuery } from "@/hooks";
import { useAppStore } from "@/stores/use-app-store";
import type { StockBalance } from "@/types";

export default function InventoryPage() {
  const globalFacilityId = useAppStore((state) => state.selectedFacilityId);

  // TanStack Query
  const { data: facilities = [] } = useFacilitiesQuery();
  const [selectedFacility, setSelectedFacility] = React.useState(globalFacilityId);
  const {
    data: balances = [],
    refetch,
    isLoading,
  } = useStockBalancesQuery(
    selectedFacility !== "ALL" ? selectedFacility : undefined
  );

  // Search & Filter
  const [searchSKU, setSearchSKU] = React.useState("");

  // Adjustment dialog state
  const [selectedBalance, setSelectedBalance] = React.useState<StockBalance | null>(null);
  const [openAdjDialog, setOpenAdjDialog] = React.useState(false);

  // Filtered balances
  const filteredBalances = React.useMemo(() => {
    return balances.filter((b) => {
      const matchSearch =
        b.ingredient_name.toLowerCase().includes(searchSKU.toLowerCase()) ||
        b.ingredient_code.toLowerCase().includes(searchSKU.toLowerCase()) ||
        b.location_name.toLowerCase().includes(searchSKU.toLowerCase()) ||
        b.batch_number.toLowerCase().includes(searchSKU.toLowerCase());
      return matchSearch;
    });
  }, [balances, searchSKU]);

  // Overall metric totals
  const totalValue = balances.reduce((sum, b) => sum + b.total_value, 0);
  const lowStockCount = balances.filter((b) => b.is_low_stock).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Quản Trị Tồn Kho & Sổ Cái Vật Tư
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi số dư thực tế theo lô hạn dùng (FIFO), điều chuyển nội bộ và thẻ kho điện tử.
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
          </div>
        </div>

        {/* Overview Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">TỔNG GIÁ TRỊ TỒN KHO</p>
              <p className="text-xl font-bold font-mono text-foreground mt-1">
                {totalValue.toLocaleString("vi-VN")} ₫
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">SỐ LƯỢNG SKU TRỮ KHO</p>
              <p className="text-xl font-bold font-mono text-foreground mt-1">
                {balances.length} SKU
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">CẢNH BÁO TỒN THẤP</p>
              <p className="text-xl font-bold font-mono text-foreground mt-1">
                {lowStockCount} mặt hàng
              </p>
            </CardContent>
          </Card>
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
          </TabsList>

          {/* TAB 1: STOCK ON HAND */}
          <TabsContent value="balances" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên nguyên liệu, mã SKU, vị trí, số lô..."
                  className="pl-9 h-9 text-xs"
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedFacility}
                  onValueChange={setSelectedFacility}
                >
                  <SelectTrigger className="h-9 w-52 text-xs">
                    <SelectValue placeholder="Chọn cơ sở" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả cơ sở</SelectItem>
                    {facilities.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id}>
                        {fac.name}
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
                    <TableHead className="text-xs">Tên Nguyên Liệu</TableHead>
                    <TableHead className="text-xs">Cơ Sở & Vị Trí Kho</TableHead>
                    <TableHead className="text-right text-xs">Tồn Khả Dụng</TableHead>
                    <TableHead className="text-right text-xs">Giá Trị Tồn</TableHead>
                    <TableHead className="text-xs">Số Lô & HSD</TableHead>
                    <TableHead className="text-center text-xs">Tình Trạng</TableHead>
                    <TableHead className="text-right text-xs">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                        Không có dữ liệu tồn kho nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBalances.map((sb) => (
                      <TableRow key={sb.id}>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {sb.ingredient_code}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {sb.ingredient_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sb.facility_name} • {sb.location_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                          {sb.available_quantity} {sb.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                          {sb.total_value.toLocaleString("vi-VN")} ₫
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {sb.batch_number} (HSD: {sb.expiry_date})
                        </TableCell>
                        <TableCell className="text-center">
                          {sb.is_low_stock ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Tồn Thấp
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              An Toàn
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => {
                              setSelectedBalance(sb);
                              setOpenAdjDialog(true);
                            }}
                          >
                            <SlidersHorizontal className="size-3" />
                            <span>Điều chỉnh</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: LEDGER */}
          <TabsContent value="ledger" className="space-y-4">
            <Card className="border-border/80 p-8 text-center text-xs text-muted-foreground">
              Sổ cái tự động cập nhật mọi biến động xuất nhập kho, điều chuyển và điều chỉnh theo thời gian thực.
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modular Stock Adjustment Dialog (react-hook-form + zod) */}
        <StockAdjustmentDialog
          open={openAdjDialog}
          onOpenChange={setOpenAdjDialog}
          balance={selectedBalance}
        />
      </div>
    </AdminLayout>
  );
}
