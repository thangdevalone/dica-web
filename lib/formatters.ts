/**
 * High-performance, cached localization & formatters for DICA Web
 * 
 * Pre-instantiates Intl formatters to avoid expensive allocations in render loops.
 */

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "decimal",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric amount to Vietnamese Dong with symbol (e.g., "15.000.000 ₫")
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "0 ₫";
  }
  return `${currencyFormatter.format(amount)} ₫`;
}

/**
 * Formats a number with Vietnamese locale grouping (e.g., "1.234,56")
 */
export function formatNumber(value: number | null | undefined, fallback = "0"): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return numberFormatter.format(value);
}

/**
 * Formats a fraction or ratio as a percentage (e.g., 0.125 -> "12,5%")
 */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) {
    return "0%";
  }
  return percentFormatter.format(ratio);
}

/**
 * Formats a date string or object to DD/MM/YYYY
 */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (!input) return "";
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return String(input);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(input);
  }
}

/**
 * Formats a date string or object to HH:mm DD/MM/YYYY
 */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return "";
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return String(input);
    return `${d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })} ${d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;
  } catch {
    return String(input);
  }
}
