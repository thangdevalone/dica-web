import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/constants/labels";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string | null | undefined;
  label?: string;
  className?: string;
}) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge
      variant={STATUS_VARIANTS[status] ?? "outline"}
      className={cn("text-[10px] font-semibold whitespace-nowrap", className)}
    >
      {label ?? STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/50"
        )}
      />
      {active ? "Hoạt động" : "Ngừng"}
    </span>
  );
}
