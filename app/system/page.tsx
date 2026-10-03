"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
  Monitor,
  Check,
  FileCode,
  Sparkles,
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
  const { theme, setTheme } = useTheme();
  const [audits, setAudits] = React.useState<AuditEvent[]>([]);
  const [searchAudit, setSearchAudit] = React.useState("");

  // API Config State
  const [apiUrl, setApiUrl] = React.useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
  );
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
              Cấu Hình Hệ Thống & Kiểm Toán (System)
            </h1>
            <p className="text-sm text-muted-foreground">
              Tùy chỉnh giao diện Sáng / Tối, biến môi trường API (.env), và tra cứu nhật ký kiểm toán Audit.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="appearance" className="gap-2 text-xs">
              <Sparkles className="size-4" />
              <span>Giao Diện (Sáng / Tối)</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 text-xs">
              <Server className="size-4" />
              <span>Kết Nối API & Môi Trường (.env)</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 text-xs">
              <History className="size-4" />
              <span>Nhật Ký Thao Tác (Audit Log)</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2 text-xs">
              <Database className="size-4" />
              <span>Bảo Trì & Dữ Liệu Mẫu</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: THEME & APPEARANCE */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-border max-w-3xl">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>Tùy Chỉnh Chế Độ Hiển Thị (Theme Appearance)</span>
                </CardTitle>
                <CardDescription>
                  Lựa chọn phong cách hiển thị phù hợp. Giao diện tối được thiết kế trên nền đen than chì (Pure Zinc/Obsidian) dịu mắt, không lóa và không màu mè.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Light Option */}
                  <div
                    onClick={() => {
                      setTheme("light");
                      toast.success("Đã kích hoạt Chế độ Sáng (Light Mode)");
                    }}
                    className={cn(
                      "group cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/60",
                      theme === "light"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-white text-foreground shadow-sm">
                        <Sun className="size-4 text-amber-500" />
                      </div>
                      {theme === "light" && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        Chế Độ Sáng (Light)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nền trắng tinh khiết, tương phản cao, phù hợp không gian làm việc ban ngày.
                      </p>
                    </div>
                  </div>

                  {/* Dark Option */}
                  <div
                    onClick={() => {
                      setTheme("dark");
                      toast.success("Đã kích hoạt Chế độ Tối (Dark Mode)");
                    }}
                    className={cn(
                      "group cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/60",
                      theme === "dark"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-white shadow-sm">
                        <Moon className="size-4 text-primary" />
                      </div>
                      {theme === "dark" && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        Chế Độ Tối (Dark)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nền than chì obsidian cao cấp, không bị ám nâu, điểm nhấn ấm dịu chống mỏi mắt.
                      </p>
                    </div>
                  </div>

                  {/* System Auto Option */}
                  <div
                    onClick={() => {
                      setTheme("system");
                      toast.success("Đã đặt theo Cấu hình Hệ thống");
                    }}
                    className={cn(
                      "group cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/60",
                      theme === "system"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                        <Monitor className="size-4" />
                      </div>
                      {theme === "system" && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        Hệ Thống (Auto)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tự động đồng bộ theo cài đặt chế độ sáng/tối của hệ điều hành Windows/macOS.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Chế độ đang áp dụng: <strong className="font-mono text-foreground capitalize">{theme}</strong></span>
                  <span className="text-[11px]">Có thể chuyển nhanh bằng phím tắt <kbd className="font-mono rounded border border-border px-1">D</kbd> hoặc icon ở thanh trên cùng.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: API CONFIG & ENVIRONMENT VARIABLES */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border-border max-w-3xl">
              <CardHeader>
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <FileCode className="size-4 text-primary" />
                  <span>Cấu Hình Biến Môi Trường (.env.local / .env.example)</span>
                </CardTitle>
                <CardDescription>
                  Hệ thống sử dụng các biến môi trường chuẩn Next.js để tránh hardcode địa chỉ API và tham số vận hành.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground space-y-1">
                  <div className="text-muted-foreground"># Cấu hình tại .env.local và .env.example:</div>
                  <div><span className="text-primary font-bold">NEXT_PUBLIC_API_URL</span>={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}</div>
                  <div><span className="text-primary font-bold">NEXT_PUBLIC_APP_NAME</span>="DICA Admin"</div>
                  <div><span className="text-primary font-bold">NEXT_PUBLIC_ENABLE_MOCK_FALLBACK</span>=true</div>
                </div>

                <form onSubmit={handleSaveApiConfig} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">Ghi đè Endpoint API (Runtime Override)</Label>
                    <Input
                      id="apiUrl"
                      placeholder="http://localhost:3000/api/v1"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mặc định đọc từ <code className="font-mono">process.env.NEXT_PUBLIC_API_URL</code> trong <code className="font-mono">.env.local</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">JWT Bearer Access Token (Tùy chọn)</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="Nhập token xác thực..."
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                    />
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
                          ? "Offline Mode (Dự phòng hoạt động an toàn)"
                          : "Đang kiểm tra..."}
                      </p>
                      <p>{healthMessage}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: AUDIT LOG */}
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

            <Card className="border-border">
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

          {/* TAB 4: MAINTENANCE */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="border-border max-w-2xl">
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
                  Bao gồm: 5 Cơ sở chi nhánh, 7 SKU thịt bò & hải sản, 4 nhà cung cấp lớn, các phiếu xin hàng, đơn PO, thẻ kho và biên bản sai lệch.
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

            <Card className="border-border max-w-2xl">
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
                  <span className="font-bold text-foreground">shadcn/ui (Radix Base)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Theme Engine:</span>
                  <span className="font-bold text-foreground">Clean Neutral Zinc & Soft Warm Accent</span>
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
