"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { TourProvider, type TourOptions, type TourStep, useTourActions } from "modern-tour"
import { NAV_SECTIONS, type NavItem } from "@/constants"
import { useAuthStore } from "@/stores/use-auth-store"

export const START_ADMIN_TOUR_EVENT = "dica:start-admin-tour"

const TOUR_VERSION = "v3-actionable-flow"

interface FlowStep {
  id: string
  route: string
  title: string
  content: string
  marker?: string
  activateMarker?: string
  anyPermissions?: string[]
  allPermissions?: string[]
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: "dashboard",
    route: "/",
    title: "Bắt đầu ngày làm việc",
    content:
      "Đọc các thẻ chờ xử lý trước: yêu cầu chờ duyệt, đơn đang mở, điều chuyển, sai lệch giao nhận và cảnh báo tồn kho. Bấm vào từng thẻ để đi thẳng tới danh sách cần xử lý.",
  },
  {
    id: "organization-overview",
    route: "/organization",
    title: "Bước 1 — Dựng cơ cấu tổ chức",
    content:
      "Làm theo thứ tự Cơ sở → Kho & điểm lưu trữ → Bộ phận. Kho là nơi giữ tồn thực tế; bộ phận phải được gắn đúng cơ sở và kho nhận hàng mặc định.",
  },
  {
    id: "organization-tabs",
    route: "/organization",
    marker: "organization-tabs",
    title: "Ba lớp dữ liệu phải khai báo",
    content:
      "Cơ sở là chi nhánh/bếp/kho tổng. Sau khi có cơ sở, tạo kho vật lý trong tab Kho & điểm lưu trữ, rồi tạo Bộ phận và chọn kho nhận hàng. Thiếu một lớp thì các form xin hàng sẽ không có đủ lựa chọn.",
  },
  {
    id: "organization-create-facility",
    route: "/organization",
    marker: "organization-create-facility",
    title: "Tạo cơ sở đầu tiên",
    content:
      "Bấm Thêm cơ sở, nhập mã dễ nhận biết, tên hiển thị, loại cơ sở, múi giờ và trạng thái. Lưu xong mới chuyển sang tạo kho và bộ phận thuộc cơ sở đó.",
    allPermissions: ["facility.manage"],
  },
  {
    id: "catalog-overview",
    route: "/catalog",
    title: "Bước 2 — Chuẩn hóa danh mục",
    content:
      "Nên cấu hình theo thứ tự: Đơn vị tính → Nhóm nguyên liệu → Nguyên liệu → Quy đổi → Nhà cung cấp. Mã và đơn vị cơ sở của nguyên liệu sẽ đi vào sổ kho nên cần chọn đúng ngay từ đầu.",
  },
  {
    id: "catalog-tabs",
    route: "/catalog",
    marker: "catalog-tabs",
    title: "Các tab danh mục liên kết với nhau",
    content:
      "Đơn vị và nhóm dùng khi tạo nguyên liệu; Quy đổi dùng khi mua/xin khác đơn vị gốc; Nhà cung cấp và bảng hàng cung cấp dùng cho nguồn SUPPLIER và giá tham chiếu.",
  },
  {
    id: "catalog-create-ingredient",
    route: "/catalog",
    marker: "catalog-create-ingredient",
    title: "Tạo nguyên liệu",
    content:
      "Bấm Thêm nguyên liệu, nhập mã, tên, nhóm và đơn vị cơ sở. Sau khi lưu, bổ sung quy đổi đơn vị và nhà cung cấp nếu nguyên liệu được mua ngoài.",
    allPermissions: ["ingredient.manage"],
  },
  {
    id: "sourcing-overview",
    route: "/sourcing",
    title: "Bước 3 — Xác định hàng lấy từ đâu",
    content:
      "Mỗi cặp cơ sở nhận + nguyên liệu cần một nguồn cấp. Chọn STOCK khi lấy từ kho nội bộ, hoặc SUPPLIER khi mua từ nhà cung cấp.",
  },
  {
    id: "sourcing-tabs",
    route: "/sourcing",
    marker: "sourcing-tabs",
    title: "Nguồn cấp và quyền xin hàng",
    content:
      "Tab Nguồn cấp quyết định tuyến thực hiện đơn. Tab Hàng được phép xin quyết định bộ phận nào nhìn thấy và được yêu cầu nguyên liệu nào.",
  },
  {
    id: "sourcing-create-rule",
    route: "/sourcing",
    marker: "sourcing-create-rule",
    title: "Thêm quy tắc nguồn cấp",
    content:
      "Bấm Thêm nguồn cấp, chọn cơ sở nhận, nguyên liệu và loại nguồn. Với STOCK phải chọn kho xuất; với SUPPLIER phải chọn nhà cung cấp. Sau đó qua tab quyền xin hàng để mở mặt hàng cho đúng bộ phận.",
    allPermissions: ["source_rule.manage"],
  },
  {
    id: "users-overview",
    route: "/users",
    title: "Bước 4 — Tạo vai trò, người dùng và phạm vi",
    content:
      "Đúng trình tự là Vai trò & Quyền hạn → Người dùng & Tài khoản → Grants. Quyền cho biết được làm gì; Grant giới hạn được làm ở cơ sở, kho hoặc bộ phận nào.",
  },
  {
    id: "users-role-tab",
    route: "/users",
    marker: "users-tab-roles",
    activateMarker: "users-tab-roles",
    title: "Mở tab Vai trò & Quyền hạn",
    content:
      "Tour đã chuyển sang tab vai trò. Hãy tạo vai trò theo công việc thực tế và chỉ chọn các quyền cần thiết; vai trò gốc vẫn có thể chỉnh bộ quyền nhưng mã, tên và trạng thái được bảo vệ.",
    allPermissions: ["role.read"],
  },
  {
    id: "users-create-role",
    route: "/users",
    marker: "users-create-role",
    title: "Tạo vai trò",
    content:
      "Bấm Tạo vai trò, nhập mã/tên rồi tìm quyền theo tên hoặc mã. Dùng Chọn kết quả sau khi lọc để cấp theo nhóm, sau đó rà lại các quyền nhạy cảm trước khi lưu.",
    allPermissions: ["role.read", "role.manage"],
  },
  {
    id: "users-user-tab",
    route: "/users",
    marker: "users-tab-users",
    activateMarker: "users-tab-users",
    title: "Chuyển sang Người dùng",
    content:
      "Sau khi có vai trò, tạo tài khoản cho nhân sự. Tour đã chuyển về tab Người dùng để nút tạo tài khoản xuất hiện.",
    allPermissions: ["user.read", "user.create", "grant.assign"],
  },
  {
    id: "users-create-user",
    route: "/users",
    marker: "users-create-user",
    title: "Tạo tài khoản và gán quyền ban đầu",
    content:
      "Bấm Tạo tài khoản, nhập tên đăng nhập, tên hiển thị, mật khẩu tạm, vai trò và phạm vi làm việc. Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên.",
    allPermissions: ["user.read", "user.create", "grant.assign"],
  },
  {
    id: "users-grant-tab",
    route: "/users",
    marker: "users-tab-grants",
    activateMarker: "users-tab-grants",
    title: "Kiểm soát phạm vi bằng Grant",
    content:
      "Mở tab Grants để cấp thêm hoặc thu hồi vai trò theo phạm vi. Chọn ORGANIZATION cho toàn hệ thống; FACILITY, STOCK_LOCATION hoặc DEPARTMENT khi chỉ được thao tác trong một khu vực.",
    allPermissions: ["grant.read", "grant.assign"],
  },
  {
    id: "users-create-grant",
    route: "/users",
    marker: "users-create-grant",
    title: "Gán quyền theo phạm vi",
    content:
      "Bấm Gán quyền, tìm người dùng, chọn vai trò, loại phạm vi và đúng đối tượng. Tránh cấp toàn tổ chức nếu công việc chỉ nằm ở một cơ sở hoặc bộ phận.",
    allPermissions: ["grant.read", "grant.assign"],
  },
  {
    id: "requests-overview",
    route: "/requests",
    title: "Bước 5 — Bộ phận lập yêu cầu hàng",
    content:
      "Người lập tạo nháp, kiểm tra ngày cần hàng và số lượng rồi Gửi duyệt. Người duyệt có thể duyệt, từ chối hoặc yêu cầu chỉnh sửa; khi duyệt hệ thống tự sinh đơn thực hiện theo nguồn cấp.",
  },
  {
    id: "requests-create",
    route: "/requests",
    marker: "requests-create",
    title: "Tạo yêu cầu hàng",
    content:
      "Bấm Tạo yêu cầu, chọn cơ sở, bộ phận, ngày cần nhận rồi thêm nguyên liệu và số lượng. Lưu nháp để rà soát; mở lại bản ghi và bấm Gửi duyệt khi đã đủ dữ liệu.",
    allPermissions: ["request.create"],
  },
  {
    id: "orders",
    route: "/orders",
    title: "Bước 6 — Theo dõi đơn thực hiện",
    content:
      "Đơn được tạo tự động sau khi yêu cầu được duyệt, không tạo tay tại đây. Mở từng dòng để xem nguồn STOCK/SUPPLIER, lượng cần giao, đã giao, còn thiếu, chứng từ nhà cung cấp và trạng thái thanh toán.",
  },
  {
    id: "transfers-overview",
    route: "/transfers",
    title: "Luồng riêng — Điều chuyển kho nội bộ",
    content:
      "Dùng khi hàng đi giữa hai kho vật lý mà không xuất phát từ yêu cầu của bộ phận. Phiếu đi qua Nháp → Gửi duyệt → Duyệt → Xuất → Nhận.",
  },
  {
    id: "transfers-create",
    route: "/transfers",
    marker: "transfers-create",
    title: "Lập phiếu điều chuyển",
    content:
      "Bấm Lập phiếu điều chuyển, chọn kho nguồn, kho đích, thời gian dự kiến nhận và nguyên liệu/số lượng. Lưu nháp rồi gửi duyệt; một số tuyến nội bộ được hệ thống tự duyệt theo chính sách.",
    allPermissions: ["transfer.create"],
  },
  {
    id: "delivery-overview",
    route: "/delivery",
    title: "Bước 7 — Xuất, nhận và xử lý sai lệch",
    content:
      "Kho nguồn tạo và ghi sổ phiếu xuất; nơi nhận kiểm đếm rồi ghi sổ phiếu nhập. Nếu thực nhận khác thực xuất, hệ thống tạo hồ sơ sai lệch để điều tra và xử lý.",
  },
  {
    id: "delivery-dispatch-tab",
    route: "/delivery",
    marker: "delivery-tab-dispatches",
    activateMarker: "delivery-tab-dispatches",
    title: "1. Phiếu xuất kho",
    content:
      "Tour đã mở tab Phiếu xuất kho. Chọn đơn đang mở, nhập lượng xuất thực tế, lưu phiếu rồi ghi sổ khi hàng thật sự rời kho.",
    allPermissions: ["dispatch.read"],
  },
  {
    id: "delivery-create-dispatch",
    route: "/delivery",
    marker: "delivery-create-dispatch",
    title: "Lập phiếu xuất",
    content:
      "Bấm Lập phiếu xuất, chọn đơn thực hiện và điền số lượng theo từng dòng. Không ghi sổ trước khi kho đã kiểm đủ hàng vì thao tác ghi sổ làm thay đổi tồn kho.",
    allPermissions: ["dispatch.read", "dispatch.create"],
  },
  {
    id: "delivery-receipt-tab",
    route: "/delivery",
    marker: "delivery-tab-receipts",
    activateMarker: "delivery-tab-receipts",
    title: "2. Phiếu nhập nhận hàng",
    content:
      "Tour đã chuyển sang tab Phiếu nhập. Nơi nhận chọn phiếu xuất/đơn liên quan, nhập số lượng thực nhận và ghi chú tình trạng hàng.",
    allPermissions: ["receipt.read"],
  },
  {
    id: "delivery-create-receipt",
    route: "/delivery",
    marker: "delivery-create-receipt",
    title: "Lập phiếu nhập",
    content:
      "Bấm Lập phiếu nhập, kiểm đếm từng dòng rồi lưu và ghi sổ. Chênh lệch giữa xuất và nhận phải phản ánh đúng thực tế; không sửa số để ép khớp.",
    allPermissions: ["receipt.read", "receipt.create"],
  },
  {
    id: "delivery-discrepancy-tab",
    route: "/delivery",
    marker: "delivery-tab-discrepancies",
    activateMarker: "delivery-tab-discrepancies",
    title: "3. Xử lý sai lệch giao nhận",
    content:
      "Các ca thiếu/thừa xuất hiện tại đây. Mở hồ sơ, đối chiếu chứng từ và chọn cách xử lý có lý do rõ ràng để giữ Audit Trail đầy đủ.",
    allPermissions: ["discrepancy.read"],
  },
  {
    id: "inventory-overview",
    route: "/inventory",
    title: "Bước 8 — Kiểm soát tồn kho",
    content:
      "Tồn tức thời là kết quả của chứng từ đã ghi sổ. Sổ cái giải thích mọi biến động; không chỉnh số trực tiếp ngoài phiếu điều chỉnh, kiểm kê hoặc biên bản báo hỏng.",
  },
  {
    id: "inventory-adjustment-tab",
    route: "/inventory",
    marker: "inventory-tab-adjustments",
    activateMarker: "inventory-tab-adjustments",
    title: "Điều chỉnh tồn có chứng từ",
    content:
      "Tour đã mở tab Điều chỉnh tồn. Dùng khi cần sửa chênh lệch đã xác minh; chọn kho, nguyên liệu, số lượng tăng/giảm và ghi lý do có thể kiểm toán.",
    allPermissions: ["adjustment.read"],
  },
  {
    id: "inventory-create-adjustment",
    route: "/inventory",
    marker: "inventory-create-adjustment",
    title: "Lập phiếu điều chỉnh",
    content:
      "Bấm Lập phiếu điều chỉnh, lưu nháp để kiểm tra rồi ghi sổ theo đúng quyền hạn. Chỉ phiếu đã ghi sổ mới làm thay đổi tồn thực tế.",
    allPermissions: ["adjustment.read", "adjustment.create"],
  },
  {
    id: "inventory-damage-tab",
    route: "/inventory",
    marker: "inventory-tab-damage",
    activateMarker: "inventory-tab-damage",
    title: "Ghi nhận hao hụt và hủy hỏng",
    content:
      "Tour đã mở tab Hao hụt & Hủy hỏng. Dùng biên bản riêng để giữ nguyên nhân, người xác nhận và lịch sử trừ kho minh bạch.",
    allPermissions: ["damage.read"],
  },
  {
    id: "inventory-create-damage",
    route: "/inventory",
    marker: "inventory-create-damage",
    title: "Lập biên bản báo hỏng",
    content:
      "Bấm Lập biên bản, chọn kho/nguyên liệu/số lượng, nguyên nhân và bằng chứng nếu có. Sau khi xác nhận, hệ thống mới ghi nhận ảnh hưởng tồn kho.",
    allPermissions: ["damage.read", "damage.create"],
  },
  {
    id: "operations-overview",
    route: "/operations",
    title: "Bước 9 — iPOS, định mức và hao hụt",
    content:
      "Đúng thứ tự là ánh xạ món iPOS → công thức BOM → nhập và commit doanh số → tính đối soát → xử lý cảnh báo. Thiếu ánh xạ hoặc công thức sẽ làm báo cáo tiêu hao không đầy đủ.",
  },
  {
    id: "operations-mapping-tab",
    route: "/operations",
    marker: "operations-tab-mappings",
    activateMarker: "operations-tab-mappings",
    title: "1. Ánh xạ món iPOS",
    content:
      "Tour đã mở tab Món ăn iPOS. Khai báo mã món đúng như dữ liệu xuất từ POS để hệ thống nhận diện doanh số.",
    allPermissions: ["ipos_mapping.read"],
  },
  {
    id: "operations-create-mapping",
    route: "/operations",
    marker: "operations-create-mapping",
    title: "Thêm món iPOS",
    content:
      "Bấm Thêm món iPOS, chọn cơ sở và nhập đúng mã/tên món từ iPOS. Mã sai sẽ khiến dòng bán hàng không ghép được khi import.",
    allPermissions: ["ipos_mapping.read", "ipos_mapping.manage"],
  },
  {
    id: "operations-recipe-tab",
    route: "/operations",
    marker: "operations-tab-recipes",
    activateMarker: "operations-tab-recipes",
    title: "2. Khai báo công thức BOM",
    content:
      "Tour đã chuyển sang Công thức. Mỗi món cần các nguyên liệu và định lượng chuẩn theo một đơn vị bán để tính tiêu hao lý thuyết.",
    allPermissions: ["recipe.read"],
  },
  {
    id: "operations-create-recipe",
    route: "/operations",
    marker: "operations-create-recipe",
    title: "Thêm định mức",
    content:
      "Bấm Thêm định mức, chọn món đã ánh xạ, thêm nguyên liệu và lượng tiêu hao. Kiểm tra đơn vị/quy đổi trước khi lưu để tránh phóng đại hao hụt.",
    allPermissions: ["recipe.read", "recipe.manage"],
  },
  {
    id: "operations-sales-tab",
    route: "/operations",
    marker: "operations-tab-sales",
    activateMarker: "operations-tab-sales",
    title: "3. Nhập dữ liệu bán hàng",
    content:
      "Tour đã mở tab Đợt nhập bán hàng. Mỗi file/đợt cần khóa chống lặp Idempotency-Key; web tự sinh khóa cho lần gửi để tránh ghi doanh số hai lần.",
    allPermissions: ["sales_import.read"],
  },
  {
    id: "operations-create-sales-import",
    route: "/operations",
    marker: "operations-create-sales-import",
    title: "Tạo đợt nhập doanh số",
    content:
      "Bấm Nhập dữ liệu bán, chọn cơ sở và kỳ dữ liệu rồi tải file đúng mẫu. Xem lỗi ánh xạ, sửa danh mục nếu cần; chỉ Commit khi tổng số dòng và doanh thu đã đúng.",
    allPermissions: ["sales_import.read", "sales_import.create"],
  },
  {
    id: "operations-variance-tab",
    route: "/operations",
    marker: "operations-tab-variance",
    activateMarker: "operations-tab-variance",
    title: "4. Đối soát hao hụt",
    content:
      "So sánh tiêu hao lý thuyết từ doanh số/BOM với biến động kho thực tế. Lọc theo cơ sở và kỳ; chỉ Tính lại khi dữ liệu bán hoặc công thức vừa được sửa.",
    allPermissions: ["variance.read"],
  },
  {
    id: "reports",
    route: "/reports",
    title: "Bước 10 — Báo cáo và đối soát",
    content:
      "Chọn đúng cơ sở trước, sau đó dùng từng báo cáo để đối chiếu tồn kho, tỷ lệ hoàn tất đơn, hao hụt, chênh lệch iPOS và thanh toán.",
  },
  {
    id: "reports-tabs",
    route: "/reports",
    marker: "reports-tabs",
    title: "Chọn đúng góc nhìn báo cáo",
    content:
      "Tồn kho dùng để kiểm số lượng; Hoàn tất đơn đo khả năng đáp ứng; Hỏng/hao hụt và iPOS tìm bất thường; Thanh toán dùng để đối chiếu nghĩa vụ với nhà cung cấp.",
  },
  {
    id: "system",
    route: "/system",
    title: "Bước 11 — Kiểm tra hệ thống và Audit Trail",
    content:
      "Sức khỏe API cho biết backend/database có sẵn sàng. Audit Trail ghi ai đã thay đổi gì, lúc nào và trên tài nguyên nào; dùng Request ID để lần theo một giao dịch cụ thể.",
  },
  {
    id: "audit-filters",
    route: "/system",
    marker: "audit-filters",
    title: "Tra cứu Audit Trail chính xác",
    content:
      "Kết hợp Hành động + Loại tài nguyên + Người thực hiện + khoảng ngày. Nếu đang điều tra một lỗi cụ thể, dán mã tài nguyên hoặc Request ID vào ô cuối để thu hẹp nhanh nhất.",
    allPermissions: ["audit.read"],
  },
  {
    id: "guide-finish",
    route: "/guide",
    marker: "admin-tour-restart",
    title: "Hoàn tất tour vận hành",
    content:
      "Trang Hướng dẫn giữ lại toàn bộ thứ tự thiết lập và flow hằng ngày. Khi cần xem lại, bấm Bắt đầu tour; tour sẽ tiếp tục tự chuyển trang và chỉ hiển thị các bước tài khoản của bạn có quyền dùng.",
  },
]

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items)

