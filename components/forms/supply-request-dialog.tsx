"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateRequestMutation } from "@/hooks/use-request-queries";
import { useFacilitiesQuery } from "@/hooks/use-organization-queries";
import { useIngredientsQuery } from "@/hooks/use-catalog-queries";
import { ClipboardPlus, Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const requestItemSchema = z.object({
  ingredientId: z.string().min(1, "Vui lòng chọn nguyên liệu"),
  quantity: z.coerce.number().min(1, "Số lượng tối thiểu là 1"),
  note: z.string().optional(),
});

const supplyRequestSchema = z.object({
  destinationFacilityId: z.string().min(1, "Vui lòng chọn cơ sở nhận hàng"),
  notes: z.string().optional(),
  items: z.array(requestItemSchema).min(1, "Yêu cầu phải có ít nhất 1 mặt hàng"),
});

type SupplyRequestFormData = z.infer<typeof supplyRequestSchema>;

interface SupplyRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedIngredientId?: string;
}

export function SupplyRequestDialog({
  open,
  onOpenChange,
  preselectedIngredientId,
}: SupplyRequestDialogProps) {
  const { mutate: createRequest, isPending } = useCreateRequestMutation();
  const { data: facilities = [] } = useFacilitiesQuery();
  const { data: ingredients = [] } = useIngredientsQuery();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SupplyRequestFormData>({
    resolver: zodResolver(supplyRequestSchema),
    defaultValues: {
      destinationFacilityId: "",
      notes: "",
      items: [
        {
          ingredientId: preselectedIngredientId || "",
          quantity: 10,
          note: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedDestinationId = watch("destinationFacilityId");
  const watchItems = watch("items");

  // Calculate estimated total value live
  const totalEstimatedValue = React.useMemo(() => {
    return watchItems.reduce((acc, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const cost = (ing?.cost_price || 0) * (item.quantity || 0);
      return acc + cost;
    }, 0);
  }, [watchItems, ingredients]);

  const onSubmit = (data: SupplyRequestFormData) => {
    createRequest(
      {
        destinationFacilityId: data.destinationFacilityId,
        items: data.items,
        notes: data.notes,
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Lập Phiếu Yêu Cầu Cấp Hàng</DialogTitle>
              <DialogDescription className="text-xs">
                Đề xuất cung ứng nguyên liệu từ Kho Tổng tới Nhà hàng / Bếp trung tâm
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Destination Facility */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Chi Nhánh / Cơ Sở Tiếp Nhận <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedDestinationId}
              onValueChange={(val) =>
                setValue("destinationFacilityId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn chi nhánh nhận hàng" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((fac) => (
                  <SelectItem key={fac.id} value={fac.id} className="text-xs">
                    {fac.name} ({fac.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destinationFacilityId && (
              <p className="text-[11px] text-destructive">
                {errors.destinationFacilityId.message}
              </p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Danh Sách Mặt Hàng Yêu Cầu ({fields.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  append({
                    ingredientId: "",
                    quantity: 5,
                    note: "",
                  })
                }
              >
                <Plus className="size-3.5" />
                <span>Thêm dòng</span>
              </Button>
            </div>

            <div className="space-y-2.5 rounded-lg border border-border p-3">
              {fields.map((field, index) => {
                const currentIngId = watch(`items.${index}.ingredientId`);
                const matchedIng = ingredients.find((i) => i.id === currentIngId);

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-center bg-card/60 p-2 rounded-md border border-border/60"
                  >
                    {/* Ingredient selection */}
                    <div className="col-span-6">
                      <Select
                        value={currentIngId}
                        onValueChange={(val) =>
                          setValue(`items.${index}.ingredientId`, val, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Chọn nguyên liệu..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem
                              key={ing.id}
                              value={ing.id}
                              className="text-xs"
                            >
                              {ing.name} ({ing.baseUnitSymbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="SL"
                          className="h-8 text-xs font-mono"
                          {...register(`items.${index}.quantity` as const)}
                        />
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {matchedIng?.baseUnitSymbol || "đv"}
                        </span>
                      </div>
                    </div>

                    {/* Subtotal preview */}
                    <div className="col-span-2 text-right">
                      <span className="text-xs font-mono font-medium text-foreground">
                        {formatCurrency(
                          (matchedIng?.cost_price || 0) *
                          (watch(`items.${index}.quantity`) || 0)
                        )}
                      </span>
                    </div>

                    {/* Delete action */}
                    <div className="col-span-1 text-right">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {errors.items && (
                <p className="text-[11px] text-destructive">{errors.items.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="req-notes" className="text-xs font-semibold">
              Ghi Chú Đề Xuất
            </Label>
            <Textarea
              id="req-notes"
              placeholder="VD: Dự trữ cao điểm cuối tuần, bổ sung đột xuất cho tiệc buffet..."
              className="text-xs resize-none h-16"
              {...register("notes")}
            />
          </div>

          {/* Value preview banner */}
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs">
            <span className="text-muted-foreground font-medium">Tổng giá trị dự kiến:</span>
            <span className="font-heading font-bold text-sm text-foreground">
              {formatCurrency(totalEstimatedValue)}
            </span>
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
              <span>Gửi Yêu Cầu Cấp Hàng</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
