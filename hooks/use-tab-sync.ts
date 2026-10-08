"use client"

import * as React from "react"

export const TAB_CHANGE_EVENT = "dica:tab-change"

export interface TabChangeEventDetail {
  pathname: string
  tab: string
}

function subscribeToTabChanges(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  window.addEventListener(TAB_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("popstate", onStoreChange)
    window.removeEventListener(TAB_CHANGE_EVENT, onStoreChange)
  }
}

function readTab(paramName: string) {
  return new URLSearchParams(window.location.search).get(paramName)
}

/**
 * Reads the current ?tab= query parameter from window.location.search
 * and listens to browser navigation (popstate) and custom tab change events.
 */
export function useCurrentTab(): string | null {
  return React.useSyncExternalStore(
    subscribeToTabChanges,
    () => readTab("tab"),
    () => null
  )
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
  const getTabFromUrl = React.useCallback((): T => {
    const fromUrl = readTab(paramName)
    if (fromUrl && validTabs.includes(fromUrl as T)) {
      return fromUrl as T
    }
    return defaultTab
  }, [defaultTab, paramName, validTabs])

  const activeTab = React.useSyncExternalStore(
    subscribeToTabChanges,
    getTabFromUrl,
    () => defaultTab
  )

  // Update tab state, update URL without full page reload, and dispatch event
  const setTab = React.useCallback(
    (newTab: T) => {
      if (!validTabs.includes(newTab)) return
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        if (newTab === defaultTab) {
          url.searchParams.delete(paramName)
        } else {
          url.searchParams.set(paramName, newTab)
        }
        window.history.replaceState(null, "", url.pathname + url.search)

        window.dispatchEvent(
          new CustomEvent<TabChangeEventDetail>(TAB_CHANGE_EVENT, {
            detail: { pathname: window.location.pathname, tab: newTab },
          })
        )
      }
    },
    [defaultTab, paramName, validTabs]
  )

  return [activeTab, setTab]
}
