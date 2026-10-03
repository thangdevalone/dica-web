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
  useCreateIngredientMutation,
  useGroupsQuery,
  useUnitsQuery,
} from "@/hooks/use-catalog-queries";
import { PackagePlus, Loader2 } from "lucide-react";

const ingredientSchema = z.object({
  code: z
    .string()
    .min(3, "Mã SKU tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã SKU chỉ gồm chữ in hoa, số và gạch nối"),
  name: z.string().min(3, "Tên nguyên liệu tối thiểu 3 ký tự"),
  group_id: z.string().min(1, "Vui lòng chọn nhóm nguyên liệu"),
  base_unit_id: z.string().min(1, "Vui lòng chọn đơn vị cơ sở"),
  cost_price: z.coerce.number().min(0, "Giá vốn không được âm"),
  min_stock: z.coerce.number().min(0, "Mức tồn an toàn tối thiểu là 0"),
  max_stock: z.coerce.number().min(1, "Mức tồn tối đa phải lớn hơn 0"),
  shelf_life_days: z.coerce.number().min(1, "Hạn sử dụng tối thiểu 1 ngày"),
  barcode: z.string().optional(),
});

type IngredientFormData = z.infer<typeof ingredientSchema>;

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IngredientFormDialog({ open, onOpenChange }: IngredientFormDialogProps) {
  const { mutate: createIngredient, isPending } = useCreateIngredientMutation();
  const { data: groups = [] } = useGroupsQuery();
  const { data: units = [] } = useUnitsQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      code: "",
      name: "",
      group_id: "",
      base_unit_id: "",
      cost_price: 50000,
      min_stock: 20,
      max_stock: 200,
      shelf_life_days: 30,
      barcode: "",
    },
  });

  const selectedGroupId = watch("group_id");
  const selectedUnitId = watch("base_unit_id");

  const onSubmit = (data: IngredientFormData) => {
    createIngredient(
      {
        code: data.code.toUpperCase(),
        name: data.name,
        group_id: data.group_id,
        base_unit_id: data.base_unit_id,
        cost_price: data.cost_price,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        shelf_life_days: data.shelf_life_days,
        barcode: data.barcode,
        active: true,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackagePlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thêm Mặt Hàng / SKU Nguyên Liệu</DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo thông số kỹ thuật, giá tiêu chuẩn và định mức tồn an toàn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          <div className="grid grid-cols-2 gap-3">
            {/* SKU Code */}
            <div className="space-y-1">
              <Label htmlFor="ing-code" className="text-xs font-semibold">
                Mã SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ing-code"
                placeholder="VD: SKU-BEEF-009"
                className="font-mono text-xs uppercase"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-[10px] text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Barcode */}
            <div className="space-y-1">
              <Label htmlFor="ing-barcode" className="text-xs font-semibold">
                Mã vạch (Barcode)
              </Label>
              <Input
                id="ing-barcode"
                placeholder="VD: 8938001099"
                className="font-mono text-xs"
                {...register("barcode")}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="ing-name" className="text-xs font-semibold">
              Tên Mặt Hàng / Nguyên Liệu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ing-name"
              placeholder="VD: Nạc Vai Bò Úc Cắt Lát 1.5mm"
              className="text-xs"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Group */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Nhóm Danh Mục <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedGroupId}
                onValueChange={(val) =>
                  setValue("group_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.group_id && (
                <p className="text-[10px] text-destructive">{errors.group_id.message}</p>
              )}
            </div>

            {/* Base Unit */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Đơn Vị Cơ Sở <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUnitId}
                onValueChange={(val) =>
                  setValue("base_unit_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.base_unit_id && (
                <p className="text-[10px] text-destructive">{errors.base_unit_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Cost Price */}
            <div className="space-y-1">
              <Label htmlFor="ing-cost" className="text-xs font-semibold">
                Giá Vốn Tiêu Chuẩn (₫)
              </Label>
              <Input
                id="ing-cost"
                type="number"
                className="text-xs font-mono"
                {...register("cost_price")}
              />
              {errors.cost_price && (
                <p className="text-[10px] text-destructive">{errors.cost_price.message}</p>
              )}
            </div>

            {/* Min Stock */}
            <div className="space-y-1">
              <Label htmlFor="ing-min" className="text-xs font-semibold">
                Tồn Tối Thiểu (Min)
              </Label>
              <Input
                id="ing-min"
                type="number"
                className="text-xs font-mono"
                {...register("min_stock")}
              />
            </div>

            {/* Shelf Life */}
            <div className="space-y-1">
              <Label htmlFor="ing-life" className="text-xs font-semibold">
                Hạn Dùng (Ngày)
              </Label>
              <Input
                id="ing-life"
                type="number"
                className="text-xs font-mono"
                {...register("shelf_life_days")}
              />
            </div>
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
            <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Tạo Mặt Hàng</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
