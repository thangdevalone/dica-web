"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarDays, Check, Clock3, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { cn } from "@/lib/utils"

type PickerMode = "date" | "datetime"

export interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  mode?: PickerMode
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  clearable?: boolean
}

function parseValue(value: string): Date | undefined {
  if (!value) return undefined
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2})?)?/
  )
  if (!match) return undefined
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0)
  )
  return isValid(date) ? date : undefined
}

function serializeValue(date: Date, mode: PickerMode) {
  return format(date, mode === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")
}

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
)
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
)

export function DateTimePicker({
  value,
  onChange,
  mode = "date",
  placeholder,
  disabled,
  min,
  max,
  className,
  clearable = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseValue(value)
  const minDate = parseValue(min ?? "")
  const maxDate = parseValue(max ?? "")
  const calendarDisabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]
  const display = selected
    ? format(selected, mode === "date" ? "dd/MM/yyyy" : "dd/MM/yyyy · HH:mm", {
        locale: vi,
      })
    : null

  const updateDate = (nextDate: Date | undefined) => {
    if (!nextDate) return
    const next = new Date(nextDate)
    if (mode === "datetime") {
      next.setHours(selected?.getHours() ?? new Date().getHours())
      next.setMinutes(selected?.getMinutes() ?? 0, 0, 0)
    }
    onChange(serializeValue(next, mode))
    if (mode === "date") setOpen(false)
  }

  const updateTime = (part: "hour" | "minute", nextValue: string) => {
    const next = selected ? new Date(selected) : new Date()
    next.setSeconds(0, 0)
    if (part === "hour") next.setHours(Number(nextValue))
    else next.setMinutes(Number(nextValue))
    onChange(serializeValue(next, mode))
  }

  const chooseToday = () => {
    const today = new Date()
    if (maxDate && today > maxDate) return updateDate(maxDate)
    if (minDate && today < minDate) return updateDate(minDate)
    updateDate(today)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between px-3 text-xs font-normal",
            !display && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {display ??
              placeholder ??
              (mode === "date" ? "Chọn ngày" : "Chọn ngày và giờ")}
          </span>
          {mode === "date" ? (
            <CalendarDays className="size-4 text-muted-foreground" />
          ) : (
            <Clock3 className="size-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto gap-0 overflow-hidden p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={updateDate}
          disabled={calendarDisabled}
          locale={vi}
          startMonth={new Date(1900, 0, 1)}
          endMonth={new Date(new Date().getFullYear() + 10, 11, 31)}
          defaultMonth={selected ?? maxDate ?? new Date()}
        />

        {mode === "datetime" && (
          <div className="flex items-center gap-2 border-t border-border px-3 py-3">
            <Clock3 className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium">Thời gian</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Select
                value={String(
                  selected?.getHours() ?? new Date().getHours()
                ).padStart(2, "0")}
                onValueChange={(next) => updateTime("hour", next)}
              >
                <SelectTrigger size="sm" className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 min-w-16">
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-semibold text-muted-foreground">:</span>
              <Select
                value={String(selected?.getMinutes() ?? 0).padStart(2, "0")}
                onValueChange={(next) => updateTime("minute", next)}
              >
                <SelectTrigger size="sm" className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 min-w-16">
                  {MINUTES.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={chooseToday}>
            Hôm nay
          </Button>
          <div className="flex items-center gap-1">
            {clearable && value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                <X className="size-3.5" /> Xóa
              </Button>
            )}
            {mode === "datetime" && (
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                <Check className="size-3.5" /> Xong
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
