"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export interface Option {
  value: string
  label: string
  hint?: string
}

const NONE = "__none__"

interface OptionSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  allLabel?: string
  className?: string
  disabled?: boolean
  id?: string
  /** Bật ô tìm kiếm cho danh sách dài. Mặc định tự bật khi có trên 8 mục. */
  searchable?: boolean
  searchPlaceholder?: string
  searchDelay?: number
  /** Nhận từ khóa đã debounce để tải kết quả từ API. */
  onSearch?: (value: string) => void
  /** API đã lọc options theo từ khóa, không lọc lại ở trình duyệt. */
  serverSearch?: boolean
  loading?: boolean
  emptyText?: string
  /** Giữ đúng nhãn mục đã chọn khi kết quả tìm kiếm từ API thay đổi. */
  selectedOption?: Option
}

function normalizeOptionText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .trim()
}

function SearchableOptionSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  allLabel,
  className,
  disabled,
  id,
  searchPlaceholder = "Tìm kiếm...",
  searchDelay = 350,
  onSearch,
  serverSearch,
  loading,
  emptyText = "Không tìm thấy kết quả phù hợp.",
  selectedOption,
}: OptionSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText)
      onSearch?.(searchText.trim())
    }, searchDelay)
    return () => clearTimeout(handle)
  }, [onSearch, searchDelay, searchText])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchText("")
      setDebouncedSearch("")
      onSearch?.("")
    }
  }

  const selected =
    selectedOption?.value === value
      ? selectedOption
      : options.find((option) => option.value === value)
  const needle = normalizeOptionText(debouncedSearch)
  const visibleOptions =
    serverSearch || !needle
      ? options
      : options.filter((option) =>
          normalizeOptionText(
            `${option.label} ${option.hint ?? ""} ${option.value}`
          ).includes(needle)
        )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between px-2.5 text-xs font-normal",
            className
          )}
        >
          <span
            className={cn(
              "truncate",
              !selected &&
                !(value === "" && allLabel) &&
                "text-muted-foreground"
            )}
          >
            {selected ? (
              <>
                {selected.label}
                {selected.hint && (
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                    {selected.hint}
                  </span>
                )}
              </>
            ) : value === "" && allLabel ? (
              allLabel
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-64 gap-0 p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={searchText}
            onValueChange={setSearchText}
            placeholder={searchPlaceholder}
            className="text-xs"
          />
          <CommandList className="max-h-64">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Đang tìm kiếm...
              </div>
            )}
            {!loading && visibleOptions.length === 0 && !allLabel && (
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </CommandEmpty>
            )}
            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value={NONE}
                  onSelect={() => {
                    onChange("")
                    handleOpenChange(false)
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "size-3.5",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allLabel}
                </CommandItem>
              )}
              {visibleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    handleOpenChange(false)
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "size-3.5",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  {option.hint && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      {option.hint}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Select đơn giản; `value = ""` nghĩa là chưa chọn / tất cả. */
export function OptionSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  allLabel,
  className,
  disabled,
  id,
  searchable,
  ...searchProps
}: OptionSelectProps) {
  if (searchable ?? (options.length > 8 || Boolean(searchProps.onSearch))) {
    return (
      <SearchableOptionSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        allLabel={allLabel}
        className={className}
        disabled={disabled}
        id={id}
        searchable
        {...searchProps}
      />
    )
  }
  return (
    <Select
      value={value === "" ? (allLabel ? NONE : "") : value}
      onValueChange={(next) => onChange(next === NONE ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("h-9 w-full text-xs", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {allLabel && (
          <SelectItem value={NONE} className="text-xs">
            {allLabel}
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            <span className="truncate">{opt.label}</span>
            {opt.hint && (
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                {opt.hint}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  delay = 350,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  delay?: number
}) {
  const [text, setText] = React.useState(value)
  React.useEffect(() => setText(value), [value])
  React.useEffect(() => {
    if (text === value) return
    const handle = setTimeout(() => onChange(text), delay)
    return () => clearTimeout(handle)
  }, [text, value, delay, onChange])
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8 text-xs"
      />
    </div>
  )
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Lưu",
  submitting,
  loading,
  size = "md",
  submitDisabled,
  disabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  onSubmit: () => void
  submitLabel?: string
  submitting?: boolean
  loading?: boolean
  size?: "md" | "lg" | "xl"
  submitDisabled?: boolean
  disabled?: boolean
}) {
  const isSubmitting = submitting ?? loading ?? false
  const isDisabled = submitDisabled ?? disabled ?? isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-4xl"
        )}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pr-14 pb-4">
          <DialogTitle className="font-heading text-base font-bold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault()
            if (!isSubmitting) onSubmit()
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-1 pb-5">
            {children}
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-popover px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={isDisabled}
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Hộp xác nhận, tuỳ chọn bắt buộc nhập lý do (ghi chú). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  destructive,
  variant,
  reason,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  variant?: "default" | "destructive" | string
  /** Cấu hình ô lý do; `required` buộc nhập >= minLength ký tự. */
  reason?: {
    label: string
    required?: boolean
    minLength?: number
    placeholder?: string
  }
  onConfirm: (reason?: string) => void
  loading?: boolean
}) {
  const [text, setText] = React.useState("")
  React.useEffect(() => {
    if (open) setText("")
  }, [open])
  const isDestructive = destructive ?? variant === "destructive"
  const min = reason?.required ? (reason.minLength ?? 3) : 0
  const invalid = reason ? text.trim().length < min : false
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-bold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {reason && (
          <Field
            label={reason.label}
            required={reason.required}
            hint={min ? `Tối thiểu ${min} ký tự.` : undefined}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={reason.placeholder}
              className="min-h-20 text-xs"
            />
          </Field>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            size="sm"
            variant={isDestructive ? "destructive" : "default"}
            className="gap-1.5 text-xs"
            disabled={loading || invalid}
            onClick={() => onConfirm(text.trim())}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
