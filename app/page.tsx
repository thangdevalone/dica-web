"use client"

import Link from "next/link"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { NAV_SECTIONS } from "@/constants"
import { useAuthStore } from "@/stores/use-auth-store"

export default function HomePage() {
  const permissions = useAuthStore((state) => state.permissions)
  const items = NAV_SECTIONS.flatMap((section) => section.items).filter(
    (item) =>
      item.href !== "/" &&
      (!item.permission ||
        (Array.isArray(item.permission)
          ? item.permission
          : [item.permission]
        ).some((permission) => permissions.includes(permission)))
  )
  return (
    <AdminLayout>
      <PageHeader
        title="Cấu hình DICA"
        description="Thiết lập cơ cấu, danh mục, nguồn hàng, quyền và chính sách. Các nghiệp vụ hằng ngày được thực hiện trên ứng dụng mobile DICA."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link href={item.href} key={item.href}>
              <Card className="h-full gap-3 p-6 transition-colors hover:bg-muted/50">
                <Icon className="size-6 text-primary" />
                <h2 className="font-semibold">{item.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {item.children?.map((child) => child.label).join(" · ") ??
                    "Mở trang cấu hình và hướng dẫn"}
                </p>
              </Card>
            </Link>
          )
        })}
      </div>
    </AdminLayout>
  )
}
