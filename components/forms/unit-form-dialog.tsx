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
import { useDataStore } from "@/stores/use-data-store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Scale, Loader2 } from "lucide-react";
import type { Unit } from "@/types";

const unitSchema = z.object({
  code: z
    .string()
    .min(2, "Mã đơn vị tối thiểu 2 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ gồm chữ in hoa và số"),
  name: z.string().min(2, "Tên đơn vị tối thiểu 2 ký tự"),
  symbol: z.string().min(1, "Ký hiệu hiển thị tối thiểu 1 ký tự"),
  description: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnitFormDialog({ open, onOpenChange }: UnitFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      description: "",
    },
  });

  const onSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    try {
      const newUnit: Unit = {
        id: `u-${Date.now()}`,
        code: data.code.toUpperCase(),
        name: data.name,
        symbol: data.symbol,
        description: data.description,
      };

      const currentUnits = useDataStore.getState().units;
      useDataStore.setState({ units: [...currentUnits, newUnit] });
      queryClient.invalidateQueries({ queryKey: ["units"] });

      toast.success(`Đã thêm đơn vị tính "${newUnit.name} (${newUnit.symbol})"`);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(`Thêm đơn vị thất bại: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thêm Đơn Vị Đo Lường Mới</DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo đơn vị khối lượng, thể tích hoặc quy cách bao bì đóng gói
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="u-code" className="text-xs font-semibold">
              Mã Đơn Vị (Code) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="u-code"
              placeholder="VD: KG, GRAM, BOTTLE, BOX..."
              className="font-mono text-xs uppercase"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-[11px] text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="u-name" className="text-xs font-semibold">
                Tên Đơn Vị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="u-name"
                placeholder="VD: Kilogram, Chai, Thùng..."
                className="text-xs"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Symbol */}
            <div className="space-y-1.5">
              <Label htmlFor="u-symbol" className="text-xs font-semibold">
                Ký Hiệu Hiển Thị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="u-symbol"
                placeholder="VD: kg, g, chai, thùng..."
                className="text-xs font-mono"
                {...register("symbol")}
              />
              {errors.symbol && (
                <p className="text-[11px] text-destructive">{errors.symbol.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="u-desc" className="text-xs font-semibold">
              Mô Tả Ý Nghĩa
            </Label>
            <Input
              id="u-desc"
              placeholder="VD: Dùng cho định lượng xuất kho hoặc đồ uống"
              className="text-xs"
              {...register("description")}
            />
          </div>

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
            <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Lưu Đơn Vị</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
