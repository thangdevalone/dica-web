"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
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
  );
}

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

const NONE = "__none__";

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
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  /** Khi đặt, thêm lựa chọn "tất cả/không chọn" ứng với value rỗng. */
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
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
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">{opt.hint}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  delay = 350,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}) {
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [value]);
  React.useEffect(() => {
    if (text === value) return;
    const handle = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(handle);
  }, [text, value, delay, onChange]);
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
  );
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  loading?: boolean;
  size?: "md" | "lg" | "xl";
  submitDisabled?: boolean;
  disabled?: boolean;
}) {
  const isSubmitting = submitting ?? loading ?? false;
  const isDisabled = submitDisabled ?? disabled ?? isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] gap-4 overflow-y-auto",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-4xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs">{description}</DialogDescription>
          )}
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting) onSubmit();
          }}
        >
          {children}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isDisabled}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  variant?: "default" | "destructive" | string;
  /** Cấu hình ô lý do; `required` buộc nhập >= minLength ký tự. */
  reason?: { label: string; required?: boolean; minLength?: number; placeholder?: string };
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    if (open) setText("");
  }, [open]);
  const isDestructive = destructive ?? (variant === "destructive");
  const min = reason?.required ? (reason.minLength ?? 3) : 0;
  const invalid = reason ? text.trim().length < min : false;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-bold">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        {reason && (
          <Field label={reason.label} required={reason.required} hint={min ? `Tối thiểu ${min} ký tự.` : undefined}>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={reason.placeholder}
              className="min-h-20 text-xs"
            />
          </Field>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
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
  );
}
