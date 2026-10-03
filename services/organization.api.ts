import { apiClient, executeApiRequest } from "./api-client";
import { useDataStore } from "@/stores/use-data-store";
import type { Facility, StockLocation, Department } from "@/types";

export const organizationApi = {
  // Facilities
  getFacilities: async (): Promise<Facility[]> => {
    return executeApiRequest(
      () => apiClient.get<Facility[]>("/facilities"),
      () => useDataStore.getState().facilities
    );
  },

  getFacilityById: async (id: string): Promise<Facility | undefined> => {
    return executeApiRequest(
      () => apiClient.get<Facility>(`/facilities/${id}`),
      () => useDataStore.getState().facilities.find((f) => f.id === id)
    );
  },

  createFacility: async (
    payload: Omit<Facility, "id" | "createdAt">
  ): Promise<Facility> => {
    return executeApiRequest(
      () => apiClient.post<Facility>("/facilities", payload),
      () => useDataStore.getState().addFacility(payload)
    );
  },

  updateFacility: async (
    id: string,
    payload: Partial<Facility>
  ): Promise<Facility> => {
    return executeApiRequest(
      () => apiClient.patch<Facility>(`/facilities/${id}`, payload),
      () => {
        useDataStore.getState().updateFacility(id, payload);
        return useDataStore.getState().facilities.find((f) => f.id === id)!;
      }
    );
  },

  deleteFacility: async (id: string): Promise<{ success: boolean }> => {
    return executeApiRequest(
      () => apiClient.delete(`/facilities/${id}`),
      () => {
        useDataStore.getState().deleteFacility(id);
        return { success: true };
      }
    );
  },

  // Stock Locations
  getLocations: async (facilityId?: string): Promise<StockLocation[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<StockLocation[]>("/stock-locations", {
          params: facilityId ? { facilityId } : undefined,
        }),
      () => {
        const locs = useDataStore.getState().locations;
        return facilityId
          ? locs.filter((l) => l.facility_id === facilityId)
          : locs;
      }
    );
  },

  createLocation: async (
    payload: Omit<StockLocation, "id" | "createdAt">
  ): Promise<StockLocation> => {
    return executeApiRequest(
      () => apiClient.post<StockLocation>("/stock-locations", payload),
      () => useDataStore.getState().addLocation(payload)
    );
  },

  // Departments
  getDepartments: async (facilityId?: string): Promise<Department[]> => {
    return executeApiRequest(
      () =>
        apiClient.get<Department[]>("/departments", {
          params: facilityId ? { facilityId } : undefined,
        }),
      () => {
        const deps = useDataStore.getState().departments;
        return facilityId
          ? deps.filter((d) => d.facility_id === facilityId)
          : deps;
      }
    );
  },
};
