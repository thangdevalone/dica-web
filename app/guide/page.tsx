"use client"

import Link from "next/link"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/stores/use-auth-store"

const SETUP_STEPS = [
  {
    title: "Tạo cơ sở, kho và bộ phận",
    summary: "Cho hệ thống biết hàng được giữ ở đâu và bộ phận nào nhận hàng.",
    tasks: [
      "Tạo cơ sở đúng loại: Chi nhánh, Kho tổng hoặc Bếp tổng.",
      "Tạo điểm lưu kho thuộc từng cơ sở.",
      "Tạo bộ phận, ví dụ Bếp hoặc Bàn; chọn kho nhận mặc định của bộ phận.",
    ],
    result: "Mỗi bộ phận đã thuộc đúng cơ sở và có kho để nhận hàng.",
    links: [
      {
        label: "Cơ sở",
        href: "/organization?tab=facilities",
        permission: "facility.read",
      },
      {
        label: "Điểm lưu kho",
        href: "/organization?tab=locations",
        permission: "stock_location.read",
      },
      {
        label: "Bộ phận",
        href: "/organization?tab=departments",
        permission: "department.read",
      },
    ],
  },
  {
    title: "Khai báo hàng và nhà cung cấp",
    summary: "Tạo danh mục dùng chung trước khi cho bộ phận xin hàng.",
    tasks: [
      "Tạo đơn vị tính và nhóm hàng, sau đó tạo nguyên liệu với đơn vị cơ sở. Ví dụ Gạo dùng kg.",
      "Thêm quy đổi nếu đặt theo bao, thùng hoặc chai. Ví dụ 1 bao gạo = 5 kg.",
      "Tạo nhà cung cấp với số điện thoại; gắn các mặt hàng, giá tham khảo và nhà cung cấp ưu tiên nếu cần.",
    ],
    result: "Hàng có đơn vị rõ ràng và nhà cung cấp đã gắn đúng mặt hàng.",
    links: [
      { label: "Đơn vị", href: "/catalog?tab=units", permission: "unit.read" },
      {
        label: "Nhóm hàng",
        href: "/catalog?tab=groups",
        permission: "ingredient.read",
      },
      {
        label: "Nguyên liệu",
        href: "/catalog?tab=ingredients",
        permission: "ingredient.read",
      },
      {
        label: "Quy đổi",
        href: "/catalog?tab=conversions",
        permission: "conversion.read",
      },
      {
        label: "Nhà cung cấp",
        href: "/catalog?tab=suppliers",
        permission: "supplier.read",
      },
      {
        label: "Hàng & giá nhà cung cấp",
        href: "/catalog?tab=links",
        permission: "supplier_ingredient.read",
      },
    ],
  },
  {
    title: "Chọn hàng được xin và nơi cấp hàng",
    summary: "Bộ phận được xin gì và lấy hàng từ đâu là hai cấu hình riêng.",
    tasks: [
      "Trong Nhóm hàng được phép xin, chọn cơ sở, bộ phận và nhóm hàng. Ví dụ Bếp được xin thịt/rau, Bàn được xin bia/nước.",
      "Dùng Ngoại lệ từng mặt hàng để chặn riêng một hàng hoặc đặt hạn mức riêng. Ngoại lệ được ưu tiên hơn quyền theo nhóm.",
      "Trong Nguồn cấp hàng, chọn kho nội bộ hoặc nhà cung cấp cho từng mặt hàng tại bộ phận. Chọn nhà cung cấp ưu tiên trong danh mục chưa thay thế bước này.",
    ],
    result: "Mỗi hàng được phép xin đã có nguồn cấp phù hợp.",
    links: [
      {
        label: "Nhóm hàng được phép xin",
        href: "/sourcing?tab=group-eligibility",
        permission: "eligibility.read",
      },
      {
        label: "Ngoại lệ từng mặt hàng",
        href: "/sourcing?tab=eligibility",
        permission: "eligibility.read",
      },
      {
        label: "Nguồn cấp hàng",
        href: "/sourcing?tab=rules",
        permission: "source_rule.read",
      },
    ],
  },
  {
    title: "Tạo tài khoản và phân quyền",
    summary: "Vai trò quy định được làm gì; phạm vi quy định được làm ở đâu.",
    tasks: [
      "Kiểm tra bộ quyền vai trò, tạo tài khoản rồi gán vai trò ở cơ sở, kho hoặc bộ phận cần dùng.",
      "Nhân viên nhập số kiểm kê thực tế; không cấp quyền xem tồn hệ thống, giá hoặc chênh lệch nếu không cần. Quản lý/Chủ được duyệt và xem báo cáo theo phạm vi.",
      "Nếu bật thanh toán hai người, cần người nhập và một người khác có quyền xác nhận. Người xem tiền cũng cần quyền xem giá.",
      "Tài khoản nhà cung cấp chọn loại Nhà cung cấp và gắn đúng nhà cung cấp; họ chỉ xem đơn và giá của mình.",
      "Cấp quyền đọc/đánh dấu thông báo, xem ảnh và xem chứng từ liên quan cho người cần nhận thông báo.",
    ],
    result:
      "Đăng nhập thử từng nhóm tài khoản để kiểm tra đúng chức năng và đúng phạm vi dữ liệu.",
    links: [
      {
        label: "Vai trò & Quyền hạn",
        href: "/users?tab=roles",
        permission: "role.read",
      },
      { label: "Tài khoản", href: "/users?tab=users", permission: "user.read" },
      {
        label: "Phân quyền tài khoản",
        href: "/users?tab=grants",
        permission: "grant.read",
      },
    ],
  },
  {
    title: "Đặt giá chuẩn và chính sách",
    summary: "Thiết lập cách cảnh báo giá, xác nhận tiền và lưu ảnh.",
    tasks: [
      "Đặt giá chuẩn theo đơn vị cơ sở và ngưỡng chênh lệch. Ví dụ 10.000đ/kg, ngưỡng 10%: giá dưới 9.000đ hoặc trên 11.000đ sẽ cảnh báo.",
      "Bật tách người nhập và người xác nhận thanh toán nếu cần; hai thao tác thực hiện trên mobile.",
      "Chọn thời hạn lưu ảnh từ 6 đến 12 tháng. Ảnh hết hạn sẽ bị xóa; giảm thời hạn có thể làm ảnh cũ bị xóa sớm hơn.",
    ],
    result: "ADMIN và người cần nhận cảnh báo giá đã được cấp quyền phù hợp.",
    links: [
      {
        label: "Giá chuẩn & chính sách",
        href: "/workflow-policy",
        permission: ["workflow_policy.manage", "price_rule.manage"],
      },
    ],
  },
  {
    title: "Cấu hình iPOS và định mức khi có dữ liệu",
    summary: "Phục vụ đối soát tiêu hao; có thể làm sau cấu hình cơ bản.",
    tasks: [
      "Liên kết mã món iPOS với món trong hệ thống.",
      "Khai báo nguyên liệu và số lượng dùng cho từng món; cấu hình cảnh báo cần thiết.",
      "iPOS thật còn chờ API hoặc file và môi trường thử. Có mapping chưa có nghĩa là dữ liệu bán hàng đã tự đồng bộ.",
    ],
    result:
      "Mapping và định mức đã được kiểm tra với dữ liệu thử trước khi đánh giá hao hụt.",
    links: [
      {
        label: "Liên kết món iPOS",
        href: "/operations?tab=mappings",
        permission: "ipos_mapping.read",
      },
      {
        label: "Định mức",
        href: "/operations?tab=recipes",
        permission: "recipe.read",
      },
      {
        label: "Cảnh báo",
        href: "/operations?tab=alerts",
        permission: "alert_rule.manage",
      },
    ],
  },
]

