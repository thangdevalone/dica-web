"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Trash2,
  Check,
  X,
  Eye,
  FileText,
  DollarSign,
  AlertCircle,
  Truck,
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
  type SupplyRequest,
  type SupplyRequestItem,
  type Facility,
  type Ingredient,
  type DocumentStatus,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function SupplyRequestsPage() {
  const [requests, setRequests] = React.useState<SupplyRequest[]>([]);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Detail Modal State
  const [selectedReq, setSelectedReq] = React.useState<SupplyRequest | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = React.useState(false);

  // Reject Reason Dialog State
  const [openRejectDialog, setOpenRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectTargetId, setRejectTargetId] = React.useState("");

  // Create Request Modal State
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [destFacilityId, setDestFacilityId] = React.useState("");
  const [sourceType, setSourceType] = React.useState<"STOCK" | "SUPPLIER">("STOCK");
  const [expectedDate, setExpectedDate] = React.useState("");
  const [reqNotes, setReqNotes] = React.useState("");
  const [requestItems, setRequestItems] = React.useState<
    { ingredientId: string; quantity: number }[]
  >([{ ingredientId: "", quantity: 10 }]);

  const loadData = () => {
    setRequests(dicaStore.getSupplyRequests());
    setFacilities(dicaStore.getFacilities());
    setIngredients(dicaStore.getIngredients());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destinationFacilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requested_by.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = (reqId: string) => {
    const updated = requests.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: "APPROVED" as DocumentStatus,
          approver: "Nguyễn Thế Thắng (Quản trị viên)",
        };
      }
      return r;
    });

    setRequests(updated);
    dicaStore.saveSupplyRequests(updated);

    if (selectedReq && selectedReq.id === reqId) {
      setSelectedReq({
        ...selectedReq,
        status: "APPROVED",
        approver: "Nguyễn Thế Thắng (Quản trị viên)",
      });
    }

    toast.success(`Đã phê duyệt yêu cầu cấp hàng ${reqId}`);
  };

  const handleOpenReject = (reqId: string) => {
    setRejectTargetId(reqId);
    setRejectReason("");
    setOpenRejectDialog(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) {
      toast.error("Vui lòng ghi rõ lý do từ chối yêu cầu!");
      return;
    }

    const updated = requests.map((r) => {
      if (r.id === rejectTargetId) {
        return {
          ...r,
          status: "REJECTED" as DocumentStatus,
          notes: `${r.notes || ""} [TỪ CHỐI: ${rejectReason}]`,
        };
      }
      return r;
    });

    setRequests(updated);
    dicaStore.saveSupplyRequests(updated);

    if (selectedReq && selectedReq.id === rejectTargetId) {
      setSelectedReq({
        ...selectedReq,
        status: "REJECTED",
        notes: `${selectedReq.notes || ""} [TỪ CHỐI: ${rejectReason}]`,
      });
    }

    toast.error(`Đã từ chối phiếu yêu cầu ${rejectTargetId}`);
    setOpenRejectDialog(false);
  };

  const handleAddLineItem = () => {
    setRequestItems([...requestItems, { ingredientId: "", quantity: 10 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (requestItems.length <= 1) return;
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destFacilityId) {
      toast.error("Vui lòng chọn cơ sở nhận hàng!");
      return;
    }

    const validItems = requestItems.filter((item) => item.ingredientId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nguyên vật liệu hợp lệ!");
      return;
    }

    const destFac = facilities.find((f) => f.id === destFacilityId);
    if (!destFac) return;

    let totalVal = 0;
    const finalItems: SupplyRequestItem[] = validItems.map((item, idx) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const cost = (ing?.cost_price || 0) * item.quantity;
      totalVal += cost;

      return {
        id: `item-${Date.now()}-${idx}`,
        ingredient_id: item.ingredientId,
        ingredientName: ing?.name || "Nguyên liệu",
        ingredientCode: ing?.code || "SKU-XXX",
        unit: ing?.baseUnitSymbol || "kg",
        requested_quantity: item.quantity,
        approved_quantity: item.quantity,
        estimated_cost: cost,
      };
    });

    const newReq: SupplyRequest = {
      id: `req-${Date.now()}`,
      code: `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(requests.length + 1).padStart(3, "0")}`,
      destination_facility_id: destFac.id,
      destinationFacilityName: destFac.name,
      source_type: sourceType,
      source_facility_id: sourceType === "STOCK" ? "fac-1" : undefined,
      sourceFacilityName:
        sourceType === "STOCK" ? "Kho Tổng Trung Tâm Bình Tân" : "Nhà cung cấp chỉ định",
      status: "SUBMITTED",
      requested_by: "Nguyễn Thế Thắng (Quản trị viên)",
      created_at: new Date().toISOString(),
      expected_delivery:
        expectedDate || new Date(Date.now() + 86400000).toISOString().substring(0, 10),
      total_items: finalItems.length,
      total_value: totalVal,
      notes: reqNotes.trim() || undefined,
      items: finalItems,
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    dicaStore.saveSupplyRequests(updated);

    toast.success(`Đã tạo yêu cầu cấp hàng ${newReq.code} thành công!`);
    setOpenCreateDialog(false);
    setRequestItems([{ ingredientId: "", quantity: 10 }]);
    setReqNotes("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Yêu Cầu Cấp Hàng (Supply Requests)
            </h1>
            <p className="text-sm text-muted-foreground">
              Quy trình xin cấp nguyên liệu từ nhà hàng & bếp, định tuyến tồn kho và phê duyệt tự động.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
                  <Plus className="size-4" />
                  <span>Tạo phiếu yêu cầu mới</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[620px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Yêu Cầu Cấp Hàng Đa Mặt Hàng
                  </DialogTitle>
                  <DialogDescription>
                    Lập danh sách nguyên vật liệu cần cấp cho chi nhánh hoặc bếp trung tâm.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRequest} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Chi nhánh nhận</Label>
                      <Select value={destFacilityId} onValueChange={setDestFacilityId}>
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
                    <div className="space-y-2">
                      <Label>Nguồn cấp</Label>
                      <Select
                        value={sourceType}
                        onValueChange={(val) => setSourceType(val as "STOCK" | "SUPPLIER")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STOCK">Kho Tổng Nội Bộ (Stock)</SelectItem>
                          <SelectItem value="SUPPLIER">Đặt Thẳng Nhà Cung Cấp (PO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expDate">Ngày cần giao</Label>
                      <Input
                        id="expDate"
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notesInput">Ghi chú điều phối</Label>
                      <Input
                        id="notesInput"
                        placeholder="VD: Cần gấp cho tiệc buffet"
                        value={reqNotes}
                        onChange={(e) => setReqNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Danh sách mặt hàng ({requestItems.length})
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddLineItem}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Thêm dòng</span>
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {requestItems.map((line, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={line.ingredientId}
                            onValueChange={(val) => {
                              const copy = [...requestItems];
                              copy[idx]!.ingredientId = val;
                              setRequestItems(copy);
                            }}
                          >
                            <SelectTrigger className="flex-1 text-xs">
                              <SelectValue placeholder="Chọn nguyên vật liệu..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.code}) — {ing.cost_price.toLocaleString("vi-VN")} ₫/{ing.baseUnitSymbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            min="1"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => {
                              const copy = [...requestItems];
                              copy[idx]!.quantity = parseFloat(e.target.value) || 0;
                              setRequestItems(copy);
                            }}
                            className="w-24 text-xs font-mono"
                            placeholder="SL"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="size-8 text-muted-foreground hover:text-red-500"
                            disabled={requestItems.length <= 1}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenCreateDialog(false)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit">Gửi yêu cầu cấp hàng</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pipeline Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all",
              statusFilter === "ALL" && "border-primary bg-primary/5"
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
              "cursor-pointer border-border/80 transition-all",
              statusFilter === "SUBMITTED" && "border-amber-500 bg-amber-500/5"
            )}
            onClick={() => setStatusFilter("SUBMITTED")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">CHỜ PHÊ DUYỆT</p>
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {requests.filter((r) => r.status === "SUBMITTED").length}
                </p>
              </div>
              <Clock className="size-5 text-amber-500" />
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all",
              statusFilter === "APPROVED" && "border-emerald-500 bg-emerald-500/5"
            )}
            onClick={() => setStatusFilter("APPROVED")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">ĐÃ PHÊ DUYỆT</p>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {requests.filter((r) => r.status === "APPROVED").length}
                </p>
              </div>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-border/80 transition-all",
              statusFilter === "REJECTED" && "border-red-500 bg-red-500/5"
            )}
            onClick={() => setStatusFilter("REJECTED")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">BỊ TỪ CHỐI</p>
                <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
                  {requests.filter((r) => r.status === "REJECTED").length}
                </p>
              </div>
              <XCircle className="size-5 text-red-500" />
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã phiếu, chi nhánh hoặc người tạo..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="SUBMITTED">Chờ duyệt (Submitted)</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt (Approved)</SelectItem>
                <SelectItem value="DRAFT">Bản nháp (Draft)</SelectItem>
                <SelectItem value="REJECTED">Bị từ chối (Rejected)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests Data Table */}
        <Card className="border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Mã Phiếu</TableHead>
                <TableHead>Chi Nhánh Nhận</TableHead>
                <TableHead>Nguồn Cấp</TableHead>
                <TableHead className="text-center">Số Mặt Hàng</TableHead>
                <TableHead className="text-right">Giá Trị Dự Kiến</TableHead>
                <TableHead>Ngày Cần Giao</TableHead>
                <TableHead className="text-center">Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {req.code}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {req.destinationFacilityName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {req.source_type === "STOCK" ? (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                        Kho Tổng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        Đặt NCC
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {req.total_items}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                    {req.total_value.toLocaleString("vi-VN")} ₫
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {req.expected_delivery.substring(0, 10)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        req.status === "APPROVED"
                          ? "default"
                          : req.status === "SUBMITTED"
                          ? "secondary"
                          : req.status === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                      className={cn(
                        "text-[10px]",
                        req.status === "SUBMITTED" &&
                          "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        req.status === "APPROVED" &&
                          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {req.status === "SUBMITTED"
                        ? "Chờ duyệt"
                        : req.status === "APPROVED"
                        ? "Đã duyệt"
                        : req.status === "REJECTED"
                        ? "Từ chối"
                        : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setSelectedReq(req);
                          setOpenDetailDialog(true);
                        }}
                      >
                        <Eye className="size-3.5" />
                        <span>Xem</span>
                      </Button>
                      {req.status === "SUBMITTED" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => handleApprove(req.id)}
                          >
                            <Check className="size-3" />
                            <span>Duyệt</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenReject(req.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Request Detail Dialog */}
        {selectedReq && (
          <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="font-heading text-lg flex items-center gap-2">
                    <span>Phiếu Yêu Cầu Cấp Hàng:</span>
                    <span className="font-mono text-primary font-bold">{selectedReq.code}</span>
                  </DialogTitle>
                  <Badge
                    variant={selectedReq.status === "APPROVED" ? "default" : "secondary"}
                    className={
                      selectedReq.status === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : selectedReq.status === "SUBMITTED"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : ""
                    }
                  >
                    {selectedReq.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Đề xuất bởi: <span className="font-semibold text-foreground">{selectedReq.requested_by}</span> • {selectedReq.created_at.substring(0, 10)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/80 bg-muted/30 p-3">
                  <div>
                    <span className="text-muted-foreground">Chi nhánh nhận:</span>
                    <p className="font-semibold text-foreground text-sm">
                      {selectedReq.destinationFacilityName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nguồn cung ứng:</span>
                    <p className="font-semibold text-foreground text-sm">
                      {selectedReq.sourceFacilityName || "Kho Tổng Bình Tân"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ngày giao dự kiến:</span>
                    <p className="font-mono text-foreground font-semibold">
                      {selectedReq.expected_delivery.substring(0, 10)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Người phê duyệt:</span>
                    <p className="text-foreground font-semibold">
                      {selectedReq.approver || "Chưa có phê duyệt"}
                    </p>
                  </div>
                </div>

                {selectedReq.notes && (
                  <div className="rounded-lg bg-primary/5 p-3 text-muted-foreground border border-primary/20">
                    <span className="font-bold text-primary">Ghi chú:</span> {selectedReq.notes}
                  </div>
                )}

                {/* Line items table */}
                <div className="space-y-2">
                  <h4 className="font-bold font-heading text-foreground">
                    Danh mục mặt hàng đề xuất ({selectedReq.items.length})
                  </h4>
                  <Card className="border-border/80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã SKU</TableHead>
                          <TableHead>Tên Nguyên Liệu</TableHead>
                          <TableHead className="text-center">ĐVT</TableHead>
                          <TableHead className="text-right">SL Yêu Cầu</TableHead>
                          <TableHead className="text-right">Thành Tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReq.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs font-semibold">
                              {item.ingredientCode}
                            </TableCell>
                            <TableCell className="font-medium text-xs text-foreground">
                              {item.ingredientName}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {item.unit}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                              {item.requested_quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-primary">
                              {item.estimated_cost.toLocaleString("vi-VN")} ₫
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground font-medium">Tổng giá trị định mức:</span>
                  <span className="font-heading font-bold text-base text-foreground">
                    {selectedReq.total_value.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedReq.status === "SUBMITTED" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleOpenReject(selectedReq.id)}
                    >
                      Từ chối yêu cầu
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(selectedReq.id)}
                    >
                      Phê duyệt ngay
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setOpenDetailDialog(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Reject Reason Dialog */}
        <Dialog open={openRejectDialog} onOpenChange={setOpenRejectDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg">Từ Chối Yêu Cầu Cấp Hàng</DialogTitle>
              <DialogDescription>
                Nhập lý do từ chối để hệ thống phản hồi lại bếp chi nhánh.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmReject} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="rejReason">Lý do từ chối</Label>
                <Input
                  id="rejReason"
                  placeholder="VD: Kho trung tâm đang chờ hàng nhập mới"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenRejectDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="destructive">
                  Xác nhận từ chối
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
