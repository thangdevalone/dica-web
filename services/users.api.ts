import { apiClient, executeApiRequest } from "./api-client";
import type { User, Role, Permission } from "@/types";

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    return executeApiRequest(
      () => apiClient.get<User[]>("/users"),
      () => []
    );
  },

  getRoles: async (): Promise<Role[]> => {
    return executeApiRequest(
      () => apiClient.get<Role[]>("/roles"),
      () => []
    );
  },

  getPermissions: async (): Promise<Permission[]> => {
    return executeApiRequest(
      () => apiClient.get<Permission[]>("/permissions"),
      () => []
    );
  },
};
