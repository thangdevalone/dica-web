"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Building2,
  Plus,
  Search,
  Warehouse,
  Flame,
  Store,
  MapPin,
  Calendar,
  CheckCircle2,
  Filter,
  MoreVertical,
  Layers,
  ArrowRight,
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
  type Facility,
  type StockLocation,
  type Department,
  type FacilityType,
  type StockLocationType,
  type DepartmentType,
} from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function OrganizationPage() {
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [locations, setLocations] = React.useState<StockLocation[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);

  // Search & Filters
  const [searchFacility, setSearchFacility] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("ALL");

  // Create Facility Dialog
  const [openFacDialog, setOpenFacDialog] = React.useState(false);
  const [newFacCode, setNewFacCode] = React.useState("");
  const [newFacName, setNewFacName] = React.useState("");
  const [newFacType, setNewFacType] = React.useState<FacilityType>("BRANCH");
  const [newFacAddress, setNewFacAddress] = React.useState("");

  // Create Location Dialog
  const [openLocDialog, setOpenLocDialog] = React.useState(false);
  const [locFacId, setLocFacId] = React.useState("");
  const [locCode, setLocCode] = React.useState("");
  const [locName, setLocName] = React.useState("");
  const [locType, setLocType] = React.useState<StockLocationType>("PHYSICAL");

  // Create Department Dialog
  const [openDepDialog, setOpenDepDialog] = React.useState(false);
  const [depFacId, setDepFacId] = React.useState("");
  const [depCode, setDepCode] = React.useState("");
  const [depName, setDepName] = React.useState("");
  const [depType, setDepType] = React.useState<DepartmentType>("KITCHEN");

  const loadData = () => {
    setFacilities(dicaStore.getFacilities());
    setLocations(dicaStore.getLocations());
    setDepartments(dicaStore.getDepartments());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Filter facilities
  const filteredFacilities = facilities.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(searchFacility.toLowerCase()) ||
      f.code.toLowerCase().includes(searchFacility.toLowerCase()) ||
      (f.address && f.address.toLowerCase().includes(searchFacility.toLowerCase()));
    const matchType = filterType === "ALL" || f.type === filterType;
    return matchSearch && matchType;
  });

  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacCode || !newFacName) {
      toast.error("Vui lòng nhập mã và tên cơ sở!");
      return;
    }

    const newFac: Facility = {
      id: `fac-${Date.now()}`,
      code: newFacCode.trim().toUpperCase(),
      name: newFacName.trim(),
      type: newFacType,
      address: newFacAddress.trim() || "Chưa cập nhật địa chỉ",
      active: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFac, ...facilities];
    setFacilities(updated);
    dicaStore.saveFacilities(updated);

    toast.success(`Đã thêm mới cơ sở ${newFac.name} (${newFac.code})`);
    setOpenFacDialog(false);
    setNewFacCode("");
    setNewFacName("");
    setNewFacAddress("");
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locFacId || !locCode || !locName) {
      toast.error("Vui lòng điền đủ thông tin điểm lưu kho!");
      return;
    }

    const targetFac = facilities.find((f) => f.id === locFacId);

    const newLoc: StockLocation = {
      id: `loc-${Date.now()}`,
      facility_id: locFacId,
      facilityName: targetFac?.name || "Cơ sở",
      code: locCode.trim().toUpperCase(),
      name: locName.trim(),
      type: locType,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLoc, ...locations];
    setLocations(updated);
    dicaStore.saveLocations(updated);

    toast.success(`Đã thêm điểm lưu kho ${newLoc.name}`);
    setOpenLocDialog(false);
    setLocCode("");
    setLocName("");
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depFacId || !depCode || !depName) {
      toast.error("Vui lòng điền đủ thông tin bộ phận!");
      return;
    }

    const targetFac = facilities.find((f) => f.id === depFacId);

    const newDep: Department = {
      id: `dep-${Date.now()}`,
      facility_id: depFacId,
      facilityName: targetFac?.name || "Cơ sở",
      code: depCode.trim().toUpperCase(),
      name: depName.trim(),
      type: depType,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDep, ...departments];
    setDepartments(updated);
    dicaStore.saveDepartments(updated);

    toast.success(`Đã thêm bộ phận ${newDep.name}`);
    setOpenDepDialog(false);
    setDepCode("");
    setDepName("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Cơ Cấu Tổ Chức & Chi Nhánh
            </h1>
            <p className="text-sm text-muted-foreground">
              Thiết lập mạng lưới kho tổng, bếp trung tâm, nhà hàng chi nhánh và phân khu lưu trữ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openFacDialog} onOpenChange={setOpenFacDialog}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 shadow-sm">
                  <Plus className="size-4" />
                  <span>Thêm cơ sở mới</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    Tạo Mới Cơ Sở / Chi Nhánh
                  </DialogTitle>
                  <DialogDescription>
                    Khởi tạo điểm kho hoặc nhà hàng trong chuỗi DICA Group.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFacility} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="code">Mã cơ sở (Code)</Label>
                      <Input
                        id="code"
                        placeholder="VD: BR-Q10-VHA"
                        value={newFacCode}
                        onChange={(e) => setNewFacCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Loại hình</Label>
                      <Select
                        value={newFacType}
                        onValueChange={(val) => setNewFacType(val as FacilityType)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CENTRAL_WAREHOUSE">Kho Trung Tâm</SelectItem>
                          <SelectItem value="CENTRAL_KITCHEN">Bếp Trung Tâm</SelectItem>
                          <SelectItem value="BRANCH">Chi Nhánh Nhà Hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên hiển thị cơ sở</Label>
                    <Input
                      id="name"
                      placeholder="VD: DICA Buffet Lẩu — Vạn Hạnh Mall Q10"
                      value={newFacName}
                      onChange={(e) => setNewFacName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr">Địa chỉ hoạt động</Label>
                    <Input
                      id="addr"
                      placeholder="VD: Tầng 5, 11 Sư Vạn Hạnh, P.12, Q.10, TP.HCM"
                      value={newFacAddress}
                      onChange={(e) => setNewFacAddress(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenFacDialog(false)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit">Lưu cơ sở</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Multi-tier Navigation Tabs */}
        <Tabs defaultValue="facilities" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="facilities" className="gap-2 text-xs">
              <Building2 className="size-4" />
              <span>Cơ sở & Chi nhánh ({facilities.length})</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2 text-xs">
              <Warehouse className="size-4" />
              <span>Điểm lưu kho ({locations.length})</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2 text-xs">
              <Flame className="size-4" />
              <span>Bộ phận nội bộ ({departments.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FACILITIES */}
          <TabsContent value="facilities" className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm cơ sở theo tên, mã hoặc địa chỉ..."
                  className="pl-9 h-9 text-xs"
                  value={searchFacility}
                  onChange={(e) => setSearchFacility(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 w-44 text-xs">
                    <SelectValue placeholder="Tất cả loại hình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả loại hình</SelectItem>
                    <SelectItem value="CENTRAL_WAREHOUSE">Kho Trung Tâm</SelectItem>
                    <SelectItem value="CENTRAL_KITCHEN">Bếp Trung Tâm</SelectItem>
                    <SelectItem value="BRANCH">Chi Nhánh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Facilities Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFacilities.map((fac) => {
                const facLocations = locations.filter((l) => l.facility_id === fac.id);
                const facDepts = departments.filter((d) => d.facility_id === fac.id);

                return (
                  <Card
                    key={fac.id}
                    className="overflow-hidden border-border/80 transition-all hover:border-primary/50 hover:shadow-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold",
                            fac.type === "CENTRAL_WAREHOUSE"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                              : fac.type === "CENTRAL_KITCHEN"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                          )}
                        >
                          {fac.type === "CENTRAL_WAREHOUSE"
                            ? "KHO TRUNG TÂM"
                            : fac.type === "CENTRAL_KITCHEN"
                            ? "BẾP TRUNG TÂM"
                            : "CHI NHÁNH NHÀ HÀNG"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          Active
                        </Badge>
                      </div>
                      <CardTitle className="font-heading text-base font-bold pt-1">
                        {fac.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs text-primary">
                        Mã: {fac.code}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground pb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="leading-relaxed line-clamp-2">{fac.address}</span>
                      </div>
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span>{facLocations.length} Điểm lưu kho</span>
                        <span>{facDepts.length} Bộ phận vận hành</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: LOCATIONS */}
          <TabsContent value="locations" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Quản lý các phân khu vật lý (Kho lạnh, kho mát, kho khô) hoặc khu trung chuyển.
              </p>
              <Dialog open={openLocDialog} onOpenChange={setOpenLocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="size-3.5" />
                    <span>Thêm điểm lưu kho</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-lg">
                      Thêm Mới Điểm Lưu Kho
                    </DialogTitle>
                    <DialogDescription>
                      Gán phân khu lưu kho cho cơ sở hoặc chi nhánh.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateLocation} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="locFac">Cơ sở trực thuộc</Label>
                      <Select value={locFacId} onValueChange={setLocFacId}>
                        <SelectTrigger id="locFac">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="locCode">Mã điểm kho</Label>
                        <Input
                          id="locCode"
                          placeholder="VD: LOC-COLD-01"
                          value={locCode}
                          onChange={(e) => setLocCode(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locType">Loại hình</Label>
                        <Select
                          value={locType}
                          onValueChange={(val) => setLocType(val as StockLocationType)}
                        >
                          <SelectTrigger id="locType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHYSICAL">Vật lý (Kho cố định)</SelectItem>
                            <SelectItem value="IN_TRANSIT">Trung chuyển (In-transit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locName">Tên điểm kho</Label>
                      <Input
                        id="locName"
                        placeholder="VD: Tủ Mát Trữ Thịt Bếp Chính"
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenLocDialog(false)}
                      >
                        Hủy
                      </Button>
                      <Button type="submit">Lưu điểm kho</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Mã Điểm</TableHead>
                    <TableHead>Tên Điểm Lưu Kho</TableHead>
                    <TableHead>Cơ Sở Trực Thuộc</TableHead>
                    <TableHead>Loại Điểm Kho</TableHead>
                    <TableHead className="text-right">Ngày Tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {loc.code}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {loc.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {loc.facilityName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            loc.type === "PHYSICAL"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          )}
                        >
                          {loc.type === "PHYSICAL" ? "Vật lý (Kho cố định)" : "Trung chuyển"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {loc.createdAt.substring(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: DEPARTMENTS */}
          <TabsContent value="departments" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Định nghĩa các phòng ban và tổ vận hành nhận nguyên vật liệu (Bếp nóng, Bếp lạnh, Bar, Kho...).
              </p>
              <Dialog open={openDepDialog} onOpenChange={setOpenDepDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="size-3.5" />
                    <span>Thêm bộ phận</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-lg">
                      Thêm Mới Bộ Phận Vận Hành
                    </DialogTitle>
                    <DialogDescription>
                      Gán tổ làm việc cho cơ sở nhà hàng hoặc bếp trung tâm.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDepartment} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="depFac">Cơ sở trực thuộc</Label>
                      <Select value={depFacId} onValueChange={setDepFacId}>
                        <SelectTrigger id="depFac">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="depCode">Mã bộ phận</Label>
                        <Input
                          id="depCode"
                          placeholder="VD: DEP-HOT-KITCHEN"
                          value={depCode}
                          onChange={(e) => setDepCode(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depType">Loại hình</Label>
                        <Select
                          value={depType}
                          onValueChange={(val) => setDepType(val as DepartmentType)}
                        >
                          <SelectTrigger id="depType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KITCHEN">Bếp Chế Biến</SelectItem>
                            <SelectItem value="TABLE">Bàn Ăn / Phục Vụ</SelectItem>
                            <SelectItem value="WAREHOUSE">Kho Nội Bộ</SelectItem>
                            <SelectItem value="INVENTORY">Kiểm Kê</SelectItem>
                            <SelectItem value="OTHER">Khác (Bar / Thu ngân)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depName">Tên bộ phận</Label>
                      <Input
                        id="depName"
                        placeholder="VD: Bếp Nướng Than & Chảo Nóng"
                        value={depName}
                        onChange={(e) => setDepName(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDepDialog(false)}
                      >
                        Hủy
                      </Button>
                      <Button type="submit">Lưu bộ phận</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Mã Bộ Phận</TableHead>
                    <TableHead>Tên Bộ Phận</TableHead>
                    <TableHead>Cơ Sở Trực Thuộc</TableHead>
                    <TableHead>Loại Hình</TableHead>
                    <TableHead className="text-right">Ngày Tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {dep.code}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {dep.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dep.facilityName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {dep.type === "KITCHEN"
                            ? "Bếp Chế Biến"
                            : dep.type === "TABLE"
                            ? "Khu Phục Vụ"
                            : dep.type === "WAREHOUSE"
                            ? "Kho Phụ"
                            : "Vận Hành Khác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {dep.createdAt.substring(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
