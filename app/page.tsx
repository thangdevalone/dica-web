"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Boxes,
  Building2,
  ClipboardList,
  Truck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Utensils,
  RefreshCw,
  Eye,
  Check,
  X,
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  dicaStore,
  type Facility,
  type Ingredient,
  type SupplyRequest,
  type StockBalance,
  type Discrepancy,
  type AuditEvent,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const WEEKLY_DATA = [
  { day: "Thứ 2", xuat: 24, nhap: 38 },
  { day: "Thứ 3", xuat: 30, nhap: 28 },
  { day: "Thứ 4", xuat: 42, nhap: 45 },
  { day: "Thứ 5", xuat: 36, nhap: 32 },
  { day: "Thứ 6", xuat: 58, nhap: 62 },
  { day: "Thứ 7", xuat: 72, nhap: 50 },
  { day: "Chủ nhật", xuat: 65, nhap: 40 },
];

const CATEGORY_COLORS = ["#ea580c", "#71717a", "#a1a1aa", "#52525b", "#d4d4d8"];

export default function DashboardPage() {
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [requests, setRequests] = React.useState<SupplyRequest[]>([]);
  const [balances, setBalances] = React.useState<StockBalance[]>([]);
  const [discrepancies, setDiscrepancies] = React.useState<Discrepancy[]>([]);
  const [audits, setAudits] = React.useState<AuditEvent[]>([]);

  // Dialog state for quick request creation
  const [openNewReqDialog, setOpenNewReqDialog] = React.useState(false);
  const [targetFacility, setTargetFacility] = React.useState("");
  const [selectedIngredient, setSelectedIngredient] = React.useState("");
  const [reqQuantity, setReqQuantity] = React.useState("");
  const [reqNotes, setReqNotes] = React.useState("");

  const refreshData = () => {
    setFacilities(dicaStore.getFacilities());
    setIngredients(dicaStore.getIngredients());
    setRequests(dicaStore.getSupplyRequests());
    setBalances(dicaStore.getStockBalances());
    setDiscrepancies(dicaStore.getDiscrepancies());
    setAudits(dicaStore.getAudits());
  };

  React.useEffect(() => {
    refreshData();
  }, []);

  const totalInventoryValue = balances.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockItems = balances.filter((item) => item.is_low_stock);
  const pendingRequests = requests.filter((r) => r.status === "SUBMITTED" || r.status === "DRAFT");
  const openDiscrepancies = discrepancies.filter((d) => d.status === "OPEN");

  // Chart data for stock allocation
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances) {
      const ing = ingredients.find((i) => i.id === b.ingredient_id);
      const grp = ing?.groupName || "Khác";
      map.set(grp, (map.get(grp) || 0) + b.total_value);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [balances, ingredients]);

  const handleApproveRequest = (reqId: string) => {
    const updated = requests.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: "APPROVED" as const,
          approver: "Nguyễn Thế Thắng (Admin)",
        };
      }
      return r;
    });
    setRequests(updated);
    dicaStore.saveSupplyRequests(updated);

    // Add audit event
    const newAudit: AuditEvent = {
      id: `aud-${Date.now()}`,
      action: "REQUEST_APPROVAL",
      resource: "SupplyRequest",
      performed_by: "Nguyễn Thế Thắng",
      user_email: "thang.admin@dica.vn",
      ip_address: "127.0.0.1",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      summary: `Phê duyệt yêu cầu ${reqId} trực tiếp từ Dashboard`,
    };
    const updatedAudits = [newAudit, ...audits];
    setAudits(updatedAudits);
    dicaStore.saveAudits(updatedAudits);

    toast.success("Đã phê duyệt yêu cầu cấp hàng thành công!");
  };

  const handleCreateQuickRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacility || !selectedIngredient || !reqQuantity) {
      toast.error("Vui lòng điền đủ cơ sở, nguyên liệu và số lượng!");
      return;
    }

    const fac = facilities.find((f) => f.id === targetFacility);
    const ing = ingredients.find((i) => i.id === selectedIngredient);
    if (!fac || !ing) return;

    const qty = parseFloat(reqQuantity) || 10;
    const estCost = qty * ing.cost_price;

    const newReq: SupplyRequest = {
      id: `req-${Date.now()}`,
      code: `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(requests.length + 1).padStart(3, "0")}`,
      destination_facility_id: fac.id,
      destinationFacilityName: fac.name,
      source_type: "STOCK",
      source_facility_id: "fac-1",
      sourceFacilityName: "Kho Tổng Trung Tâm Bình Tân",
      status: "SUBMITTED",
      requested_by: "Nguyễn Thế Thắng (Quản trị viên)",
      created_at: new Date().toISOString(),
      expected_delivery: new Date(Date.now() + 86400000).toISOString(),
      total_items: 1,
      total_value: estCost,
      notes: reqNotes || "Yêu cầu tạo nhanh từ dashboard",
      items: [
        {
          id: `ri-${Date.now()}`,
          ingredient_id: ing.id,
          ingredientName: ing.name,
          ingredientCode: ing.code,
          unit: ing.baseUnitSymbol || "kg",
          requested_quantity: qty,
          approved_quantity: qty,
          estimated_cost: estCost,
        },
      ],
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    dicaStore.saveSupplyRequests(updated);

    toast.success(`Đã tạo yêu cầu cấp hàng ${newReq.code} thành công!`);
    setOpenNewReqDialog(false);
    setReqQuantity("");
    setReqNotes("");
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Hero Section & Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Trung Tâm Điều Hành Cung Ứng & Tồn Kho
            </h1>
            <p className="text-sm text-muted-foreground">
              Giám sát đa cơ sở, điều phối đơn cấp hàng và định mức hao hụt hệ thống DICA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Action Button: New Request */}
            <Dialog open={openNewReqDialog} onOpenChange={setOpenNewReqDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm shadow-primary/20">
                  <Plus className="size-4" />
                  <span>Tạo yêu cầu cấp hàng</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Yêu Cầu Cấp Hàng Nhanh
                  </DialogTitle>
                  <DialogDescription>
                    Điều phối nguyên vật liệu từ Kho Tổng tới các chi nhánh nhà hàng.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateQuickRequest} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="destFacility">Chi nhánh nhận hàng</Label>
                    <Select value={targetFacility} onValueChange={setTargetFacility}>
                      <SelectTrigger id="destFacility">
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
                  <div className="space-y-2">
                    <Label htmlFor="ingSelect">Nguyên vật liệu</Label>
                    <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                      <SelectTrigger id="ingSelect">
                        <SelectValue placeholder="Chọn nguyên liệu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qty">Số lượng yêu cầu</Label>
                    <Input
                      id="qty"
                      type="number"
                      step="any"
                      min="1"
                      placeholder="VD: 25"
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú điều phối</Label>
                    <Input
                      id="notes"
                      placeholder="VD: Bổ sung gấp cuối tuần"
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenNewReqDialog(false)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit">Xác nhận tạo yêu cầu</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Link href="/catalog">
              <Button variant="outline" className="h-9 gap-1.5">
                <Boxes className="size-4" />
                <span>Danh mục SKU</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-foreground"
              onClick={() => {
                refreshData();
                toast.success("Đã đồng bộ dữ liệu mới nhất.");
              }}
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Valuation */}
          <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                TỔNG GIÁ TRỊ TỒN KHO
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <DollarSign className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {totalInventoryValue.toLocaleString("vi-VN")} ₫
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <TrendingUp className="size-3.5 text-primary" />
                <span>+12.4% so với kỳ trước</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pending Requests */}
          <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                YÊU CẦU CẦN XỬ LÝ
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <ClipboardList className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {pendingRequests.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">phiếu</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {requests.filter((r) => r.status === "SUBMITTED").length} phiếu chờ duyệt từ chi nhánh
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Low Stock Alerts */}
          <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                CẢNH BÁO TỒN THẤP
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <AlertTriangle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {lowStockItems.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">mặt hàng</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Dưới ngưỡng tồn an toàn cần bổ sung
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Discrepancies */}
          <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                SAI LỆCH GIAO NHẬN
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <Truck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {openDiscrepancies.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">vụ việc</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cần đối chiếu biên bản giao nhận
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Bar Chart: Weekly flow */}
          <Card className="lg:col-span-4 border-border/70 bg-card/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-base font-bold">
                    Luồng Luân Chuyển Hàng Hóa (7 Ngày)
                  </CardTitle>
                  <CardDescription>
                    So sánh số lượt xuất kho chi nhánh và nhập kho từ nhà cung cấp
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Tuần hiện tại
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="xuat"
                    name="Xuất cho Chi Nhánh (Lượt)"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="nhap"
                    name="Nhập từ NCC (Lượt)"
                    fill="#71717a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Secondary Pie Chart: Inventory Allocation */}
          <Card className="lg:col-span-3 border-border/70 bg-card/60">
            <CardHeader>
              <CardTitle className="font-heading text-base font-bold">
                Phân Bổ Tồn Kho Theo Nhóm
              </CardTitle>
              <CardDescription>Giá trị tồn kho theo danh mục nguyên liệu</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) =>
                      `${Number(val).toLocaleString("vi-VN")} ₫`
                    }
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections: Pending Requests & Low Stock Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section 1: Pending Supply Requests */}
          <Card className="border-border/70 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-base font-bold">
                  Yêu Cầu Cấp Hàng Cần Duyệt
                </CardTitle>
                <CardDescription>Các đề xuất xin hàng từ bếp & nhà hàng</CardDescription>
              </div>
              <Link href="/requests">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <span>Xem tất cả</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {req.code}
                      </span>
                      <Badge
                        variant={
                          req.status === "APPROVED"
                            ? "outline"
                            : req.status === "SUBMITTED"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[11px]"
                      >
                        {req.status === "SUBMITTED"
                          ? "Chờ duyệt"
                          : req.status === "APPROVED"
                          ? "Đã duyệt"
                          : "Bản nháp"}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground">
                      Đến: {req.destinationFacilityName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {req.total_items} mặt hàng • {req.total_value.toLocaleString("vi-VN")} ₫ •{" "}
                      {req.requested_by}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    {req.status === "SUBMITTED" && (
                      <Button
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleApproveRequest(req.id)}
                      >
                        <Check className="size-3.5" />
                        <span>Duyệt</span>
                      </Button>
                    )}
                    <Link href={`/requests?id=${req.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 2: Low Stock & Batch Alerts */}
          <Card className="border-border/70 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-base font-bold">
                  Cảnh Báo Tồn Kho & Hạn Dùng
                </CardTitle>
                <CardDescription>Các SKU cần đặt hàng hoặc luân chuyển gấp</CardDescription>
              </div>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <span>Kiểm kho</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Hiện không có mặt hàng nào dưới mức tồn an toàn.
                </div>
              ) : (
                lowStockItems.map((sb) => (
                  <div
                    key={sb.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card/40 p-3.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {sb.ingredient_name}
                        </span>
                        <Badge variant="destructive" className="text-[10px] h-5">
                          Tồn thấp
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {sb.facility_name} • {sb.location_name}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Khả dụng: <span className="font-semibold text-foreground">{sb.available_quantity} {sb.unit}</span> (Mức an toàn: {sb.min_stock} {sb.unit})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSelectedIngredient(sb.ingredient_id);
                        setOpenNewReqDialog(true);
                      }}
                    >
                      Bổ sung
                    </Button>
                  </div>
                ))
              )}

              {/* Near expiry sample */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/40 p-3.5 transition-colors hover:bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Ba Chỉ Bò Cuộn Nấm Kim Châm
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      HSD: 15/10/2026
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    DICA BBQ Premium Q1 • Lô BATCH-202610-01
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Còn 12 ngày sử dụng. Ưu tiên tiêu thụ trước (FIFO).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facilities Status Overview Grid */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading text-base font-bold">
                Mạng Lưới Cơ Sở & Chi Nhánh Hoạt Động
              </CardTitle>
              <CardDescription>
                Hệ thống 1 Kho Trung Tâm, 1 Bếp Sơ Chế và 3 Nhà hàng trực thuộc DICA Group
              </CardDescription>
            </div>
            <Link href="/organization">
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <span>Quản lý cơ sở</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-border/80 text-muted-foreground"
                      >
                        {fac.type === "CENTRAL_WAREHOUSE"
                          ? "KHO TRUNG TÂM"
                          : fac.type === "CENTRAL_KITCHEN"
                          ? "BẾP TRUNG TÂM"
                          : "CHI NHÁNH NHÀ HÀNG"}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {fac.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Mã: {fac.code}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {fac.address}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {fac.type === "BRANCH"
                        ? "3 Điểm kho & Bếp"
                        : "5 Phân khu lưu kho"}
                    </span>
                    <Link
                      href={`/inventory?facility=${fac.id}`}
                      className="text-primary hover:underline font-medium flex items-center gap-0.5"
                    >
                      <span>Xem tồn</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Timeline Stream */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-base font-bold">
                  Nhật Ký Thao Tác Hệ Thống (Audit Trail)
                </CardTitle>
                <CardDescription>
                  Ghi nhận tự động mọi thay đổi cấu hình, định lượng và phê duyệt SCM
                </CardDescription>
              </div>
              <Link href="/system">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <span>Toàn bộ nhật ký</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audits.slice(0, 4).map((aud) => (
                <div key={aud.id} className="flex items-start gap-3">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="size-3" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {aud.performed_by}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 font-mono">
                        {aud.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/80 font-mono ml-auto">
                        {aud.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{aud.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
