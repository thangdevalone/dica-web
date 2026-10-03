/** Tiện ích số học cho giá trị Decimal (chuỗi) từ backend. */

export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const qtyFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const moneyFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatQty(value: string | number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = qtyFormatter.format(num(value));
  return unit ? `${text} ${unit}` : text;
}

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${moneyFormatter.format(num(value))} ₫`;
}

export function formatCompact(value: string | number | null | undefined): string {
  return compactFormatter.format(num(value));
}

/** Chuẩn hoá chuỗi số lượng gửi lên backend (tối đa 3 chữ số thập phân). */
export function toQuantityString(value: string | number): string {
  const n = num(String(value).replace(",", "."));
  return String(Math.round(n * 1000) / 1000);
}

export const QUANTITY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;
