import { apiClient, executeApiRequest } from "./api-client";
import { dicaStore, type User, type Role, type Permission } from "@/lib/dica-api";

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    return executeApiRequest(
      () => apiClient.get<User[]>("/users"),
      () => dicaStore.getUsers()
    );
  },

  getRoles: async (): Promise<Role[]> => {
    return executeApiRequest(
      () => apiClient.get<Role[]>("/roles"),
      () => dicaStore.getRoles()
    );
  },

  getPermissions: async (): Promise<Permission[]> => {
    return executeApiRequest(
      () => apiClient.get<Permission[]>("/permissions"),
      () => []
    );
  },

  createUser: async (payload: {
    username: string;
    fullName: string;
    email: string;
    roleName: string;
    facilityName: string;
    userKind: "INTERNAL" | "SUPPLIER";
  }): Promise<User> => {
    return executeApiRequest(
      () => apiClient.post<User>("/users", payload),
      () => {
        const current = dicaStore.getUsers();
        const newUser: User = {
          id: `usr-${Date.now()}`,
          username: payload.username,
          full_name: payload.fullName,
          email: payload.email,
          role_name: payload.roleName,
          facility_assigned: payload.facilityName,
          kind: payload.userKind,
          active: true,
          created_at: new Date().toISOString(),
        };
        const updated = [newUser, ...current];
        dicaStore.saveUsers(updated);
        return newUser;
      }
    );
  },

  toggleUserStatus: async (userId: string): Promise<{ success: boolean; active: boolean }> => {
    return executeApiRequest(
      () => apiClient.post(`/users/${userId}/toggle-status`),
      () => {
        const current = dicaStore.getUsers();
        let newStatus = false;
        const updated = current.map((u) => {
          if (u.id === userId) {
            newStatus = !u.active;
            return { ...u, active: newStatus };
          }
          return u;
        });
        dicaStore.saveUsers(updated);
        return { success: true, active: newStatus };
      }
    );
  },
};
