import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Global filter across all tables and dashboards
  selectedFacilityId: string;
  setSelectedFacilityId: (facilityId: string) => void;

  // Search & Global filter
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // Mock Engine Fallback (can be toggled in admin settings)
  mockEngineEnabled: boolean;
  setMockEngineEnabled: (enabled: boolean) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Notifications
  unreadNotifications: number;
  decrementUnread: () => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedFacilityId: "ALL",
      setSelectedFacilityId: (selectedFacilityId) => set({ selectedFacilityId }),

      globalSearch: "",
      setGlobalSearch: (globalSearch) => set({ globalSearch }),

      mockEngineEnabled:
        typeof process !== "undefined"
          ? process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK !== "false"
          : true,
      setMockEngineEnabled: (mockEngineEnabled) => set({ mockEngineEnabled }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      unreadNotifications: 3,
      decrementUnread: () =>
        set((state) => ({
          unreadNotifications: Math.max(0, state.unreadNotifications - 1),
        })),
      markAllNotificationsRead: () => set({ unreadNotifications: 0 }),
    }),
    {
      name: "dica_app_settings",
    }
  )
);
