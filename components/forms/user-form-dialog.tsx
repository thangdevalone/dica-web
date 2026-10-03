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
import { Users } from "lucide-react";
import type { Role, Facility } from "@/types";

const userSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  roleName: z.string().min(1, "Vui lòng chọn vai trò hệ thống"),
  facilityName: z.string().min(1, "Vui lòng chọn cơ sở trực thuộc"),
  userKind: z.enum(["INTERNAL", "SUPPLIER"]),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  facilities: Facility[];
  onSubmitSuccess?: (values: UserFormValues) => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  roles,
  facilities,
  onSubmitSuccess,
}: UserFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      roleName: "",
      facilityName: "",
      userKind: "INTERNAL",
    },
  });

  const selectedRole = watch("roleName");
  const selectedFacility = watch("facilityName");
  const selectedKind = watch("userKind");

  const onSubmit = async (values: UserFormValues) => {
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
              <Users className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Cấp Tài Khoản & Phân Quyền
              </DialogTitle>
              <DialogDescription className="text-xs">
                Khởi tạo nhân sự và gán phạm vi chi nhánh
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tên Đăng Nhập</Label>
              <Input
                placeholder="VD: thang.nguyen"
                className="h-9 text-xs"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-[11px] text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Họ Và Tên</Label>
              <Input
                placeholder="VD: Nguyễn Thế Thắng"
                className="h-9 text-xs"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Email Công Ty</Label>
            <Input
              type="email"
              placeholder="VD: thang.admin@dica.vn"
              className="h-9 text-xs"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Vai Trò (Role)</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setValue("roleName", val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleName && (
                <p className="text-[11px] text-destructive">{errors.roleName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phạm Vi Cơ Sở</Label>
              <Select
                value={selectedFacility}
                onValueChange={(val) => setValue("facilityName", val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn cơ sở" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toàn Chuỗi DICA" className="text-xs">
                    Toàn Chuỗi DICA
                  </SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.name} className="text-xs">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.facilityName && (
                <p className="text-[11px] text-destructive">{errors.facilityName.message}</p>
              )}
            </div>
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
              {isSubmitting ? "Đang xử lý..." : "Cấp tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
