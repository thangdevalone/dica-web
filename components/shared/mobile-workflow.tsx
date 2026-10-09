import Link from "next/link"
import { Smartphone } from "lucide-react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function MobileWorkflow() {
  return (
    <AdminLayout>
      <Card className="mx-auto max-w-lg gap-4 p-8">
        <Smartphone className="size-8 text-primary" />
        <h1 className="text-xl font-semibold">Thao tác trên ứng dụng DICA</h1>
        <p className="text-sm text-muted-foreground">
          Tạo và duyệt phiếu, giao nhận, kiểm kê, hoàn hàng, thanh toán và báo
          cáo được thực hiện trên app mobile theo quyền được cấp. Web dành cho
          cấu hình hệ thống.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Về trang cấu hình</Link>
        </Button>
      </Card>
    </AdminLayout>
  )
}
