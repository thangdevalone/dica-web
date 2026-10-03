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
import { useFacilitiesQuery } from "@/hooks/use-organization-queries";
import { organizationApi } from "@/services/organization.api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, Loader2 } from "lucide-react";
import type { StockLocationType } from "@/types";

const locationSchema = z.object({
  facility_id: z.string().min(1, "Vui lòng chọn cơ sở quản lý"),
  code: z
    .string()
    .min(3, "Mã vị trí phải có ít nhất 3 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ gồm chữ in hoa, số và gạch nối"),
  name: z.string().min(3, "Tên vị trí kho phải có ít nhất 3 ký tự"),
  type: z.enum(["PHYSICAL", "IN_TRANSIT"] as const),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationFormDialog({ open, onOpenChange }: LocationFormDialogProps) {
  const queryClient = useQueryClient();
  const { data: facilities = [] } = useFacilitiesQuery();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      facility_id: "",
      code: "",
      name: "",
      type: "PHYSICAL",
    },
  });

  const selectedFacilityId = watch("facility_id");
  const selectedType = watch("type");

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      await organizationApi.createLocation({
        facility_id: data.facility_id,
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type as StockLocationType,
      });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success(`Đã thêm điểm lưu kho "${data.name}"`);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(`Thêm điểm lưu kho thất bại: ${msg}`);
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
              <Layers className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thêm Điểm Lưu Kho (Stock Location)</DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo khu vực lưu trữ vật lý hoặc phân khu trung chuyển
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Facility */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Thuộc Cơ Sở <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedFacilityId}
              onValueChange={(val) =>
                setValue("facility_id", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn cơ sở trực thuộc" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((fac) => (
                  <SelectItem key={fac.id} value={fac.id} className="text-xs">
                    {fac.name} ({fac.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.facility_id && (
              <p className="text-[11px] text-destructive">{errors.facility_id.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-code" className="text-xs font-semibold">
              Mã Điểm Kho <span className="text-destructive">*</span>
            </Label>
            <Input
              id="loc-code"
              placeholder="VD: LOC-WH-COLD hoặc LOC-BR-COOL"
              className="font-mono text-xs uppercase"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-[11px] text-destructive">{errors.code.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-name" className="text-xs font-semibold">
              Tên Điểm Lưu Kho <span className="text-destructive">*</span>
            </Label>
            <Input
              id="loc-name"
              placeholder="VD: Kho Lạnh Đông Sâu -18°C, Tủ Mát Quầy Pha Chế..."
              className="text-xs"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Loại Điểm Kho <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(val) =>
                setValue("type", val as StockLocationType, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn loại điểm kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHYSICAL">Lưu Trữ Vật Lý (Physical Location)</SelectItem>
                <SelectItem value="IN_TRANSIT">Hàng Đang Trung Chuyển (In-Transit)</SelectItem>
              </SelectContent>
            </Select>
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
              <span>Lưu Điểm Kho</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
