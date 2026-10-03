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
import { Truck } from "lucide-react";
import type { Facility } from "@/types";

const dispatchSchema = z.object({
  toFacility: z.string().min(1, "Vui lòng chọn điểm nhận hàng"),
  driverName: z.string().min(2, "Tên tài xế tối thiểu 2 ký tự"),
  licensePlate: z.string().min(4, "Biển số xe không hợp lệ"),
  sealCode: z.string().min(3, "Mã niêm phong chì không hợp lệ"),
});

export type DispatchFormValues = z.infer<typeof dispatchSchema>;

interface DispatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  onSubmitSuccess?: (values: DispatchFormValues) => void;
}

export function DispatchFormDialog({
  open,
  onOpenChange,
  facilities,
  onSubmitSuccess,
}: DispatchFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      toFacility: "",
      driverName: "",
      licensePlate: "",
      sealCode: `SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
    },
  });

  const selectedToFacility = watch("toFacility");

  const onSubmit = async (values: DispatchFormValues) => {
    onSubmitSuccess?.(values);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Truck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Tạo Phiếu Xuất Kho Vận Chuyển
              </DialogTitle>
              <DialogDescription className="text-xs">
                Niêm phong xe tải và điều phối hàng tới chi nhánh
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Điểm Nhận Hàng (Chi Nhánh)</Label>
            <Select
              value={selectedToFacility}
              onValueChange={(val) => setValue("toFacility", val, { shouldValidate: true })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn chi nhánh nhận hàng" />
              </SelectTrigger>
              <SelectContent>
                {facilities
                  .filter((f) => f.type !== "CENTRAL_WAREHOUSE")
                  .map((f) => (
                    <SelectItem key={f.id} value={f.name} className="text-xs">
                      {f.name} ({f.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.toFacility && (
              <p className="text-[11px] text-destructive">{errors.toFacility.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên Tài Xế</Label>
              <Input
                placeholder="VD: Nguyễn Văn Tài"
                className="h-9 text-xs"
                {...register("driverName")}
              />
              {errors.driverName && (
                <p className="text-[11px] text-destructive">{errors.driverName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Biển Số Xe</Label>
              <Input
                placeholder="VD: 51C-882.19"
                className="h-9 text-xs font-mono"
                {...register("licensePlate")}
              />
              {errors.licensePlate && (
                <p className="text-[11px] text-destructive">{errors.licensePlate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mã Chì Niêm Phong (Security Seal)</Label>
            <Input
              className="h-9 text-xs font-mono font-bold"
              {...register("sealCode")}
            />
            {errors.sealCode && (
              <p className="text-[11px] text-destructive">{errors.sealCode.message}</p>
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
              {isSubmitting ? "Đang xử lý..." : "Khởi tạo lệnh xuất"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
