"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export const TAB_CHANGE_EVENT = "dica:tab-change";

export interface TabChangeEventDetail {
  pathname: string;
  tab: string;
}

/**
 * Reads the current ?tab= query parameter from window.location.search
 * and listens to browser navigation (popstate) and custom tab change events.
 */
export function useCurrentTab(): string | null {
  const [currentTab, setCurrentTab] = React.useState<string | null>(null);

  React.useEffect(() => {
    const read = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      setCurrentTab(params.get("tab"));
    };

    read();

    const handlePopState = () => read();
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<TabChangeEventDetail>).detail;
      if (detail && typeof detail.tab === "string") {
        setCurrentTab(detail.tab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(TAB_CHANGE_EVENT, handleCustom);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(TAB_CHANGE_EVENT, handleCustom);
    };
  }, []);

  return currentTab;
}

/**
 * Hook to manage active tab state on a page, synchronized with URL query string ?tab=...
 * and with the sidebar's child navigation.
 */
export function useTabSync<T extends string>(
  defaultTab: T,
  validTabs: readonly T[],
  paramName = "tab"
): [T, (tab: T) => void] {
  const pathname = usePathname();

  // Helper to read valid tab from current URL
  const getTabFromUrl = React.useCallback((): T => {
    if (typeof window === "undefined") return defaultTab;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(paramName);
    if (fromUrl && validTabs.includes(fromUrl as T)) {
      return fromUrl as T;
    }
    return defaultTab;
  }, [defaultTab, paramName, validTabs]);

  const [activeTab, setActiveTabState] = React.useState<T>(defaultTab);

  // Sync on mount and when defaultTab or pathname changes
  React.useEffect(() => {
    setActiveTabState(getTabFromUrl());
  }, [getTabFromUrl, pathname]);

  // Listen to popstate and custom tab-change events
  React.useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
    };

    const handleCustomTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<TabChangeEventDetail>;
      if (customEvent.detail) {
        if (customEvent.detail.pathname === window.location.pathname) {
          const newTab = customEvent.detail.tab;
          if (validTabs.includes(newTab as T)) {
            setActiveTabState(newTab as T);
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(TAB_CHANGE_EVENT, handleCustomTabChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(TAB_CHANGE_EVENT, handleCustomTabChange);
    };
  }, [getTabFromUrl, validTabs]);

  // Update tab state, update URL without full page reload, and dispatch event
  const setTab = React.useCallback(
    (newTab: T) => {
      if (!validTabs.includes(newTab)) return;
      setActiveTabState(newTab);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (newTab === defaultTab) {
          url.searchParams.delete(paramName);
        } else {
          url.searchParams.set(paramName, newTab);
        }
        window.history.replaceState(null, "", url.pathname + url.search);

        window.dispatchEvent(
          new CustomEvent<TabChangeEventDetail>(TAB_CHANGE_EVENT, {
            detail: { pathname: window.location.pathname, tab: newTab },
          })
        );
      }
    },
    [defaultTab, paramName, validTabs]
  );

  return [activeTab, setTab];
}