function canOpen(item: NavItem | undefined, permissions: string[]) {
  if (!item?.permission) return true
  const required = Array.isArray(item.permission) ? item.permission : [item.permission]
  return required.some((permission) => permissions.includes(permission))
}

function canUseStep(step: FlowStep, permissions: string[]) {
  if (step.allPermissions?.some((permission) => !permissions.includes(permission))) return false
  if (step.anyPermissions && !step.anyPermissions.some((permission) => permissions.includes(permission))) return false
  return true
}

function routeTarget(route: string) {
  return `[data-tour-page="${route}"] [data-tour="page-heading"]`
}

function markerTarget(route: string, marker: string) {
  return `[data-tour-page="${route}"] [data-tour="${marker}"]`
}

function TourLifecycle({ storageKey, enabled }: { storageKey?: string; enabled: boolean }) {
  const { start } = useTourActions()
  const startTour = React.useEffectEvent(() => start(0))

  React.useEffect(() => {
    if (!enabled || !storageKey) return
    const onStart = () => startTour()
    window.addEventListener(START_ADMIN_TOUR_EVENT, onStart)
    const timer = window.setTimeout(() => {
      try {
        if (!window.localStorage.getItem(storageKey)) startTour()
      } catch {
        startTour()
      }
    }, 700)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(START_ADMIN_TOUR_EVENT, onStart)
    }
  }, [enabled, storageKey])

  return null
}

