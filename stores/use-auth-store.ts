import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeFacilityId: string | null;
  permissions: string[];
  login: (user: User, token: string, permissions?: string[]) => void;
  logout: () => void;
  setActiveFacilityId: (facilityId: string | null) => void;
  hasPermission: (permissionCode: string) => boolean;
}

const DEFAULT_ADMIN_USER: User = {
  id: "usr-admin-01",
  username: "admin_thang",
  full_name: "Nguyễn Thế Thắng",
  email: "admin@dica.vn",
  kind: "INTERNAL",
  role_name: "SUPER_ADMIN",
  facility_assigned: "WH-BINTAN",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_ADMIN_USER,
      token: "demo_mock_jwt_token_dica_2026",
      isAuthenticated: true,
      activeFacilityId: null,
      permissions: ["*"], // Super admin has all permissions
      login: (user, token, permissions = ["*"]) =>
        set({
          user,
          token,
          isAuthenticated: true,
          permissions,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeFacilityId: null,
          permissions: [],
        }),
      setActiveFacilityId: (activeFacilityId) => set({ activeFacilityId }),
      hasPermission: (permissionCode) => {
        const { permissions } = get();
        if (permissions.includes("*")) return true;
        return permissions.includes(permissionCode);
      },
    }),
    {
      name: "dica_auth_storage",
    }
  )
);
