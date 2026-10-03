/**
 * Common Types & Universal API Response Wrappers
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type SortOrder = "asc" | "desc";

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}
