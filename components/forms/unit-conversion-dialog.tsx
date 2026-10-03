"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateConversionMutation,
  useUnitsQuery,
} from "@/hooks/use-catalog-queries";
import { ArrowRightLeft, Loader2 } from "lucide-react";

const conversionSchema = z
  .object({
    from_unit_id: z.string().min(1, "Vui lòng chọn đơn vị nguồn"),
    to_unit_id: z.string().min(1, "Vui lòng chọn đơn vị đích"),
    factor: z.coerce.number().positive("Hệ số quy đổi phải lớn hơn 0"),
  })
  .refine((data) => data.from_unit_id !== data.to_unit_id, {
    message: "Đơn vị nguồn và đơn vị đích không được trùng nhau",
    path: ["to_unit_id"],
  });

type ConversionFormData = z.infer<typeof conversionSchema>;

interface UnitConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnitConversionDialog({
  open,
  onOpenChange,
}: UnitConversionDialogProps) {
  const { mutate: createConversion, isPending } = useCreateConversionMutation();
  const { data: units = [] } = useUnitsQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConversionFormData>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      from_unit_id: "",
      to_unit_id: "",
      factor: 1,
    },
  });

  const fromUnitId = watch("from_unit_id");
  const toUnitId = watch("to_unit_id");
  const factorValue = watch("factor");

  const fromUnitObj = units.find((u) => u.id === fromUnitId);
  const toUnitObj = units.find((u) => u.id === toUnitId);

  const onSubmit = (data: ConversionFormData) => {
    createConversion(
      {
        from_unit_id: data.from_unit_id,
        fromUnitName: fromUnitObj?.name || "",
        to_unit_id: data.to_unit_id,
        toUnitName: toUnitObj?.name || "",
        factor: data.factor,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thiết Lập Quy Đổi Đơn Vị</DialogTitle>
              <DialogDescription className="text-xs">
                Cấu hình tỷ lệ chuyển đổi giữa đơn vị nhập hàng và đơn vị tiêu hao
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* From unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Đơn Vị Lớn (Nguồn) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={fromUnitId}
                onValueChange={(val) =>
                  setValue("from_unit_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn đơn vị..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.from_unit_id && (
                <p className="text-[11px] text-destructive">
                  {errors.from_unit_id.message}
                </p>
              )}
            </div>

            {/* To unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Đơn Vị Nhỏ (Đích) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={toUnitId}
                onValueChange={(val) =>
                  setValue("to_unit_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn đơn vị..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.to_unit_id && (
                <p className="text-[11px] text-destructive">
                  {errors.to_unit_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Factor */}
          <div className="space-y-1.5">
            <Label htmlFor="conv-factor" className="text-xs font-semibold">
              Hệ Số Chuyển Đổi (Factor) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="conv-factor"
              type="number"
              step="any"
              placeholder="VD: 24 (nghĩa là 1 Thùng = 24 Lon)"
              className="text-xs font-mono"
              {...register("factor")}
            />
            {errors.factor && (
              <p className="text-[11px] text-destructive">{errors.factor.message}</p>
            )}
          </div>

          {/* Equation preview */}
          {fromUnitObj && toUnitObj && factorValue > 0 && (
            <div className="rounded-lg bg-muted/60 p-3 text-center text-xs">
              <span className="text-muted-foreground">Công thức quy đổi: </span>
              <span className="font-bold text-foreground font-mono">
                1 {fromUnitObj.name} ({fromUnitObj.symbol}) = {factorValue} {toUnitObj.name} ({toUnitObj.symbol})
              </span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Lưu Quy Đổi</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
