"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Sparkles,
  TrendingDown,
  Percent,
  Check,
  Zap,
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
  type MenuItemMapping,
  type VarianceResult,
  type AlertRule,
  type Ingredient,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function OperationsPage() {
  const [mappings, setMappings] = React.useState<MenuItemMapping[]>([]);
  const [variances, setVariances] = React.useState<VarianceResult[]>([]);
  const [alertRules, setAlertRules] = React.useState<AlertRule[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);

  // iPOS Sync status state
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState("Hôm nay, 11:30");

  // Create Mapping / Recipe State
  const [openMapDialog, setOpenMapDialog] = React.useState(false);
  const [posItemName, setPosItemName] = React.useState("");
  const [posCategory, setPosCategory] = React.useState("");
  const [posPrice, setPosPrice] = React.useState("");

  // Create Alert Rule State
  const [openRuleDialog, setOpenRuleDialog] = React.useState(false);
  const [ruleName, setRuleName] = React.useState("");
  const [ruleType, setRuleType] = React.useState<
    "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE"
  >("HIGH_VARIANCE");
  const [ruleThreshold, setRuleThreshold] = React.useState("5");
  const [ruleChannel, setRuleChannel] = React.useState<"IN_APP" | "EMAIL" | "TELEGRAM">("IN_APP");

  const loadData = () => {
    setMappings(dicaStore.getMenuMappings());
    setVariances(dicaStore.getVariances());
    setAlertRules(dicaStore.getAlertRules());
    setIngredients(dicaStore.getIngredients());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleSyncIPos = () => {
    setIsSyncing(true);
    toast.loading("Đang kết nối tới iPOS Cloud API và đồng bộ doanh số...");

    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setLastSyncTime(`Hôm nay, ${now}`);
      toast.success("Đồng bộ hóa 148 hóa đơn bán lẻ từ iPOS thành công!");
    }, 1500);
  };

  const handleRecalculateVariance = () => {
    toast.loading("Đang tính toán đối soát định mức theo BOM công thức...");
    setTimeout(() => {
      toast.success("Đã hoàn tất tính toán hao hụt thực tế toàn chuỗi!");
    }, 1000);
  };

  const handleCreateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posItemName || !posPrice) {
      toast.error("Vui lòng nhập tên món và giá bán niêm yết!");
      return;
    }

    const newMap: MenuItemMapping = {
      id: `map-${Date.now()}`,
      pos_item_id: `IPOS-PLU-${Math.floor(1000 + Math.random() * 9000)}`,
      pos_item_name: posItemName.trim(),
      category: posCategory || "MÓN MỚI",
      selling_price: parseFloat(posPrice) || 0,
      active: true,
      bom_count: 2,
    };

    const updated = [newMap, ...mappings];
    setMappings(updated);
    dicaStore.saveMenuMappings(updated);

    toast.success(`Đã thêm món ăn định mức ${newMap.pos_item_name}`);
    setOpenMapDialog(false);
    setPosItemName("");
    setPosPrice("");
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) {
      toast.error("Vui lòng nhập tên quy tắc cảnh báo!");
      return;
    }

    const newRule: AlertRule = {
      id: `alt-${Date.now()}`,
      name: ruleName.trim(),
      type: ruleType,
      threshold_value: parseFloat(ruleThreshold) || 5,
      unit:
        ruleType === "HIGH_VARIANCE"
          ? "% Hao hụt"
          : ruleType === "EXPIRATION"
          ? "Ngày"
          : "% Tồn",
      notification_channel: ruleChannel,
      active: true,
    };

    const updated = [newRule, ...alertRules];
    setAlertRules(updated);
    dicaStore.saveAlertRules(updated);

    toast.success(`Đã thiết lập quy tắc cảnh báo: ${newRule.name}`);
    setOpenRuleDialog(false);
    setRuleName("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              iPOS & Định Mức Công Thức Món Ăn (BOM)
            </h1>
            <p className="text-sm text-muted-foreground">
              Tích hợp bán hàng POS, công thức chế biến (Bill of Materials) và kiểm soát thất thoát nguyên liệu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncIPos}
              disabled={isSyncing}
              className="h-9 gap-1.5 shadow-sm"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              <span>Đồng bộ hóa iPOS</span>
            </Button>

            <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Khai báo món ăn mới</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Khai Báo Món Ăn & Ghép Định Mức
                  </DialogTitle>
                  <DialogDescription>
                    Liên kết mã món trên hệ thống POS với danh sách nguyên liệu tiêu hao.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMapping} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="mName">Tên món bán trên Menu</Label>
                    <Input
                      id="mName"
                      placeholder="VD: Set Lẩu Nấm Bò Mỹ Đặc Biệt"
                      value={posItemName}
                      onChange={(e) => setPosItemName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mCat">Phân nhóm menu</Label>
                      <Input
                        id="mCat"
                        placeholder="VD: LẨU TƯƠI"
                        value={posCategory}
                        onChange={(e) => setPosCategory(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mPrice">Giá bán niêm yết (VNĐ)</Label>
                      <Input
                        id="mPrice"
                        type="number"
                        placeholder="VD: 499000"
                        value={posPrice}
                        onChange={(e) => setPosPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit">Lưu món & Tạo BOM</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Integration Status Banner */}
        <Card className="border-border/80 bg-gradient-to-r from-card via-card to-blue-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Zap className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    Bộ Điều Hợp Kết Nối iPOS Adapter Cloud
                  </h4>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px]">
                    Sẵn Sàng
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tự động chuyển đổi hóa đơn bàn ăn thành lượng trừ kho lý thuyết. Lần đồng bộ gần nhất:{" "}
                  <span className="font-semibold text-foreground">{lastSyncTime}</span>.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0 gap-1.5"
              onClick={handleRecalculateVariance}
            >
              <TrendingDown className="size-3.5" />
              <span>Đối soát hao hụt</span>
            </Button>
          </CardContent>
        </Card>

        {/* Tabs: Mappings, Variances, Alert Rules */}
        <Tabs defaultValue="recipes" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="recipes" className="gap-2 text-xs">
              <Utensils className="size-4" />
              <span>Định Mức Món Ăn ({mappings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="variances" className="gap-2 text-xs">
              <Percent className="size-4" />
              <span>Báo Cáo Hao Hụt & Thất Thoát ({variances.length})</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 text-xs">
              <Bell className="size-4" />
              <span>Quy Tắc Cảnh Báo ({alertRules.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RECIPES & MAPPINGS */}
          <TabsContent value="recipes" className="space-y-4">
            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Mã iPOS</TableHead>
                    <TableHead>Tên Món Ăn</TableHead>
                    <TableHead>Danh Mục Menu</TableHead>
                    <TableHead className="text-right">Giá Bán Niêm Yết</TableHead>
                    <TableHead className="text-center">Số Thành Phần BOM</TableHead>
                    <TableHead className="text-right">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((map) => (
                    <TableRow key={map.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {map.pos_item_id}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {map.pos_item_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {map.category}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {map.selling_price.toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {map.bom_count} nguyên liệu
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                        >
                          Đang phục vụ
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: VARIANCES */}
          <TabsContent value="variances" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                So sánh số lượng nguyên liệu tiêu hao lý thuyết (qua hóa đơn bán) với số lượng thực tế xuất kho.
              </p>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chi Nhánh</TableHead>
                    <TableHead>Kỳ Đối Soát</TableHead>
                    <TableHead>Nguyên Vật Liệu</TableHead>
                    <TableHead className="text-right">Lý Thuyết (POS)</TableHead>
                    <TableHead className="text-right">Thực Tế (Kho)</TableHead>
                    <TableHead className="text-right">Chênh Lệch</TableHead>
                    <TableHead className="text-right">Tổn Thất Tài Chính</TableHead>
                    <TableHead className="text-center">Đánh Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variances.map((vr) => (
                    <TableRow key={vr.id}>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {vr.branch_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {vr.date_range}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {vr.ingredient_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {vr.theoretical_usage} kg
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {vr.actual_usage} kg
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs font-bold",
                          vr.variance_pct > 10
                            ? "text-red-600 dark:text-red-400"
                            : vr.variance_pct > 5
                            ? "text-amber-600"
                            : "text-emerald-600"
                        )}
                      >
                        +{vr.variance_qty} kg (+{vr.variance_pct}%)
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        {vr.financial_impact.toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            vr.status === "CRITICAL"
                              ? "destructive"
                              : vr.status === "WARNING"
                              ? "secondary"
                              : "outline"
                          }
                          className={cn(
                            "text-[10px]",
                            vr.status === "WARNING" &&
                              "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {vr.status === "CRITICAL"
                            ? "Thất thoát cao"
                            : vr.status === "WARNING"
                            ? "Cảnh báo"
                            : "Mức bình thường"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: ALERTS */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Cấu hình ngưỡng tự động gửi cảnh báo qua ứng dụng, Email và Telegram cho Giám đốc SCM & Bếp trưởng.
              </p>
              <Dialog open={openRuleDialog} onOpenChange={setOpenRuleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5 text-xs">
                    <Plus className="size-3.5" />
                    <span>Thêm quy tắc</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-lg">
                      Thiết Lập Quy Tắc Cảnh Báo
                    </DialogTitle>
                    <DialogDescription>
                      Khai báo điều kiện kích hoạt thông báo tự động.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRule} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="rName">Tên quy tắc</Label>
                      <Input
                        id="rName"
                        placeholder="VD: Cảnh báo khi hao hụt thịt bò > 5%"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Loại cảnh báo</Label>
                        <Select
                          value={ruleType}
                          onValueChange={(val) =>
                            setRuleType(
                              val as "LOW_STOCK" | "EXPIRATION" | "HIGH_VARIANCE" | "PRICE_SURGE"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HIGH_VARIANCE">Hao hụt cao</SelectItem>
                            <SelectItem value="LOW_STOCK">Tồn kho thấp</SelectItem>
                            <SelectItem value="EXPIRATION">Cận hạn dùng</SelectItem>
                            <SelectItem value="PRICE_SURGE">Biến động giá nhập</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thresh">Ngưỡng kích hoạt</Label>
                        <Input
                          id="thresh"
                          type="number"
                          value={ruleThreshold}
                          onChange={(e) => setRuleThreshold(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kênh gửi thông báo</Label>
                      <Select
                        value={ruleChannel}
                        onValueChange={(val) =>
                          setRuleChannel(val as "IN_APP" | "EMAIL" | "TELEGRAM")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_APP">Thông báo trong ứng dụng</SelectItem>
                          <SelectItem value="EMAIL">Hộp thư Email</SelectItem>
                          <SelectItem value="TELEGRAM">Nhóm Bot Telegram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="submit">Lưu quy tắc cảnh báo</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alertRules.map((rule) => (
                <Card key={rule.id} className="border-border/80">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          rule.type === "HIGH_VARIANCE"
                            ? "bg-red-500/15 text-red-700 dark:text-red-400"
                            : rule.type === "EXPIRATION"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                        )}
                      >
                        {rule.type === "HIGH_VARIANCE"
                          ? "Hao Hụt Vượt Ngưỡng"
                          : rule.type === "EXPIRATION"
                          ? "Hạn Dùng Cận Kề"
                          : "Tồn Kho An Toàn"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono text-emerald-600">
                        Active
                      </Badge>
                    </div>
                    <CardTitle className="font-heading text-sm font-bold pt-1">
                      {rule.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      Ngưỡng áp dụng:{" "}
                      <span className="font-bold text-foreground">
                        {rule.threshold_value} {rule.unit}
                      </span>
                    </p>
                    <p>
                      Kênh phát cảnh báo:{" "}
                      <span className="font-mono text-primary font-semibold">
                        {rule.notification_channel}
                      </span>
                    </p>
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
