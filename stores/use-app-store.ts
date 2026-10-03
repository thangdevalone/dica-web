import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Global facility filter across dashboards and lists ("ALL" = no filter)
  selectedFacilityId: string;
  setSelectedFacilityId: (facilityId: string) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedFacilityId: "ALL",
      setSelectedFacilityId: (selectedFacilityId) => set({ selectedFacilityId }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "dica_app_settings",
    }
  )
);

/** Returns the selected facility id or undefined when "ALL" is selected. */
export function useFacilityFilter(): string | undefined {
  const id = useAppStore((state) => state.selectedFacilityId);
  return id && id !== "ALL" ? id : undefined;
}
