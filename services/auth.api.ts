import { apiClient, executeApiRequest } from "./api-client";
import type { User, LoginCredentials } from "@/types";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  permissions?: string[];
}

export const DEMO_ACCOUNTS: {
  roleLabel: string;
  user: User;
  credentials: LoginCredentials;
  permissions: string[];
}[] = [
  {
    roleLabel: "Super Admin (Toàn Quyền Quản Trị)",
    credentials: {
      email: "admin@dica.vn",
      password: "password123",
    },
    user: {
      id: "usr-admin-01",
      username: "admin_thang",
      full_name: "Nguyễn Thế Thắng",
      email: "admin@dica.vn",
      kind: "INTERNAL",
      role_name: "SUPER_ADMIN",
      facility_assigned: "WH-BINTAN",
      active: true,
      created_at: "2026-01-01T00:00:00Z",
    },
    permissions: ["*"],
  },
  {
    roleLabel: "Quản Lý Kho Tổng (Central Warehouse)",
    credentials: {
      email: "kho.tong@dica.vn",
      password: "password123",
    },
    user: {
      id: "usr-warehouse-01",
      username: "kho_tong",
      full_name: "Trần Văn Kho",
      email: "kho.tong@dica.vn",
      kind: "INTERNAL",
      role_name: "WAREHOUSE_MANAGER",
      facility_assigned: "WH-BINTAN",
      active: true,
      created_at: "2026-01-15T00:00:00Z",
    },
    permissions: [
      "facility.read",
      "ingredient.read",
      "order.close_outstanding",
      "dispatch.post",
      "receipt.post",
      "stock.read",
    ],
  },
  {
    roleLabel: "Bếp Trưởng Chi Nhánh (Kitchen Head)",
    credentials: {
      email: "bep.truong@dica.vn",
      password: "password123",
    },
    user: {
      id: "usr-chef-01",
      username: "bep_truong",
      full_name: "Lê Văn Bếp",
      email: "bep.truong@dica.vn",
      kind: "INTERNAL",
      role_name: "KITCHEN_HEAD",
      facility_assigned: "BR-Q1",
      active: true,
      created_at: "2026-02-01T00:00:00Z",
    },
    permissions: [
      "request.create",
      "recipe.manage",
      "variance.recalculate",
      "receipt.post",
    ],
  },
  {
    roleLabel: "Đối Tác Cung Ứng (Supplier Partner)",
    credentials: {
      email: "ncc.vinabeef@dica.vn",
      password: "password123",
    },
    user: {
      id: "usr-supplier-01",
      username: "vinabeef_sales",
      full_name: "VinaBeef Supplier",
      email: "ncc.vinabeef@dica.vn",
      kind: "SUPPLIER",
      role_name: "SUPPLIER",
      facility_assigned: undefined,
      active: true,
      created_at: "2026-03-01T00:00:00Z",
    },
    permissions: ["supplier.manage"],
  },
];

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return executeApiRequest<LoginResponse>(
      () =>
        apiClient.post("/auth/login", {
          email: credentials.email,
          password: credentials.password,
        }),
      () => {
        // Mock fallback authentication
        const matched = DEMO_ACCOUNTS.find(
          (acc) =>
            acc.credentials.email.toLowerCase() === credentials.email.toLowerCase() ||
            acc.user.username.toLowerCase() === credentials.email.toLowerCase()
        );

        if (matched) {
          return {
            accessToken: `mock_jwt_token_${matched.user.id}_${Date.now()}`,
            user: matched.user,
            permissions: matched.permissions,
          };
        }

        // Generic fallback for any email/pass in demo mode
        const fallbackUser: User = {
          id: `usr-${Date.now().toString(36)}`,
          username: credentials.email.split("@")[0] || "user",
          full_name: credentials.email.split("@")[0].toUpperCase() || "Nhân viên DICA",
          email: credentials.email,
          kind: "INTERNAL",
          role_name: "STAFF",
          facility_assigned: "BR-Q1",
          active: true,
          created_at: new Date().toISOString(),
        };

        return {
          accessToken: `mock_jwt_token_generic_${Date.now()}`,
          user: fallbackUser,
          permissions: ["ingredient.read", "request.create", "stock.read"],
        };
      }
    );
  },

  logout: async (): Promise<{ success: boolean }> => {
    return executeApiRequest<{ success: boolean }>(
      () => apiClient.post("/auth/logout"),
      () => ({ success: true })
    );
  },

  me: async (): Promise<User> => {
    return executeApiRequest<User>(
      () => apiClient.get("/me"),
      () => DEMO_ACCOUNTS[0].user
    );
  },
};
