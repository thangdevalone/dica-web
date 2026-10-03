"use client";

import * as React from "react";

/**
 * Trạng thái danh sách phân trang: trang, từ khoá, bộ lọc. Đổi từ khoá/bộ lọc sẽ quay về trang 1.
 */
export function useListState<F extends Record<string, string> = Record<string, string>>(
  init?: F | { initialFilters?: F },
  initialPageSize = 20
) {
  const resolvedFilters = React.useMemo(() => {
    if (init && "initialFilters" in init && typeof init.initialFilters === "object") {
      return (init.initialFilters ?? {}) as F;
    }
    return (init ?? {}) as F;
  }, [init]);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);
  const [search, setSearchState] = React.useState("");
  const [filters, setFilters] = React.useState<F>(resolvedFilters);

  const setSearch = React.useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setFilter = React.useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const reset = React.useCallback(() => {
    setSearchState("");
    setFilters(resolvedFilters);
    setPage(1);
  }, [resolvedFilters]);

  const hasActiveFilters = React.useMemo(() => {
    if (Boolean(search)) return true;
    for (const [k, v] of Object.entries(filters)) {
      if (resolvedFilters[k] !== v && v !== "" && v !== "ALL") return true;
    }
    return false;
  }, [search, filters, resolvedFilters]);

  const params = React.useMemo(
    () => ({ page, page_size: pageSize, ...(search ? { search } : {}), ...filters }),
    [page, pageSize, search, filters]
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    filters,
    setFilter,
    reset,
    hasActiveFilters,
    params,
  };
}
