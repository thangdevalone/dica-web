"use client";

import * as React from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage } from "@/lib/api/client";
import type { OffsetMeta } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface Column<T = unknown> {
  key: string;
  header: React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headClassName?: string;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T = unknown> {
  columns: Column<T>[];
  rows?: T[];
  data?: T[];
  rowKey?: (row: T, index?: number) => string;
  loading?: boolean;
  error?: unknown;
  emptyText?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  meta?: OffsetMeta | null;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  toolbar?: React.ReactNode;
  className?: string;
  fetching?: boolean;
}

export function DataTable<T = unknown>({
  columns,
  rows,
  data,
  rowKey,
  loading,
  error,
  emptyText = "Chưa có dữ liệu.",
  emptyMessage,
  onRowClick,
  meta,
  total,
  page,
  pageSize,
  onPageChange,
  toolbar,
  className,
  fetching,
}: DataTableProps<T>) {
  const list = rows ?? data ?? [];
  const noDataText = emptyMessage ?? emptyText;
  const getRowKey = (r: T, idx: number) => {
    if (rowKey) return rowKey(r, idx);
    if (r && typeof r === "object") {
      const candidate = r as { id?: unknown; code?: unknown };
      if (typeof candidate.id === "string") return candidate.id;
      if (typeof candidate.code === "string") return candidate.code;
    }
    return `row-${idx}`;
  };

  const effectiveMeta: OffsetMeta | null | undefined =
    meta !== undefined
      ? meta
      : page !== undefined && total !== undefined
      ? {
          mode: "offset",
          page,
          page_size: pageSize ?? 20,
          total,
          total_pages: Math.ceil(total / (pageSize ?? 20)),
          has_next: page * (pageSize ?? 20) < total,
          has_previous: page > 1,
        }
      : null;

  return (
    <Card className={cn("gap-0 overflow-hidden border-border/80 py-0", className)}>
      {toolbar && (
        <div className="flex flex-col gap-2 border-b border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      )}
      <div className="relative">
        {fetching && !loading && (
          <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-foreground/40" />
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "h-9 text-[11px] font-semibold uppercase tracking-wide",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.headClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center">
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tải dữ liệu...
                  </span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center">
                  <span className="inline-flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="size-4" /> {errorMessage(error)}
                  </span>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center">
                  <span className="inline-flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                    <Inbox className="size-5" />
                    {noDataText}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              list.map((row, index) => (
                <TableRow
                  key={getRowKey(row, index)}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => {
                    const renderCell = col.cell ?? col.render;
                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-xs",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {renderCell ? renderCell(row, index) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {effectiveMeta && onPageChange && <Pager meta={effectiveMeta} onPageChange={onPageChange} />}
    </Card>
  );
}

export function Pager({
  meta,
  onPageChange,
}: {
  meta: OffsetMeta;
  onPageChange: (page: number) => void;
}) {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.page_size + 1;
  const to = Math.min(meta.page * meta.page_size, meta.total);
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2 text-[11px] text-muted-foreground">
      <span>
        {from}–{to} / {meta.total} bản ghi
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!meta.has_previous}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 font-medium text-foreground">
          {meta.page} / {Math.max(meta.total_pages, 1)}
        </span>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!meta.has_next}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/** Ô hai dòng: tiêu đề đậm + phụ đề nhỏ. Hỗ trợ cả { title, sub } lẫn { top, bottom }. */
export function Cell2({
  title,
  sub,
  top,
  bottom,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  top?: React.ReactNode;
  bottom?: React.ReactNode;
}) {
  const primary = title ?? top;
  const secondary = sub ?? bottom;
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{primary}</span>
      {secondary && <span className="truncate text-[11px] text-muted-foreground">{secondary}</span>}
    </div>
  );
}

export function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11px] font-bold text-foreground", className)}>{children}</span>;
}
