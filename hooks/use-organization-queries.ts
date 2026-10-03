import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "@/services/organization.api";
import type { Facility, StockLocation, Department } from "@/types";
import { toast } from "sonner";

export const ORGANIZATION_KEYS = {
  allFacilities: ["facilities"] as const,
  facility: (id: string) => ["facilities", id] as const,
  locations: (facilityId?: string) => ["locations", { facilityId }] as const,
  departments: (facilityId?: string) => ["departments", { facilityId }] as const,
};

export function useFacilitiesQuery() {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.allFacilities,
    queryFn: () => organizationApi.getFacilities(),
  });
}

export function useLocationsQuery(facilityId?: string) {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.locations(facilityId),
    queryFn: () => organizationApi.getLocations(facilityId),
  });
}

export function useDepartmentsQuery(facilityId?: string) {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.departments(facilityId),
    queryFn: () => organizationApi.getDepartments(facilityId),
  });
}

export function useCreateFacilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<Facility, "id" | "createdAt">) =>
      organizationApi.createFacility(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.allFacilities });
      toast.success(`Đã thêm mới cơ sở "${data.name}"`);
    },
    onError: (err: Error) => {
      toast.error(`Thêm cơ sở thất bại: ${err.message}`);
    },
  });
}

export function useUpdateFacilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Facility> }) =>
      organizationApi.updateFacility(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.allFacilities });
      toast.success("Cập nhật thông tin cơ sở thành công");
    },
    onError: (err: Error) => {
      toast.error(`Cập nhật thất bại: ${err.message}`);
    },
  });
}

export function useDeleteFacilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteFacility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.allFacilities });
      toast.success("Đã xóa cơ sở thành công");
    },
    onError: (err: Error) => {
      toast.error(`Xóa cơ sở thất bại: ${err.message}`);
    },
  });
}
