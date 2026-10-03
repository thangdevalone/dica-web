import { useAuthStore } from "@/stores/use-auth-store";
import { api } from "./client";
import type { LoginResponse, MeProfile, PermissionGrant } from "./types";

export interface LoginInput {
  organization_code: string;
  username: string;
  password: string;
}

/** Đăng nhập, lưu token rồi nạp hồ sơ + quyền từ `/me` và `/me/permissions`. */
export async function login(input: LoginInput): Promise<MeProfile> {
  const res = await api.post<LoginResponse>("/auth/login", input);
  useAuthStore.getState().setSession({
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    organizationCode: input.organization_code,
  });
  return loadProfile();
}

export async function loadProfile(): Promise<MeProfile> {
  const [me, perms] = await Promise.all([
    api.get<MeProfile>("/me"),
    api.get<{ permissions: string[]; grants: PermissionGrant[] }>("/me/permissions"),
  ]);
  useAuthStore.getState().setProfile(me.data, perms.data.permissions, perms.data.grants);
  return me.data;
}

export async function logout(): Promise<void> {
  try {
    if (useAuthStore.getState().accessToken) await api.post("/auth/logout");
  } catch {
    // Phiên có thể đã hết hạn — vẫn xoá dữ liệu cục bộ.
  } finally {
    useAuthStore.getState().clear();
  }
}
