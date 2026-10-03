"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Building2,
  Plus,
  Search,
  Warehouse,
  Flame,
  MapPin,
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
import {
  FacilityFormDialog,
  LocationFormDialog,
  DepartmentFormDialog,
} from "@/components/forms";
import {
  useFacilitiesQuery,
  useLocationsQuery,
  useDepartmentsQuery,
} from "@/hooks";

export default function OrganizationPage() {
  // TanStack Query Hooks
  const {
    data: facilities = [],
    refetch: refetchFacilities,
    isLoading: isLoadingFac,
  } = useFacilitiesQuery();
  const { data: locations = [], refetch: refetchLocations } = useLocationsQuery();
  const { data: departments = [], refetch: refetchDepartments } = useDepartmentsQuery();

  // Search & Filters
  const [searchFacility, setSearchFacility] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("ALL");

  // Form Dialog States
  const [openFacDialog, setOpenFacDialog] = React.useState(false);
  const [openLocDialog, setOpenLocDialog] = React.useState(false);
  const [openDepDialog, setOpenDepDialog] = React.useState(false);

  const handleRefresh = () => {
    refetchFacilities();
    refetchLocations();
    refetchDepartments();
  };

  // Filter facilities
  const filteredFacilities = React.useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchFacility.toLowerCase()) ||
        f.code.toLowerCase().includes(searchFacility.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(searchFacility.toLowerCase()));
      const matchType = filterType === "ALL" || f.type === filterType;
      return matchSearch && matchType;
    });
  }, [facilities, searchFacility, filterType]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Cơ Cấu Tổ Chức & Chi Nhánh
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Thiết lập mạng lưới kho tổng, bếp trung tâm, nhà hàng chi nhánh và phân khu lưu trữ.
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
              onClick={() => setOpenFacDialog(true)}
            >
              <Plus className="size-3.5" />
              <span>Thêm cơ sở mới</span>
            </Button>
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
                          Hoạt động
                        </span>
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
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setOpenLocDialog(true)}
              >
                <Plus className="size-3.5" />
                <span>Thêm điểm lưu kho</span>
              </Button>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px] text-xs">Mã Điểm</TableHead>
                    <TableHead className="text-xs">Tên Điểm Lưu Kho</TableHead>
                    <TableHead className="text-xs">Cơ Sở Trực Thuộc</TableHead>
                    <TableHead className="text-xs">Loại Điểm Kho</TableHead>
                    <TableHead className="text-right text-xs">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {loc.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{loc.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {loc.facilityName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {loc.type === "PHYSICAL" ? "Lưu Trữ Vật Lý" : "Trung Chuyển"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Khả dụng
                        </span>
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
                Định nghĩa các điểm phục vụ (Bếp, Quầy Bar, Bàn ăn) tiếp nhận và xuất tiêu hao nguyên liệu.
              </p>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setOpenDepDialog(true)}
              >
                <Plus className="size-3.5" />
                <span>Thêm bộ phận</span>
              </Button>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px] text-xs">Mã Bộ Phận</TableHead>
                    <TableHead className="text-xs">Tên Bộ Phận</TableHead>
                    <TableHead className="text-xs">Cơ Sở Trực Thuộc</TableHead>
                    <TableHead className="text-xs">Phân Loại</TableHead>
                    <TableHead className="text-right text-xs">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {dep.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{dep.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dep.facilityName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {dep.type === "KITCHEN"
                            ? "Bếp Chế Biến"
                            : dep.type === "WAREHOUSE"
                            ? "Kho Phụ"
                            : "Quầy Bar / Khác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Đang vận hành
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modular Form Dialogs (react-hook-form + zod) */}
        <FacilityFormDialog
          open={openFacDialog}
          onOpenChange={setOpenFacDialog}
        />
        <LocationFormDialog
          open={openLocDialog}
          onOpenChange={setOpenLocDialog}
        />
        <DepartmentFormDialog
          open={openDepDialog}
          onOpenChange={setOpenDepDialog}
        />
      </div>
    </AdminLayout>
  );
}
