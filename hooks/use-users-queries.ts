import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/users.api";
import { toast } from "sonner";

export const USER_KEYS = {
  all: ["users"] as const,
  roles: ["roles"] as const,
};

export function useUsersQuery() {
  return useQuery({
    queryKey: USER_KEYS.all,
    queryFn: () => usersApi.getUsers(),
  });
}

export function useRolesQuery() {
  return useQuery({
    queryKey: USER_KEYS.roles,
    queryFn: () => usersApi.getRoles(),
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      username: string;
      fullName: string;
      email: string;
      roleName: string;
      facilityName: string;
      userKind: "INTERNAL" | "SUPPLIER";
    }) => usersApi.createUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.success(`Đã cấp tài khoản thành công cho: ${data.full_name}`);
    },
    onError: (err: Error) => {
      toast.error(`Tạo tài khoản thất bại: ${err.message}`);
    },
  });
}

export function useToggleUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.toggleUserStatus(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      toast.info(data.active ? "Đã kích hoạt lại tài khoản" : "Đã tạm dừng tài khoản");
    },
  });
}
