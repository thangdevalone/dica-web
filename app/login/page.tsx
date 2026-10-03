"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Boxes,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { authApi, DEMO_ACCOUNTS } from "@/services/auth.api";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@dica.vn",
      password: "password123",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: data.email,
        password: data.password,
      });

      login(res.user, res.accessToken, res.permissions || ["*"]);
      toast.success(`Đăng nhập thành công: ${res.user.full_name}`, {
        description: `Vai trò: ${res.user.role_name} (${res.user.kind})`,
      });

      router.push("/");
    } catch {
      toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    setValue("email", demo.credentials.email);
    setValue("password", demo.credentials.password);
    toast.info(`Đã chọn tài khoản: ${demo.roleLabel}`);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 select-none">
      {/* Subtle background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-foreground text-background shadow-sm">
            <Boxes className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              DICA SCM
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
              Hệ thống Quản trị Chuỗi Cung Ứng & Tồn Kho F&B
            </p>
          </div>
        </div>

        {/* Security Notice Alert */}
        <div className="rounded-xl border border-border bg-card/60 p-3 flex items-start gap-2.5 text-xs text-muted-foreground shadow-2xs">
          <ShieldAlert className="size-4 shrink-0 text-foreground mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Hệ thống nội bộ khép kín: </span>
            Tài khoản do Quản trị viên cấp phép tập trung. Không hỗ trợ đăng ký tự do từ bên ngoài.
          </div>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border-border bg-card/90 shadow-sm">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email / Username field */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                  Email hoặc Tên đăng nhập
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="admin@dica.vn"
                    className="pl-9 text-xs rounded-xl h-10 border-border bg-background"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-semibold text-foreground"
                  >
                    Mật khẩu
                  </Label>
                  <span
                    onClick={() =>
                      toast.info(
                        "Quên mật khẩu? Vui lòng liên hệ Quản trị viên hệ thống (Admin) để cấp lại mã pin."
                      )
                    }
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Quên mật khẩu?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 text-xs rounded-xl h-10 border-border bg-background"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Remember checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="rounded border-border accent-foreground size-3.5"
                  {...register("rememberMe")}
                />
                <Label
                  htmlFor="remember-me"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Ghi nhớ phiên đăng nhập trên thiết bị này
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-xs shadow-xs transition-colors gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-[10px] font-semibold tracking-wider text-muted-foreground">
                  Hoặc chọn tài khoản mẫu (Demo)
                </span>
              </div>
            </div>

            {/* Quick 1-Click Demo Accounts */}
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.user.id}
                  type="button"
                  onClick={() => handleSelectDemoAccount(demo)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-muted/70 transition-all text-left text-xs group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-semibold text-foreground group-hover:underline truncate">
                      {demo.roleLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate">
                      {demo.credentials.email}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-semibold border-border bg-muted/60 text-foreground group-hover:bg-foreground group-hover:text-background transition-colors"
                  >
                    Chọn
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            © 2026 DICA Enterprise Supply Chain Platform. Bảo mật chuẩn RBAC.
          </p>
          {isAuthenticated && user && (
            <p className="text-[11px] text-muted-foreground">
              Đang có phiên đăng nhập:{" "}
              <span
                onClick={() => router.push("/")}
                className="font-semibold text-foreground underline cursor-pointer"
              >
                Vào Dashboard ngay ({user.full_name})
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
