"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, ShieldCheck, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Field } from "@/components/shared/form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { MeProfile } from "@/lib/api/types";
import { useAuthStore, useUser } from "@/stores/use-auth-store";

function ProfileForms({ user }: { user: MeProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = React.useState(user.display_name ?? "");
  const [identityNumber, setIdentityNumber] = React.useState(user.identity_number ?? "");
  const [dateOfBirth, setDateOfBirth] = React.useState(user.date_of_birth ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [email, setEmail] = React.useState(user.email ?? "");
  const [address, setAddress] = React.useState(user.address ?? "");
  const [username, setUsername] = React.useState(user.username);
  const [usernamePassword, setUsernamePassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const profile = useApiMutation<void, MeProfile>({
    mutationFn: () =>
      api.patch<MeProfile>("/me/profile", {
        display_name: displayName,
        identity_number: identityNumber,
        date_of_birth: dateOfBirth,
        phone,
        email,
        address,
      }),
    invalidate: ["/me"],
    successMessage: "Đã lưu thông tin cá nhân.",
    onSuccess: (data) => {
      const state = useAuthStore.getState();
      state.setProfile(data, state.permissions, state.grants);
      setDisplayName(data.display_name ?? "");
      setIdentityNumber(data.identity_number ?? "");
      setDateOfBirth(data.date_of_birth ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setAddress(data.address ?? "");
    },
  });

  const finishSensitiveChange = (message: string) => {
    useAuthStore.getState().clear();
    queryClient.clear();
    toast.success(message);
    router.replace("/login");
  };

  const account = useMutation({
    mutationFn: () =>
      api.patch<{ username: string; sessions_revoked: number }>("/me/account", {
        username,
        current_password: usernamePassword,
      }),
    onSuccess: () => finishSensitiveChange("Đã đổi tên đăng nhập. Vui lòng đăng nhập lại."),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const password = useMutation({
    mutationFn: () =>
      api.post<{ sessions_revoked: number }>("/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => finishSensitiveChange("Đã đổi mật khẩu. Vui lòng đăng nhập lại."),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const [today] = React.useState(() => new Date().toISOString().slice(0, 10));
  const usernameValid =
    username.trim().length >= 3 &&
    /^[a-zA-Z0-9._-]+$/.test(username.trim()) &&
    usernamePassword.length > 0 &&
    username.trim().toLowerCase() !== user.username;
  const passwordValid =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="xl:row-span-2">
        <CardHeader>
          <CardTitle>Thông tin nhân viên</CardTitle>
          <CardDescription>Tất cả trường dưới đây đều không bắt buộc.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              profile.mutate();
            }}
          >
            <Field label="Họ và tên">
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={200} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CCCD/CMND" hint="9-12 chữ số">
                <Input
                  inputMode="numeric"
                  value={identityNumber}
                  onChange={(event) => setIdentityNumber(event.target.value.replace(/\D/g, "").slice(0, 12))}
                />
              </Field>
              <Field label="Ngày sinh">
                <Input
                  type="date"
                  max={today}
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số điện thoại">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} />
              </Field>
            </div>
            <Field label="Địa chỉ">
              <Textarea value={address} onChange={(event) => setAddress(event.target.value)} maxLength={500} />
            </Field>
            <Button type="submit" disabled={profile.isPending}>
              <Save className="mr-2 size-4" />
              {profile.isPending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi tên đăng nhập</CardTitle>
          <CardDescription>Phiên đăng nhập hiện tại sẽ kết thúc sau khi đổi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              account.mutate();
            }}
          >
            <Field label="Tên đăng nhập mới" required hint="Chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang">
              <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </Field>
            <Field label="Mật khẩu hiện tại" required>
              <Input
                type="password"
                value={usernamePassword}
                onChange={(event) => setUsernamePassword(event.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" variant="outline" disabled={!usernameValid || account.isPending}>
              <UserCircle className="mr-2 size-4" />
              {account.isPending ? "Đang đổi..." : "Đổi tên đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Mật khẩu mới cần ít nhất 8 ký tự.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (newPassword !== confirmPassword) {
                toast.error("Mật khẩu xác nhận chưa khớp.");
                return;
              }
              password.mutate();
            }}
          >
            <Field label="Mật khẩu hiện tại" required>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="Mật khẩu mới" required>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Xác nhận mật khẩu mới" required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Mật khẩu xác nhận chưa khớp.</p>
            )}
            <Button type="submit" variant="outline" disabled={!passwordValid || password.isPending}>
              <KeyRound className="mr-2 size-4" />
              {password.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const user = useUser();
  return (
    <AdminLayout>
      <PageHeader
        title="Hồ sơ của tôi"
        description="Cập nhật thông tin cá nhân, tên đăng nhập và mật khẩu."
        icon={ShieldCheck}
      />
      <div className="p-6">{user && <ProfileForms key={user.id} user={user} />}</div>
    </AdminLayout>
  );
}
