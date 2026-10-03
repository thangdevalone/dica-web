"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OptionSelect, type Option } from "@/components/shared/form";
import {
  useDepartments,
  useFacilities,
  useIngredients,
  useStockLocations,
  useSuppliers,
  useUnits,
} from "@/hooks/use-lookups";
import { FACILITY_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/constants/labels";
import { cn } from "@/lib/utils";

/** Combobox có ô tìm kiếm cho danh sách dài. */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm...",
  allLabel,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((opt) => opt.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("h-9 w-full justify-between px-2.5 text-xs font-normal", className)}
        >
          <span className={cn("truncate", !selected && !allLabel && "text-muted-foreground")}>
            {selected ? (
              <>
                {selected.label}
                {selected.hint && (
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">{selected.hint}</span>
                )}
              </>
            ) : value === "" && allLabel ? (
              allLabel
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-xs" />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
              Không tìm thấy.
            </CommandEmpty>
            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value={`__all__ ${allLabel}`}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check className={cn("size-3.5", value === "" ? "opacity-100" : "opacity-0")} />
                  {allLabel}
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.hint ?? ""} ${opt.value}`}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check className={cn("size-3.5", value === opt.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{opt.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface EntitySelectProps {
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  activeOnly?: boolean;
}

export function FacilitySelect(props: EntitySelectProps) {
  const { data = [] } = useFacilities();
  const options = data
    .filter((f) => !props.activeOnly || f.active)
    .map((f) => ({ value: f.id, label: f.name, hint: `${f.code} · ${FACILITY_TYPE_LABELS[f.type] ?? f.type}` }));
  return <OptionSelect {...props} options={options} placeholder={props.placeholder ?? "Chọn cơ sở"} />;
}

export function LocationSelect({
  facilityId,
  physicalOnly,
  ...props
}: EntitySelectProps & { facilityId?: string; physicalOnly?: boolean }) {
  const { data = [] } = useStockLocations(facilityId);
  const options = data
    .filter((l) => (!props.activeOnly || l.active) && (!physicalOnly || l.type === "PHYSICAL"))
    .map((l) => ({
      value: l.id,
      label: `${l.name}${l.facility ? ` — ${l.facility.name}` : ""}`,
      hint: l.type === "IN_TRANSIT" ? `${l.code} · ${LOCATION_TYPE_LABELS.IN_TRANSIT}` : l.code,
    }));
  return <Combobox {...props} options={options} placeholder={props.placeholder ?? "Chọn kho"} searchPlaceholder="Tìm kho..." />;
}

export const StockLocationSelect = LocationSelect;

export function DepartmentSelect({ facilityId, ...props }: EntitySelectProps & { facilityId?: string }) {
  const { data = [] } = useDepartments(facilityId);
  const options = data
    .filter((d) => !props.activeOnly || d.active)
    .map((d) => ({
      value: d.id,
      label: `${d.name}${d.facility ? ` — ${d.facility.name}` : ""}`,
      hint: d.code,
    }));
  return <OptionSelect {...props} options={options} placeholder={props.placeholder ?? "Chọn bộ phận"} />;
}

export function IngredientSelect(props: EntitySelectProps) {
  const { data = [] } = useIngredients();
  const options = data
    .filter((i) => !props.activeOnly || i.active)
    .map((i) => ({ value: i.id, label: i.name, hint: `${i.code}${i.baseUnit ? ` · ${i.baseUnit.code}` : ""}` }));
  return (
    <Combobox
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn nguyên liệu"}
      searchPlaceholder="Tìm theo tên hoặc mã..."
    />
  );
}

export function UnitSelect(props: EntitySelectProps) {
  const { data = [] } = useUnits();
  const options = data
    .filter((u) => !props.activeOnly || u.active)
    .map((u) => ({ value: u.id, label: u.name, hint: u.code }));
  return <OptionSelect {...props} options={options} placeholder={props.placeholder ?? "Chọn đơn vị"} />;
}

export function SupplierSelect(props: EntitySelectProps) {
  const { data = [] } = useSuppliers();
  const options = data
    .filter((s) => !props.activeOnly || s.active)
    .map((s) => ({ value: s.id, label: s.name, hint: s.code }));
  return <OptionSelect {...props} options={options} placeholder={props.placeholder ?? "Chọn nhà cung cấp"} />;
}
