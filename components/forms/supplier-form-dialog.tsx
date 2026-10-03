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
import { Building, Loader2 } from "lucide-react";
import type { Supplier } from "@/types";

const supplierSchema = z.object({
  code: z
    .string()
    .min(3, "Mã NCC tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ gồm chữ in hoa, số và gạch nối"),
  name: z.string().min(3, "Tên nhà cung cấp tối thiểu 3 ký tự"),
  contact_person: z.string().min(2, "Tên người đại diện tối thiểu 2 ký tự"),
  phone: z.string().min(8, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không đúng định dạng"),
  address: z.string().min(5, "Địa chỉ chi tiết tối thiểu 5 ký tự"),
  lead_time_days: z.coerce.number().min(0, "Lead time không được âm"),
  tax_code: z.string().min(5, "Mã số thuế không hợp lệ"),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
}: SupplierFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: "",
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      lead_time_days: 2,
      tax_code: "",
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code: data.code.toUpperCase(),
        name: data.name,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        lead_time_days: data.lead_time_days,
        tax_code: data.tax_code,
        rating: 5.0,
        active: true,
      };

      const currentSups = useDataStore.getState().suppliers;
      useDataStore.setState({ suppliers: [...currentSups, newSup] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      toast.success(`Đã thêm nhà cung cấp đối tác "${newSup.name}"`);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(`Thêm nhà cung cấp thất bại: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Thêm Nhà Cung Cấp Đối Tác</DialogTitle>
              <DialogDescription className="text-xs">
                Khai báo thông tin pháp nhân, thông tin liên hệ và thời gian giao hàng (Lead Time)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Code */}
            <div className="space-y-1">
              <Label htmlFor="sup-code" className="text-xs font-semibold">
                Mã NCC <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-code"
                placeholder="VD: NCC-MEAT-WORLD"
                className="font-mono text-xs uppercase"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-[10px] text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Tax Code */}
            <div className="space-y-1">
              <Label htmlFor="sup-tax" className="text-xs font-semibold">
                Mã Số Thuế <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-tax"
                placeholder="VD: 0314987654"
                className="font-mono text-xs"
                {...register("tax_code")}
              />
              {errors.tax_code && (
                <p className="text-[10px] text-destructive">{errors.tax_code.message}</p>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="sup-name" className="text-xs font-semibold">
              Tên Doanh Nghiệp / Pháp Nhân <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sup-name"
              placeholder="VD: Công ty Cổ phần Thực phẩm Meat World"
              className="text-xs"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Contact Person */}
            <div className="space-y-1">
              <Label htmlFor="sup-contact" className="text-xs font-semibold">
                Người Đại Diện Phụ Trách <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-contact"
                placeholder="VD: Nguyễn Văn A"
                className="text-xs"
                {...register("contact_person")}
              />
              {errors.contact_person && (
                <p className="text-[10px] text-destructive">{errors.contact_person.message}</p>
              )}
            </div>

            {/* Lead Time */}
            <div className="space-y-1">
              <Label htmlFor="sup-lead" className="text-xs font-semibold">
                Lead Time Giao Hàng (Ngày)
              </Label>
              <Input
                id="sup-lead"
                type="number"
                className="text-xs font-mono"
                {...register("lead_time_days")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="sup-phone" className="text-xs font-semibold">
                Số Điện Thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-phone"
                placeholder="VD: 0908 123 456"
                className="text-xs font-mono"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-[10px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="sup-email" className="text-xs font-semibold">
                Email Đặt Hàng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-email"
                type="email"
                placeholder="VD: order@supplier.vn"
                className="text-xs"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[10px] text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label htmlFor="sup-addr" className="text-xs font-semibold">
              Địa Chỉ Kho / Trụ Sở <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sup-addr"
              placeholder="VD: KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM"
              className="text-xs"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-[10px] text-destructive">{errors.address.message}</p>
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
            <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Lưu Nhà Cung Cấp</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
