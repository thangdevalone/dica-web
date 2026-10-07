"use client"

import { OptionSelect, type Option } from "@/components/shared/form"
import {
  useDepartments,
  useFacilities,
  useIngredients,
  useStockLocations,
  useSuppliers,
  useUnits,
} from "@/hooks/use-lookups"
import { FACILITY_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/constants/labels"

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
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <OptionSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      allLabel={allLabel}
      className={className}
      disabled={disabled}
      searchable
    />
  )
}

interface EntitySelectProps {
  value: string
  onChange: (value: string) => void
  allLabel?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  activeOnly?: boolean
}

export function FacilitySelect(props: EntitySelectProps) {
  const { data = [] } = useFacilities()
  const options = data
    .filter((f) => !props.activeOnly || f.active)
    .map((f) => ({
      value: f.id,
      label: f.name,
      hint: `${f.code} · ${FACILITY_TYPE_LABELS[f.type] ?? f.type}`,
    }))
  return (
    <OptionSelect
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn cơ sở"}
      searchable
      searchPlaceholder="Tìm cơ sở..."
    />
  )
}

export function LocationSelect({
  facilityId,
  physicalOnly,
  ...props
}: EntitySelectProps & { facilityId?: string; physicalOnly?: boolean }) {
  const { data = [] } = useStockLocations(facilityId)
  const options = data
    .filter(
      (l) =>
        (!props.activeOnly || l.active) &&
        (!physicalOnly || l.type === "PHYSICAL")
    )
    .map((l) => ({
      value: l.id,
      label: `${l.name}${l.facility ? ` — ${l.facility.name}` : ""}`,
      hint:
        l.type === "IN_TRANSIT"
          ? `${l.code} · ${LOCATION_TYPE_LABELS.IN_TRANSIT}`
          : l.code,
    }))
  return (
    <Combobox
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn kho"}
      searchPlaceholder="Tìm kho..."
    />
  )
}

export const StockLocationSelect = LocationSelect

export function DepartmentSelect({
  facilityId,
  ...props
}: EntitySelectProps & { facilityId?: string }) {
  const { data = [] } = useDepartments(facilityId)
  const options = data
    .filter((d) => !props.activeOnly || d.active)
    .map((d) => ({
      value: d.id,
      label: `${d.name}${d.facility ? ` — ${d.facility.name}` : ""}`,
      hint: d.code,
    }))
  return (
    <OptionSelect
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn bộ phận"}
      searchable
      searchPlaceholder="Tìm bộ phận..."
    />
  )
}

export function IngredientSelect(props: EntitySelectProps) {
  const { data = [] } = useIngredients()
  const options = data
    .filter((i) => !props.activeOnly || i.active)
    .map((i) => ({
      value: i.id,
      label: i.name,
      hint: `${i.code}${i.baseUnit ? ` · ${i.baseUnit.code}` : ""}`,
    }))
  return (
    <Combobox
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn nguyên liệu"}
      searchPlaceholder="Tìm theo tên hoặc mã..."
    />
  )
}

export function UnitSelect(props: EntitySelectProps) {
  const { data = [] } = useUnits()
  const options = data
    .filter((u) => !props.activeOnly || u.active)
    .map((u) => ({ value: u.id, label: u.name, hint: u.code }))
  return (
    <OptionSelect
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn đơn vị"}
      searchable
      searchPlaceholder="Tìm đơn vị..."
    />
  )
}

export function SupplierSelect(props: EntitySelectProps) {
  const { data = [] } = useSuppliers()
  const options = data
    .filter((s) => !props.activeOnly || s.active)
    .map((s) => ({ value: s.id, label: s.name, hint: s.code }))
  return (
    <OptionSelect
      {...props}
      options={options}
      placeholder={props.placeholder ?? "Chọn nhà cung cấp"}
      searchable
      searchPlaceholder="Tìm nhà cung cấp..."
    />
  )
}
