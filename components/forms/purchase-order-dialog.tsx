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
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import type { Supplier } from "@/types";

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
  estimatedAmount: z.number().min(1000, "Giá trị đơn hàng tối thiểu 1.000 đ"),
  expectedDeliveryDate: z.string().min(1, "Vui lòng chọn ngày giao hàng dự kiến"),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  onSubmitSuccess?: (values: PurchaseOrderFormValues) => void;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  suppliers,
  onSubmitSuccess,
}: PurchaseOrderDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: "",
      estimatedAmount: 0,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 2)
        .toISOString()
        .slice(0, 10),
    },
  });

  const selectedSupplierId = watch("supplierId");

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      onSubmitSuccess?.(values);
      toast.success("Tạo đơn đặt hàng nhà cung cấp (PO) thành công!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Có lỗi xảy ra khi tạo đơn đặt hàng.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <ShoppingCart className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Tạo Đơn Đặt Hàng Mới (PO)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Gửi yêu cầu cung ứng nguyên vật liệu tới đối tác
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Supplier select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nhà Cung Cấp Đối Tác</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={(val) => setValue("supplierId", val, { shouldValidate: true })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn nhà cung ứng thực phẩm" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && (
              <p className="text-[11px] text-destructive">{errors.supplierId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tổng Giá Trị Dự Kiến (VNĐ)</Label>
            <Input
              type="number"
              placeholder="VD: 15000000"
              className="h-9 text-xs"
              {...register("estimatedAmount", { valueAsNumber: true })}
            />
            {errors.estimatedAmount && (
              <p className="text-[11px] text-destructive">{errors.estimatedAmount.message}</p>
            )}
          </div>

          {/* Expected Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ngày Giao Hàng Dự Kiến</Label>
            <Input
              type="date"
              className="h-9 text-xs"
              {...register("expectedDeliveryDate")}
            />
            {errors.expectedDeliveryDate && (
              <p className="text-[11px] text-destructive">
                {errors.expectedDeliveryDate.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Xác nhận tạo PO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
