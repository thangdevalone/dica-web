"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Sliders,
  History,
  Server,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
  Code,
  KeyRound,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { dicaStore, type AuditEvent } from "@/lib/dica-api";
import { cn } from "@/lib/utils";

export default function SystemPage() {
  const [audits, setAudits] = React.useState<AuditEvent[]>([]);
  const [searchAudit, setSearchAudit] = React.useState("");

  // API Config State
  const [apiUrl, setApiUrl] = React.useState("http://localhost:3000/api/v1");
  const [apiToken, setApiToken] = React.useState("");
  const [healthStatus, setHealthStatus] = React.useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [healthMessage, setHealthMessage] = React.useState("");

  const loadData = () => {
    setAudits(dicaStore.getAudits());
    setApiUrl(dicaStore.getApiBaseUrl());
    setApiToken(dicaStore.getAuthToken());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredAudits = audits.filter(
    (a) =>
      a.summary.toLowerCase().includes(searchAudit.toLowerCase()) ||
      a.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
      a.performed_by.toLowerCase().includes(searchAudit.toLowerCase())
  );

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    dicaStore.setApiBaseUrl(apiUrl.trim());
    dicaStore.setAuthToken(apiToken.trim());
    toast.success("Đã lưu thông tin cấu hình kết nối API!");
  };

  const handleTestConnection = async () => {
    setHealthStatus("checking");
    setHealthMessage("Đang gửi yêu cầu thăm dò tới API...");

    try {
      const res = await fetch(`${apiUrl}/health/live`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setHealthStatus("ok");
        setHealthMessage("Kết nối thành công! NestJS Backend API đang hoạt động bình thường.");
        toast.success("Kết nối thành công tới Backend API!");
      } else {
        setHealthStatus("fail");
        setHealthMessage(`Máy chủ phản hồi với mã lỗi HTTP: ${res.status}`);
        toast.error(`Máy chủ phản hồi HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      setHealthStatus("fail");
      const errStr = err instanceof Error ? err.message : String(err);
      setHealthMessage(
        `Không thể kết nối tới ${apiUrl}. Backend có thể chưa chạy hoặc bị chặn bởi CORS: ${errStr}`
      );
      toast.info("Backend chưa khởi chạy. Hệ thống đang hoạt động ở chế độ Demo độc lập an toàn.");
    }
  };

  const handleResetData = () => {
    dicaStore.resetAll();
    toast.success("Đã khôi phục toàn bộ dữ liệu mẫu chuẩn DICA.");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Cấu Hình Hệ Thống & Nhật Ký Kiểm Toán (Audit)
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản trị kết nối API NestJS backend, giám sát kiểm toán dữ liệu và sao lưu khôi phục.
            </p>
          </div>
        </div>

        {/* Tabs: Audit Log & API Settings */}
        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="audit" className="gap-2 text-xs">
              <History className="size-4" />
              <span>Nhật Ký Thao Tác (Audit Log)</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 text-xs">
              <Server className="size-4" />
              <span>Cấu Hình Kết Nối API NestJS</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2 text-xs">
              <Database className="size-4" />
              <span>Bảo Trì & Dữ Liệu Mẫu</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AUDIT LOG */}
          <TabsContent value="audit" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm nhật ký theo hành động, người thực hiện..."
                  className="pl-9 h-9 text-xs"
                  value={searchAudit}
                  onChange={(e) => setSearchAudit(e.target.value)}
                />
              </div>
            </div>

            <Card className="border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Thời Gian</TableHead>
                    <TableHead>Hành Động</TableHead>
                    <TableHead>Thực Thể</TableHead>
                    <TableHead>Người Thực Hiện</TableHead>
                    <TableHead>Địa Chỉ IP</TableHead>
                    <TableHead>Tóm Tắt Thay Đổi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((aud) => (
                    <TableRow key={aud.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {aud.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {aud.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {aud.resource}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        <div>{aud.performed_by}</div>
                        <div className="text-[10px] text-muted-foreground">{aud.user_email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {aud.ip_address}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{aud.summary}</div>
                        {aud.changes && (
                          <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-muted/60 p-1.5 font-mono text-[10px] text-foreground">
                            {JSON.stringify(aud.changes, null, 2)}
                          </pre>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: API CONFIG */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border-border/80 max-w-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <Server className="size-4 text-primary" />
                  <span>Cấu Hình Máy Chủ DICA Backend API</span>
                </CardTitle>
                <CardDescription>
                  Thiết lập Endpoint REST API kết nối tới dịch vụ NestJS 12.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveApiConfig} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">API Base URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="http://localhost:3000/api/v1"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mặc định: <code className="font-mono">http://localhost:3000/api/v1</code>. Endpoint Swagger tài liệu API nằm tại <code className="font-mono">/docs</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">JWT Bearer Token (Tùy chọn)</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dùng để xác thực trực tiếp các endpoint cần quyền <code className="font-mono">@ApiBearerAuth()</code>.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button type="submit">Lưu cấu hình</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={healthStatus === "checking"}
                      className="gap-1.5"
                    >
                      <RefreshCw className={cn("size-3.5", healthStatus === "checking" && "animate-spin")} />
                      <span>Kiểm tra kết nối Live</span>
                    </Button>
                  </div>
                </form>

                {/* Health Check Results */}
                {healthStatus !== "idle" && (
                  <div
                    className={cn(
                      "mt-4 rounded-xl border p-3.5 text-xs flex items-start gap-2.5",
                      healthStatus === "ok"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : healthStatus === "fail"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                        : "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300"
                    )}
                  >
                    {healthStatus === "ok" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : healthStatus === "fail" ? (
                      <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    ) : (
                      <RefreshCw className="size-4 shrink-0 animate-spin mt-0.5" />
                    )}
                    <div className="space-y-0.5 leading-relaxed">
                      <p className="font-semibold">
                        {healthStatus === "ok"
                          ? "Trực Tuyến (Online)"
                          : healthStatus === "fail"
                          ? "Không Phản Hồi (Offline Mode Activated)"
                          : "Đang kiểm tra..."}
                      </p>
                      <p>{healthMessage}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MAINTENANCE & DATA RESET */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="border-border/80 max-w-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  <span>Khôi Phục Dữ Liệu Mẫu (Demo Data Reset)</span>
                </CardTitle>
                <CardDescription>
                  Xóa bỏ các dữ liệu thử nghiệm và tải lại toàn bộ cơ sở dữ liệu mẫu chuẩn của DICA Food Group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bao gồm: 5 Cơ sở chi nhánh, 7 SKU thịt bò & hải sản, 4 nhà cung cấp lớn (CP, MeatWorld, Dalat Green), các phiếu xin hàng, đơn PO, thẻ kho và biên bản sai lệch.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleResetData}
                  className="gap-1.5"
                >
                  <Trash2 className="size-4" />
                  <span>Khôi phục về dữ liệu mặc định ban đầu</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 max-w-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <Code className="size-4 text-primary" />
                  <span>Thông Tin Kiến Trúc Hệ Thống (Tech Specs)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground font-mono">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Frontend Framework:</span>
                  <span className="font-bold text-foreground">Next.js 16.3.6 (Turbopack, App Router)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>UI Component Suite:</span>
                  <span className="font-bold text-foreground">shadcn/ui (Radix Base, Vega Preset)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Styling Engine:</span>
                  <span className="font-bold text-foreground">Tailwind CSS v4 + tw-animate-css</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Charts & Visuals:</span>
                  <span className="font-bold text-foreground">Recharts v3.8.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Backend Integration:</span>
                  <span className="font-bold text-foreground">NestJS 12 + Prisma 7 + PostgreSQL</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
