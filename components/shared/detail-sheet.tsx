"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** Khung chi tiết chứng từ dạng sheet bên phải, có vùng nội dung cuộn và thanh thao tác. */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  badge,
  loading,
  error,
  footer,
  children,
  wide,
  width,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
  error?: unknown;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
  width?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={width ? { maxWidth: width } : undefined}
        className={cn(
          "w-full gap-0 p-0 data-[side=right]:w-full",
          wide ? "data-[side=right]:sm:max-w-4xl" : "data-[side=right]:sm:max-w-2xl"
        )}
      >
        <SheetHeader className="border-b border-border/70 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-heading text-base font-bold">{title}</SheetTitle>
            {badge}
          </div>
          {description && <SheetDescription className="text-xs">{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang tải chi tiết...
            </div>
          ) : error ? (
            <div className="flex h-40 items-center justify-center gap-2 text-xs text-destructive">
              <AlertTriangle className="size-4" /> {errorMessage(error)}
            </div>
          ) : (
            children
          )}
        </div>
        {footer && !loading && !error && (
          <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border/70">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Lưới nhãn – giá trị cho phần thông tin chung. */
export function InfoGrid({
  items,
  columns = 2,
}: {
  items: { label: string; value: React.ReactNode; hidden?: boolean }[];
  columns?: 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3 rounded-xl border border-border/70 bg-muted/20 p-3",
        columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
      )}
    >
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="mt-0.5 truncate text-xs font-medium text-foreground">{item.value ?? "—"}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Tiêu đề nhóm nội dung trong sheet chi tiết. */
export function Section({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-xs font-bold tracking-wide text-foreground uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Bảng nhỏ gọn dùng trong sheet chi tiết. */
export function MiniTable({
  headers,
  rows,
  empty = "Không có dòng nào.",
}: {
  headers: { label: string; className?: string }[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full text-xs">
        <thead className="bg-muted/30">
          <tr>
            {headers.map((h) => (
              <th
                key={h.label}
                className={cn(
                  "px-3 py-2 text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase",
                  h.className
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-6 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((cells, i) => (
              <tr key={i} className="border-t border-border/60">
                {cells.map((cell, j) => (
                  <td key={j} className={cn("px-3 py-2 align-top", headers[j]?.className)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