export default function AdminGuidePage() {
  const permissions = useAuthStore((state) => state.permissions)
  const canOpen = (permission: string | string[]) =>
    (Array.isArray(permission) ? permission : [permission]).some((code) =>
      permissions.includes(code)
    )

  return (
    <AdminLayout>
      <PageHeader
        title="Hướng dẫn quản trị"
        description="Làm lần lượt từ bước 1 đến bước 5 để chuẩn bị hệ thống. Bước 6 dành cho đối soát iPOS."
      />
      <Card className="gap-2 p-5">
        <h2 className="font-semibold">Admin dùng Web để cấu hình</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tạo và duyệt phiếu, xuất/nhận hàng, kiểm kê, hoàn hàng, thanh toán và
          báo cáo hằng ngày thực hiện trên mobile. Sau khi cấu hình hoặc đổi
          quyền trên Web, đăng nhập thử trên app để kiểm tra.
        </p>
        <p className="text-sm text-muted-foreground">
          Bấm tên mỗi bước để mở hướng dẫn. Nút mở trang chỉ hiện khi tài khoản
          có quyền xem.
        </p>
      </Card>
      <ol className="space-y-3" aria-label="Các bước cấu hình hệ thống">
        {SETUP_STEPS.map((step, index) => (
          <li key={step.title}>
            <details open={index === 0} className="rounded-xl border bg-card">
              <summary className="cursor-pointer px-5 py-4 font-medium">
                {index + 1}. {step.title}
              </summary>
              <div className="space-y-4 border-t px-5 py-4">
                <p className="text-sm text-muted-foreground">{step.summary}</p>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {step.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
                <p className="text-sm">
                  <strong>Xong khi:</strong> {step.result}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.links
                    .filter((link) => canOpen(link.permission))
                    .map((link) => (
                      <Button
                        key={link.href}
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <h2 className="font-semibold">Kiểm tra trước khi đưa vào sử dụng</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>Bếp/Bàn chỉ thấy đúng hàng được xin tại cơ sở của mình.</li>
            <li>
              Phiếu thử trên mobile được gửi đúng người duyệt và nguồn cấp.
            </li>
            <li>Nhận/giao bù có ảnh; bao/thùng đã đổi đúng sang kg/lon.</li>
            <li>Nhà cung cấp chỉ thấy đơn và giá của mình.</li>
            <li>Người cần xử lý nhận thông báo; mở xem sẽ dừng nhắc.</li>
          </ul>
        </Card>
        <Card className="gap-3 p-5">
          <h2 className="font-semibold">
            Khi cần sửa cấu hình hoặc kiểm tra lỗi
          </h2>
          <p className="text-sm leading-relaxed">
            Không thấy hàng được xin: kiểm tra bộ phận, nhóm hàng, ngoại lệ và
            nguồn cấp. Không thấy chức năng: kiểm tra vai trò và phạm vi tài
            khoản.
          </p>
          <p className="text-sm leading-relaxed">
            Dùng Ngừng sử dụng để giữ lịch sử. Xóa vĩnh viễn xóa cả dữ liệu liên
            quan và cần mật khẩu ADMIN; kiểm tra phạm vi trước khi xóa.
          </p>
          {permissions.includes("audit.read") && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/system">Mở nhật ký hệ thống</Link>
            </Button>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
