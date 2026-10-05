import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeProfile, PermissionGrant } from "@/lib/api/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  organizationCode: string | null;
  user: MeProfile | null;
  permissions: string[];
  grants: PermissionGrant[];
  /** Tách cache dữ liệu mỗi khi bắt đầu hoặc kết thúc một phiên đăng nhập. */
  sessionEpoch: number;
  hasHydrated: boolean;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    organizationCode?: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setProfile: (user: MeProfile, permissions: string[], grants: PermissionGrant[]) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      organizationCode: null,
      user: null,
      permissions: [],
      grants: [],
      sessionEpoch: 0,
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, organizationCode }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          organizationCode: organizationCode ?? state.organizationCode,
          sessionEpoch: state.sessionEpoch + 1,
        })),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setProfile: (user, permissions, grants) => set({ user, permissions, grants }),
      clear: () =>
        set((state) => ({
          accessToken: null,
          refreshToken: null,
          user: null,
          permissions: [],
          grants: [],
          sessionEpoch: state.sessionEpoch + 1,
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "dica_auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        organizationCode: state.organizationCode,
        user: state.user,
        permissions: state.permissions,
        grants: state.grants,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** True when the current session holds the given permission code. */
export function useCan(permission: string | string[] | undefined): boolean {
  const permissions = useAuthStore((state) => state.permissions);
  if (!permission) return true;
  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((code) => permissions.includes(code));
}

export function useUser() {
  return useAuthStore((state) => state.user);
}

export function hasPermission(permission: string): boolean {
  return useAuthStore.getState().permissions.includes(permission);
}
