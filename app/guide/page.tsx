"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  PackageCheck,
  PlayCircle,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/shared/page-header"
import { START_ADMIN_TOUR_EVENT } from "@/components/shared/admin-guided-tour"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SETUP_STEPS = [
  {
    title: "1. Khai báo cơ cấu",
    description:
      "Tạo cơ sở, kho và bộ phận trước để các chứng từ có đúng phạm vi dữ liệu.",
    href: "/organization",
    action: "Mở Cơ sở & Chi nhánh",
    icon: Building2,
  },
  {
    title: "2. Chuẩn bị danh mục",
    description:
      "Khai báo đơn vị tính, nhóm nguyên liệu, nguyên liệu, quy đổi và nhà cung cấp.",
    href: "/catalog",
    action: "Mở Danh mục",
    icon: Boxes,
  },
  {
    title: "3. Cấu hình nguồn hàng",
    description:
      "Xác định bộ phận được yêu cầu mặt hàng nào và hàng sẽ lấy từ kho hay nhà cung cấp.",
    href: "/sourcing",
    action: "Mở Định tuyến nguồn",
    icon: PackageCheck,
  },
  {
    title: "4. Tạo vai trò và tài khoản",
    description:
      "Tạo vai trò tùy chỉnh, chọn bộ quyền, tạo tài khoản rồi gán vai trò theo đúng phạm vi.",
    href: "/users",
    action: "Mở Tài khoản & Phân quyền",
    icon: Users,
  },
] as const

const DAILY_FLOW = [
  {
    label: "Yêu cầu cấp hàng",
    detail:
      "Bộ phận lập yêu cầu, gửi duyệt; người có quyền phê duyệt hoặc yêu cầu sửa lại.",
    href: "/requests",
    icon: ClipboardList,
  },
  {
    label: "Đơn thực hiện",
    detail:
      "Sau khi duyệt, kiểm tra đơn được tách theo nguồn kho nội bộ hoặc nhà cung cấp.",
    href: "/orders",
    icon: PackageCheck,
  },
  {
    label: "Xuất và nhận hàng",
    detail:
      "Kho ghi nhận xuất; nơi nhận kiểm đếm, nhập hàng và tạo sai lệch nếu số lượng không khớp.",
    href: "/delivery",
    icon: Truck,
  },
  {
    label: "Kiểm soát tồn kho",
    detail:
      "Theo dõi tồn, sổ kho, kiểm kê, điều chỉnh và báo hỏng. Không sửa số tồn trực tiếp.",
    href: "/inventory",
    icon: Warehouse,
  },
] as const

export default function AdminGuidePage() {
  return (
    <AdminLayout permission="role.read">
      <div className="space-y-6">
        <PageHeader
          title="Hướng dẫn quản trị DICA"
          description="Tour thao tác đầy đủ đi qua từng trang, tab, form cấu hình và vòng đời chứng từ trên web."
          icon={BookOpenCheck}
          actions={
            <Button
              data-tour="admin-tour-restart"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event(START_ADMIN_TOUR_EVENT))}
            >
              <PlayCircle className="size-4" />
              Bắt đầu hướng dẫn
            </Button>
          }
        />

        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="flex-row items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Bắt đầu theo đúng thứ tự bên dưới
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tour tự chuyển trang, mở đúng tab và mở form mẫu để giải thích
                từng trường; tour không tự bấm Lưu hay tạo dữ liệu. Cơ cấu tổ
                chức và danh mục phải có trước khi tạo tài khoản vận hành. Sau
                khi hoàn tất, hãy dùng một tài khoản thử để kiểm tra đúng menu
                và đúng dữ liệu được phép xem.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Thiết lập hệ thống lần đầu
            </h2>
            <p className="text-xs text-muted-foreground">
              Thực hiện từ bước 1 đến bước 4.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SETUP_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <Card key={step.href} size="sm">
                  <CardHeader>
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full justify-between">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-2 justify-between text-xs"
                    >
                      <Link href={step.href}>
                        {step.action}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Quy trình vận hành hằng ngày
            </h2>
            <p className="text-xs text-muted-foreground">
              Luồng chuẩn: Yêu cầu → Phê duyệt → Đơn thực hiện → Xuất hàng →
              Nhận hàng → Đối soát.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-4">
            {DAILY_FLOW.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={step.href} size="sm" className="relative">
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                        {index + 1}
                      </span>
                      <Icon className="size-4 text-primary" />
                      <p className="text-sm font-semibold">{step.label}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="justify-start px-0 text-xs"
                    >
                      <Link href={step.href}>
                        Đi đến màn hình <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Cách phân quyền đúng
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Vai trò</strong> quyết định
                người dùng được làm gì.
              </p>
              <p>
                <strong className="text-foreground">Phạm vi</strong> quyết định
                người dùng được thao tác trên cơ sở, kho hoặc bộ phận nào.
              </p>
              <p>
                Một tài khoản có thể được gán nhiều vai trò ở nhiều phạm vi. Chỉ
                cấp phạm vi Toàn tổ chức cho quản lý cấp cao.
              </p>
              <Button asChild size="sm" className="mt-2 w-fit text-xs">
                <Link href="/users">
                  <KeyRound className="size-3.5" /> Quản lý quyền truy cập
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="size-5 text-primary" />
                Kiểm tra cuối ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs leading-relaxed text-muted-foreground">
              <p>• Xử lý các yêu cầu và điều chuyển đang chờ duyệt.</p>
              <p>• Kiểm tra các phiếu xuất/nhận còn ở bản nháp.</p>
              <p>• Giải quyết sai lệch nhận hàng và cảnh báo tồn thấp.</p>
              <p>• Đối chiếu báo hỏng, kiểm kê, hao hụt và thanh toán.</p>
              <p>• Xem Nhật ký hệ thống khi cần truy vết thao tác.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  )
}
