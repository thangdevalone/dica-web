"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Boxes,
  Lock,
  User as UserIcon,
  Building,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { login } from "@/lib/api/auth";
import { DEFAULT_ORGANIZATION_CODE, errorMessage } from "@/lib/api/client";
import { useHealth } from "@/hooks/use-system";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  organization_code: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập mã tổ chức")
    .max(50, "Mã tổ chức tối đa 50 ký tự"),
  username: z.string().trim().min(3, "Tên đăng nhập tối thiểu 3 ký tự").max(100),
  password: z.string().min(1, "Vui lòng nhập mật khẩu").max(200),
});

type LoginFormData = z.infer<typeof loginSchema>;

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const lastOrganization = useAuthStore((state) => state.organizationCode);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const { data: health } = useHealth();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      organization_code: DEFAULT_ORGANIZATION_CODE,
      username: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (hasHydrated && lastOrganization && !getValues("organization_code")) {
      setValue("organization_code", lastOrganization);
    }
  }, [hasHydrated, lastOrganization, getValues, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const profile = await login({
        organization_code: data.organization_code.toUpperCase(),
        username: data.username,
        password: data.password,
      });
      toast.success(`Xin chào ${profile.display_name}`);
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background px-4 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
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

        <div className="rounded-xl border border-border bg-card/60 p-3 flex items-start gap-2.5 text-xs text-muted-foreground shadow-2xs">
          <ShieldAlert className="size-4 shrink-0 text-foreground mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Hệ thống nội bộ khép kín: </span>
            Tài khoản do Quản trị viên cấp phép tập trung. Không hỗ trợ đăng ký tự do từ bên ngoài.
          </div>
        </div>

        <Card className="rounded-2xl border-border bg-card/90 shadow-sm">
          <CardContent className="p-6 sm:p-7 space-y-5">
            {hasHydrated && accessToken && user && (
              <button
                type="button"
                onClick={() => router.replace("/")}
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-left text-xs transition-colors hover:bg-muted"
              >
                Đang có phiên đăng nhập của{" "}
                <span className="font-semibold text-foreground">{user.display_name}</span> — vào bàn làm
                việc →
              </button>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-org" className="text-xs font-semibold text-foreground">
                  Mã tổ chức
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-org"
                    autoComplete="organization"
                    placeholder="VD: DICA"
                    className="pl-9 text-xs rounded-xl h-10 border-border bg-background uppercase"
                    {...register("organization_code")}
                  />
                </div>
                {errors.organization_code && (
                  <p className="text-[11px] text-destructive">{errors.organization_code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-xs font-semibold text-foreground">
                  Tên đăng nhập
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-username"
                    autoComplete="username"
                    autoFocus
                    placeholder="Tên đăng nhập"
                    className="pl-9 text-xs rounded-xl h-10 border-border bg-background"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-[11px] text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                    Mật khẩu
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Quên mật khẩu? Liên hệ quản trị viên.
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-9 text-xs rounded-xl h-10 border-border bg-background"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>

              {formError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <Button
                id="login-submit"
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
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              health?.status === "ready" ? "bg-emerald-500" : health ? "bg-destructive" : "bg-muted-foreground/50"
            )}
          />
          {health?.status === "ready"
            ? "Máy chủ API sẵn sàng"
            : health
              ? "Không kết nối được máy chủ API"
              : "Đang kiểm tra máy chủ API..."}
          <span>· © 2026 DICA</span>
        </div>
      </div>
    </div>
  );
}
