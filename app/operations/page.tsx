"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Utensils,
  Plus,
  RefreshCw,
  Bell,
  Sparkles,
  Zap,
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
  useMenuItemsQuery,
  useVariancesQuery,
  useAlertRulesQuery,
  useCreateMenuItemMutation,
  useCreateAlertRuleMutation,
  useSyncIposMutation,
} from "@/hooks";
import { formatCurrency } from "@/lib/formatters";

export default function OperationsPage() {
  const { data: mappings = [], refetch: refetchMappings } = useMenuItemsQuery();
  const { data: variances = [], refetch: refetchVariances } = useVariancesQuery();
  const { data: alertRules = [], refetch: refetchAlertRules } = useAlertRulesQuery();

  const { mutate: createMenuItem } = useCreateMenuItemMutation();
  const { mutate: createAlertRule } = useCreateAlertRuleMutation();
  const { mutate: syncIpos, isPending: isSyncing } = useSyncIposMutation();

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

  const handleRefresh = () => {
    refetchMappings();
    refetchVariances();
    refetchAlertRules();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              iPOS & Định Mức Hao Hụt (BOM)
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Đồng bộ dữ liệu bán lẻ POS, đối soát định lượng thực đơn và giám sát cảnh báo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              disabled={isSyncing}
              onClick={() => {
                syncIpos(undefined, {
                  onSuccess: () => {
                    const now = new Date().toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    setLastSyncTime(`Hôm nay, ${now}`);
                  },
                });
              }}
            >
              <RefreshCw className={isSyncing ? "size-3.5 animate-spin" : "size-3.5"} />
              <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ iPOS"}</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl shadow-xs"
              onClick={() => setOpenMapDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Liên kết món POS</span>
            </Button>
          </div>
        </div>

        {/* Sync Summary Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Zap className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Cổng Kết Nối iPOS Cloud API
              </p>
              <p className="text-[11px] text-muted-foreground">
                Lần đồng bộ gần nhất: <span className="font-mono text-foreground">{lastSyncTime}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-border bg-muted text-foreground">
            Đã đồng bộ 148 hóa đơn
          </Badge>
        </div>

        {/* Tabs: Mappings, Variances, Alert Rules */}
        <Tabs defaultValue="mappings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-[480px] rounded-xl border border-border bg-muted/40 p-1">
            <TabsTrigger value="mappings" className="text-xs rounded-lg gap-1.5">
              <Utensils className="size-3.5" />
              <span>Định Mức Món ({mappings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="variances" className="text-xs rounded-lg gap-1.5">
              <Sparkles className="size-3.5" />
              <span>Hao Hụt Thực Tế ({variances.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-xs rounded-lg gap-1.5">
              <Bell className="size-3.5" />
              <span>Quy Tắc Cảnh Báo ({alertRules.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Mappings */}
          <TabsContent value="mappings" className="mt-4">
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Mã PLU iPOS</TableHead>
                    <TableHead>Tên Món Thực Đơn</TableHead>
                    <TableHead>Phân Nhóm</TableHead>
                    <TableHead className="text-right">Giá Bán Niêm Yết</TableHead>
                    <TableHead className="text-center">Số Cấu Phần (BOM)</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow key={m.id} className="border-border">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {m.pos_item_id}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {m.pos_item_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.category}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {formatCurrency(m.selling_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] border-border text-foreground font-mono">
                          {m.bom_count} nguyên liệu
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border bg-muted text-foreground font-semibold"
                        >
                          {m.active ? "Đang áp dụng" : "Ngừng kinh doanh"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 2: Variances */}
          <TabsContent value="variances" className="mt-4">
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Chi Nhánh</TableHead>
                    <TableHead>Nguyên Vật Liệu</TableHead>
                    <TableHead className="text-right">Tiêu Hao Lý Thuyết (BOM)</TableHead>
                    <TableHead className="text-right">Tiêu Hao Thực Tế</TableHead>
                    <TableHead className="text-right">Chênh Lệch</TableHead>
                    <TableHead className="text-right">Tỷ Lệ Hao Hụt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variances.map((v) => (
                    <TableRow key={v.id} className="border-border">
                      <TableCell className="text-xs font-medium text-foreground">
                        {v.branch_name}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-semibold">
                        {v.ingredient_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {v.theoretical_usage}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {v.actual_usage}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {v.variance_qty > 0 ? `+${v.variance_qty}` : v.variance_qty}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border bg-muted text-foreground font-bold font-mono"
                        >
                          {v.variance_pct > 0 ? `+${v.variance_pct}%` : `${v.variance_pct}%`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab 3: Alert Rules */}
          <TabsContent value="rules" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-xl border-border hover:bg-muted"
                onClick={() => setOpenRuleDialog(true)}
              >
                <Plus className="size-3 mr-1" />
                Thêm quy tắc
              </Button>
            </div>
            <Card className="rounded-2xl border-border bg-card/90 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Tên Quy Tắc</TableHead>
                    <TableHead>Loại Cảnh Báo</TableHead>
                    <TableHead className="text-right">Ngưỡng Kích Hoạt</TableHead>
                    <TableHead className="text-center">Kênh Thông Báo</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertRules.map((rule) => (
                    <TableRow key={rule.id} className="border-border">
                      <TableCell className="text-xs font-semibold text-foreground">
                        {rule.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rule.type}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground font-bold">
                        &gt; {rule.threshold_value}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] border-border text-foreground">
                          {rule.notification_channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] border-border bg-muted text-foreground font-semibold">
                          Hoạt động
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Mapping Dialog */}
        <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Liên Kết Món Ăn Từ Hệ Thống iPOS
              </DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo mã món để phân rã định lượng BOM
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên món POS</Label>
                <Input
                  placeholder="VD: Bò Nướng Sốt Tiêu Đen"
                  className="h-9 text-xs"
                  value={posItemName}
                  onChange={(e) => setPosItemName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phân nhóm thực đơn</Label>
                <Input
                  placeholder="VD: MÓN NƯỚNG"
                  className="h-9 text-xs"
                  value={posCategory}
                  onChange={(e) => setPosCategory(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Giá bán (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="VD: 189000"
                  className="h-9 text-xs"
                  value={posPrice}
                  onChange={(e) => setPosPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpenMapDialog(false)}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (posItemName && posPrice) {
                    createMenuItem({
                      posItemName,
                      category: posCategory,
                      sellingPrice: parseFloat(posPrice),
                    });
                    setPosItemName("");
                    setPosPrice("");
                    setOpenMapDialog(false);
                  }
                }}
              >
                Lưu liên kết
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Rule Dialog */}
        <Dialog open={openRuleDialog} onOpenChange={setOpenRuleDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Thiết Lập Quy Tắc Cảnh Báo
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tự động gửi cảnh báo khi hao hụt vượt ngưỡng
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên quy tắc</Label>
                <Input
                  placeholder="VD: Cảnh báo hao hụt sốt > 5%"
                  className="h-9 text-xs"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ngưỡng vượt (%)</Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={ruleThreshold}
                  onChange={(e) => setRuleThreshold(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpenRuleDialog(false)}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (ruleName) {
                    createAlertRule({
                      name: ruleName,
                      type: ruleType,
                      threshold_percent: parseFloat(ruleThreshold) || 5,
                      channel: ruleChannel,
                    });
                    setRuleName("");
                    setOpenRuleDialog(false);
                  }
                }}
              >
                Kích hoạt quy tắc
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
