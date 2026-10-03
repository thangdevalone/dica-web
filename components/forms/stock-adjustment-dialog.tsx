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
import { Textarea } from "@/components/ui/textarea";
import { useAdjustStockMutation } from "@/hooks/use-inventory-queries";
import type { StockBalance } from "@/types";
import { SlidersHorizontal, Loader2 } from "lucide-react";

const adjustmentSchema = z.object({
  newQuantity: z.coerce.number().min(0, "Số lượng tồn không thể là số âm"),
  reason: z.string().min(5, "Lý do điều chỉnh tối thiểu 5 ký tự (phục vụ đối soát)"),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: StockBalance | null;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  balance,
}: StockAdjustmentDialogProps) {
  const { mutate: adjustStock, isPending } = useAdjustStockMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      newQuantity: balance ? balance.quantity_on_hand : 0,
      reason: "",
    },
  });

  React.useEffect(() => {
    if (balance) {
      reset({
        newQuantity: balance.quantity_on_hand,
        reason: "",
      });
    }
  }, [balance, reset]);

  if (!balance) return null;

  const onSubmit = (data: AdjustmentFormData) => {
    adjustStock(
      {
        balanceId: balance.id,
        newQuantity: data.newQuantity,
        reason: data.reason,
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
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Điều Chỉnh Số Dư Tồn Kho</DialogTitle>
              <DialogDescription className="text-xs">
                Cập nhật kiểm đếm thực tế và lưu vết kiểm toán (Audit Trail)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Item context banner */}
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-1 text-xs">
          <p className="font-semibold text-foreground">{balance.ingredient_name}</p>
          <p className="text-muted-foreground font-mono text-[11px]">
            Mã: {balance.ingredient_code} • {balance.facility_name}
          </p>
          <p className="text-muted-foreground text-[11px]">
            Tồn hiện tại trên sổ:{" "}
            <span className="font-bold text-foreground">
              {balance.quantity_on_hand} {balance.unit}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          {/* New Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-qty" className="text-xs font-semibold">
              Số Lượng Kiểm Kê Thực Tế ({balance.unit}) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="adj-qty"
              type="number"
              step="any"
              className="text-xs font-mono"
              {...register("newQuantity")}
            />
            {errors.newQuantity && (
              <p className="text-[11px] text-destructive">{errors.newQuantity.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-reason" className="text-xs font-semibold">
              Lý Do Điều Chỉnh & Căn Cứ Biên Bản <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="adj-reason"
              placeholder="VD: Kiểm kê định kỳ đầu tháng phát hiện thừa/thiếu do hao hụt tự nhiên..."
              className="text-xs resize-none h-20"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-[11px] text-destructive">{errors.reason.message}</p>
            )}
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
              <span>Xác Nhận Điều Chỉnh</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
