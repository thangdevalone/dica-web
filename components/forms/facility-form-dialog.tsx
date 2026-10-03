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
import { useCreateFacilityMutation } from "@/hooks/use-organization-queries";
import { Building2, Loader2 } from "lucide-react";
import type { FacilityType } from "@/types";

const facilitySchema = z.object({
  code: z
    .string()
    .min(3, "Mã cơ sở phải có ít nhất 3 ký tự")
    .max(20, "Mã tối đa 20 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ chứa chữ hoa, số, gạch ngang hoặc gạch dưới"),
  name: z.string().min(3, "Tên cơ sở phải có ít nhất 3 ký tự"),
  type: z.enum(["CENTRAL_WAREHOUSE", "CENTRAL_KITCHEN", "BRANCH"] as const),
  address: z.string().min(5, "Địa chỉ chi tiết phải có ít nhất 5 ký tự"),
});

type FacilityFormData = z.infer<typeof facilitySchema>;

interface FacilityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FacilityFormDialog({ open, onOpenChange }: FacilityFormDialogProps) {
  const { mutate: createFacility, isPending } = useCreateFacilityMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FacilityFormData>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      code: "",
      name: "",
      type: "BRANCH",
      address: "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = (data: FacilityFormData) => {
    createFacility(
      {
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type as FacilityType,
        address: data.address,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thêm Cơ Sở & Chi Nhánh Mới</DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo điểm kho, bếp sơ chế hoặc nhà hàng trong chuỗi DICA
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="fac-code" className="text-xs font-semibold">
              Mã Cơ Sở (Code) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fac-code"
              placeholder="VD: BR-Q1-BENNGHE hoặc WH-CUCHI"
              className="font-mono text-xs uppercase"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-[11px] font-medium text-destructive">{errors.code.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fac-name" className="text-xs font-semibold">
              Tên Cơ Sở <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fac-name"
              placeholder="VD: DICA BBQ Premium — Bến Nghé Q1"
              className="text-xs"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="fac-type" className="text-xs font-semibold">
              Loại Hình Vận Hành <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(val) =>
                setValue("type", val as FacilityType, { shouldValidate: true })
              }
            >
              <SelectTrigger id="fac-type" className="h-9 text-xs">
                <SelectValue placeholder="Chọn loại hình cơ sở" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CENTRAL_WAREHOUSE">Kho Tổng Trung Tâm (Central Warehouse)</SelectItem>
                <SelectItem value="CENTRAL_KITCHEN">Bếp Trung Tâm (Central Kitchen)</SelectItem>
                <SelectItem value="BRANCH">Chi Nhánh Nhà Hàng (Branch Restaurant)</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-[11px] font-medium text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="fac-address" className="text-xs font-semibold">
              Địa Chỉ Chi Tiết <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fac-address"
              placeholder="VD: 120 Đồng Khởi, Bến Nghé, Quận 1, TP.HCM"
              className="text-xs"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-[11px] font-medium text-destructive">{errors.address.message}</p>
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
              <span>Lưu Cơ Sở</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