export function AdminTourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const enabled = hasHydrated && Boolean(user) && pathname !== "/login"
  const storageKey = user ? `dica:admin-tour:${TOUR_VERSION}:${user.id}` : undefined

  const steps = React.useMemo<TourStep[]>(() => {
    const chromeSteps: TourStep[] = [
      {
        id: "navigation",
        target: '[data-tour="navigation-entry"]',
        title: "Điều hướng trong DICA",
        content:
          "Tên màn hình hiện tại luôn nằm ở đây. Trên điện thoại, nhấn nút menu để mở các nhóm nghiệp vụ; tour sẽ tự chuyển trang khi bạn bấm Tiếp theo.",
        position: "bottom-start",
        disableInteraction: true,
      },
      ...(permissions.includes("facility.read")
        ? [{
            id: "facility",
            target: '[data-tour="facility"]',
            title: "Phạm vi cơ sở",
            content:
              "Chọn cơ sở trước khi thao tác. Lựa chọn này quyết định dữ liệu mặc định trên dashboard và các màn hình nghiệp vụ.",
            position: "bottom-end" as const,
            disableInteraction: true,
          }]
        : []),
      {
        id: "search",
        target: '[data-tour="quick-search"]',
        title: "Tìm nhanh màn hình",
        content: "Mở bằng nút này hoặc Ctrl K / ⌘ K, gõ tên nghiệp vụ rồi Enter để đi thẳng tới trang cần làm.",
        position: "bottom-end",
        disableInteraction: true,
      },
      ...(permissions.includes("notification.read_own")
        ? [{
            id: "notifications",
            target: '[data-tour="notifications"]',
            title: "Thông báo cần xử lý",
            content:
              "Theo dõi yêu cầu chờ duyệt, cảnh báo tồn kho và sự kiện thuộc phạm vi của bạn. Bấm thông báo để mở đúng chứng từ liên quan.",
            position: "bottom-end" as const,
            disableInteraction: true,
          }]
        : []),
    ]

    const pageSteps = FLOW_STEPS.filter((step) => {
      const navItem = NAV_ITEMS.find((item) => item.href === step.route)
      return canOpen(navItem, permissions) && canUseStep(step, permissions)
    }).map<TourStep>((step) => {
      const target = step.marker ? markerTarget(step.route, step.marker) : routeTarget(step.route)
      return {
        id: `flow:${step.id}`,
        target,
        title: step.title,
        content: step.content,
        route: step.route,
        position: "bottom-start",
        spotlightPadding: 10,
        delay: step.marker ? 160 : 220,
        disableInteraction: true,
        ...(step.activateMarker
          ? {
              onActive: () => {
                const element = document.querySelector<HTMLElement>(
                  markerTarget(step.route, step.activateMarker!)
                )
                if (element?.getAttribute("data-state") !== "active") element?.click()
              },
            }
          : {}),
      }
    })

    return [...chromeSteps, ...pageSteps]
  }, [permissions])

  const markCompleted = React.useCallback(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, "completed")
    } catch {
      // Storage có thể bị chặn; việc đóng tour vẫn phải hoạt động bình thường.
    }
  }, [storageKey])

  const onStepChange = React.useCallback(
    (stepIndex: number) => {
      const nextRoute = steps[stepIndex]?.route
      if (nextRoute && pathname !== nextRoute) router.replace(nextRoute)
    },
    [pathname, router, steps]
  )

  const options = React.useMemo<TourOptions>(
    () => ({
      steps,
      autoStart: false,
      animation: "smooth",
      keyboardNavigation: true,
      closeOnEscape: true,
      closeOnOverlayClick: false,
      showProgress: true,
      showNavigation: true,
      showCloseButton: true,
      spotlightPadding: 8,
      scrollBehavior: "smooth",
      scrollMargin: 80,
      waitForTargetTimeout: 10_000,
      stepDelay: 120,
      labels: {
        next: "Tiếp theo",
        prev: "Quay lại",
        skip: "Bỏ qua",
        finish: "Hoàn tất",
        close: "Đóng hướng dẫn",
      },
      onStepChange,
      onEnd: markCompleted,
    }),
    [markCompleted, onStepChange, steps]
  )

  return (
    <TourProvider options={options}>
      <TourLifecycle storageKey={storageKey} enabled={enabled} />
      {children}
    </TourProvider>
  )
}
