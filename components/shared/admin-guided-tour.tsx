"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  TourProvider,
  type TourOptions,
  type TourStep,
  useTourActions,
} from "modern-tour"
import { NAV_SECTIONS, type NavItem } from "@/constants"
import { useAuthStore } from "@/stores/use-auth-store"

export const START_ADMIN_TOUR_EVENT = "dica:start-admin-tour"

const TOUR_VERSION = "v5-complete-web-workflows"

interface FlowStep {
  id: string
  route: string
  title: string
  content: string
  marker?: string
  activateMarker?: string
  openViaMarker?: string
  closeDialogMarker?: string
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
    id: "dashboard-period",
    route: "/",
    marker: "dashboard-period",
    title: "Chọn đúng kỳ theo dõi",
    content:
      "Chọn 7, 14 hoặc 30 ngày để đổi phạm vi biểu đồ và các chỉ số theo kỳ. Nút Làm mới gọi lại số liệu ngay; bộ chọn Cơ sở trên thanh trên cùng vẫn là phạm vi dữ liệu chính của dashboard.",
  },
  {
    id: "dashboard-kpis",
    route: "/",
    marker: "dashboard-kpis",
    title: "Đọc thẻ KPI như một hàng đợi",
    content:
      "Mỗi thẻ là một tín hiệu cần hành động, không chỉ là thống kê. Ưu tiên yêu cầu chờ duyệt, đơn đang mở, điều chuyển đang chờ, sai lệch chưa xử lý và nguyên liệu dưới ngưỡng; bấm thẻ để sang đúng danh sách đã lọc.",
  },
  {
    id: "dashboard-work-queues",
    route: "/",
    marker: "dashboard-work-queues",
    title: "Đi từ tổng quan tới chứng từ",
    content:
      "Các khối Yêu cầu chờ xử lý, Đơn gần đây và Vận hành cho biết bản ghi cụ thể. Mở bản ghi để xử lý; sau khi duyệt, ghi sổ hoặc giải quyết sai lệch, quay lại và bấm Làm mới để kiểm tra hàng đợi đã giảm.",
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
    id: "organization-facility-form",
    route: "/organization",
    marker: "organization-facility-form-fields",
    activateMarker: "organization-tab-facilities",
    openViaMarker: "organization-create-facility",
    closeDialogMarker: "organization-facility-form",
    title: "Điền form cơ sở như thế nào?",
    content:
      "Mã cơ sở: viết ngắn, duy nhất và không đổi sau khi tạo, ví dụ BR01. Loại hình: chọn đúng Chi nhánh/Bếp trung tâm/Kho tổng. Tên cơ sở là tên nhân sự sẽ nhìn thấy. Điền đủ trường có dấu * thì nút lưu mới khả dụng; tour chỉ mở form minh họa và sẽ không tự lưu.",
    allPermissions: ["facility.manage"],
  },
  {
    id: "organization-location-tab",
    route: "/organization",
    marker: "organization-tab-locations",
    activateMarker: "organization-tab-locations",
    title: "Tiếp theo: tạo kho vật lý",
    content:
      "Tour đã mở tab Điểm lưu kho. Mỗi nơi có tồn thực tế phải là một kho vật lý thuộc cơ sở; địa điểm logic chỉ dùng để phân loại và không giữ số dư.",
    allPermissions: ["stock_location.read"],
  },
  {
    id: "organization-create-location",
    route: "/organization",
    marker: "organization-create-location",
    title: "Mở form thêm kho",
    content: "Bấm Thêm kho để khai báo kho nhận/xuất thực tế cho cơ sở.",
    allPermissions: ["stock_location.read", "stock_location.manage"],
  },
  {
    id: "organization-location-form",
    route: "/organization",
    marker: "organization-location-form-fields",
    activateMarker: "organization-tab-locations",
    openViaMarker: "organization-create-location",
    closeDialogMarker: "organization-location-form",
    title: "Điền form kho",
    content:
      "Chọn Cơ sở sở hữu, nhập Mã kho duy nhất, Loại kho và Tên kho. Chọn loại vật lý cho nơi có nhập/xuất/tồn thực; kho phải có trước khi gán làm kho nhận cho bộ phận.",
    allPermissions: ["stock_location.read", "stock_location.manage"],
  },
  {
    id: "organization-department-tab",
    route: "/organization",
    marker: "organization-tab-departments",
    activateMarker: "organization-tab-departments",
    title: "Cuối cùng: tạo bộ phận",
    content:
      "Tour đã mở tab Bộ phận. Bộ phận đại diện Bếp/Bàn/nhóm vận hành tại một cơ sở và là chủ thể lập yêu cầu hàng.",
    allPermissions: ["department.read"],
  },
  {
    id: "organization-create-department",
    route: "/organization",
    marker: "organization-create-department",
    title: "Mở form thêm bộ phận",
    content: "Bấm Thêm bộ phận sau khi cơ sở và kho nhận đã tồn tại.",
    allPermissions: ["department.read", "department.manage"],
  },
  {
    id: "organization-department-form",
    route: "/organization",
    marker: "organization-department-form-fields",
    activateMarker: "organization-tab-departments",
    openViaMarker: "organization-create-department",
    closeDialogMarker: "organization-department-form",
    title: "Điền form bộ phận",
    content:
      "Chọn Cơ sở, nhập Mã, Phân loại và Tên bộ phận; quan trọng nhất là Kho nhận hàng thuộc cùng cơ sở. Không gắn kho nhận thì bộ phận chưa thể tạo yêu cầu cấp hàng đúng flow.",
    allPermissions: ["department.read", "department.manage"],
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
    id: "catalog-unit-tab",
    route: "/catalog",
    marker: "catalog-tab-units",
    activateMarker: "catalog-tab-units",
    title: "1. Tạo đơn vị tính",
    content:
      "Tour đã mở tab Đơn vị tính. Tạo đơn vị cơ sở trước vì form nguyên liệu bắt buộc phải chọn một đơn vị.",
    allPermissions: ["unit.read"],
  },
  {
    id: "catalog-create-unit",
    route: "/catalog",
    marker: "catalog-create-unit",
    title: "Mở form đơn vị tính",
    content:
      "Bấm Thêm đơn vị để khai báo KG, G, LÍT, CHAI, THÙNG… theo cách doanh nghiệp đang kiểm kho.",
    allPermissions: ["unit.read", "unit.manage"],
  },
  {
    id: "catalog-unit-form",
    route: "/catalog",
    marker: "catalog-unit-form-fields",
    activateMarker: "catalog-tab-units",
    openViaMarker: "catalog-create-unit",
    closeDialogMarker: "catalog-unit-form",
    title: "Điền form đơn vị tính",
    content:
      "Mã đơn vị viết ngắn và duy nhất, Tên đơn vị để hiển thị; Số chữ số thập phân quyết định độ chính xác số lượng. Chọn phù hợp ngay từ đầu vì đơn vị sẽ được dùng trong sổ kho và quy đổi.",
    allPermissions: ["unit.read", "unit.manage"],
  },
  {
    id: "catalog-group-tab",
    route: "/catalog",
    marker: "catalog-tab-groups",
    activateMarker: "catalog-tab-groups",
    title: "2. Tạo nhóm nguyên liệu",
    content:
      "Nhóm giúp phân loại, lọc danh mục và tổng hợp báo cáo. Quyền xin hàng hiện được cấp chi tiết theo từng nguyên liệu ở màn hình Nguồn cấp.",
    allPermissions: ["ingredient.read"],
  },
  {
    id: "catalog-create-group",
    route: "/catalog",
    marker: "catalog-create-group",
    title: "Mở form nhóm nguyên liệu",
    content:
      "Bấm Thêm nhóm để tạo các nhóm như Thịt, Rau, Gia vị, Bia/Nước ngọt.",
    allPermissions: ["ingredient.read", "ingredient_group.manage"],
  },
  {
    id: "catalog-group-form",
    route: "/catalog",
    marker: "catalog-group-form-fields",
    activateMarker: "catalog-tab-groups",
    openViaMarker: "catalog-create-group",
    closeDialogMarker: "catalog-group-form",
    title: "Điền form nhóm",
    content:
      "Nhập Mã nhóm duy nhất và Tên nhóm dễ hiểu với người vận hành. Sau khi tạo, nhóm sẽ xuất hiện trong form nguyên liệu và cấu hình mặt hàng được phép xin.",
    allPermissions: ["ingredient.read", "ingredient_group.manage"],
  },
  {
    id: "catalog-ingredient-tab",
    route: "/catalog",
    marker: "catalog-tab-ingredients",
    activateMarker: "catalog-tab-ingredients",
    title: "3. Tạo nguyên liệu",
    content: "Tour đã trở về tab Nguyên liệu sau khi chuẩn bị đơn vị và nhóm.",
    allPermissions: ["ingredient.read"],
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
    id: "catalog-ingredient-form",
    route: "/catalog",
    marker: "catalog-ingredient-form-fields",
    activateMarker: "catalog-tab-ingredients",
    openViaMarker: "catalog-create-ingredient",
    closeDialogMarker: "catalog-ingredient-form",
    title: "Điền form nguyên liệu",
    content:
      "Mã nguyên liệu phải duy nhất; Đơn vị cơ sở là đơn vị sổ kho và không đổi sau khi tạo; Tên dùng để tìm kiếm; Nhóm giúp phân quyền xin hàng và báo cáo. Nếu chưa chọn được đơn vị/nhóm, đóng form và tạo chúng ở các tab tương ứng trước.",
    allPermissions: ["ingredient.manage"],
  },
  {
    id: "catalog-conversion-tab",
    route: "/catalog",
    marker: "catalog-tab-conversions",
    activateMarker: "catalog-tab-conversions",
    title: "4. Khai báo quy đổi đơn vị",
    content:
      "Dùng khi đơn vị mua/xin khác đơn vị cơ sở, ví dụ 1 THÙNG = 24 CHAI.",
    allPermissions: ["conversion.read"],
  },
  {
    id: "catalog-create-conversion",
    route: "/catalog",
    marker: "catalog-create-conversion",
    title: "Mở form quy đổi",
    content:
      "Bấm Thêm quy đổi sau khi nguyên liệu và cả hai đơn vị đã tồn tại.",
    allPermissions: ["conversion.read", "conversion.manage"],
  },
  {
    id: "catalog-conversion-form",
    route: "/catalog",
    marker: "catalog-conversion-form-fields",
    activateMarker: "catalog-tab-conversions",
    openViaMarker: "catalog-create-conversion",
    closeDialogMarker: "catalog-conversion-form",
    title: "Điền form quy đổi",
    content:
      "Chọn Nguyên liệu, Đơn vị quy đổi và Hệ số về đơn vị cơ sở. Ví dụ nguyên liệu có đơn vị cơ sở CHAI thì THÙNG với hệ số 24 nghĩa là 1 thùng bằng 24 chai. Ngày hiệu lực cho phép giữ đúng lịch sử khi hệ số thay đổi.",
    allPermissions: ["conversion.read", "conversion.manage"],
  },
  {
    id: "catalog-supplier-tab",
    route: "/catalog",
    marker: "catalog-tab-suppliers",
    activateMarker: "catalog-tab-suppliers",
    title: "5. Tạo nhà cung cấp",
    content:
      "Nhà cung cấp phải tồn tại trước khi dùng nguồn SUPPLIER hoặc liên kết giá/SKU.",
    allPermissions: ["supplier.read"],
  },
  {
    id: "catalog-create-supplier",
    route: "/catalog",
    marker: "catalog-create-supplier",
    title: "Mở form nhà cung cấp",
    content: "Bấm Thêm nhà cung cấp để lưu thông tin đối tác mua hàng.",
    allPermissions: ["supplier.read", "supplier.manage"],
  },
  {
    id: "catalog-supplier-form",
    route: "/catalog",
    marker: "catalog-supplier-form-fields",
    activateMarker: "catalog-tab-suppliers",
    openViaMarker: "catalog-create-supplier",
    closeDialogMarker: "catalog-supplier-form",
    title: "Điền form nhà cung cấp",
    content:
      "Nhập Mã NCC và Tên bắt buộc; Điện thoại và Email giúp tra cứu/liên hệ. Tài khoản loại SUPPLIER sẽ được liên kết với một nhà cung cấp đã tạo tại đây.",
    allPermissions: ["supplier.read", "supplier.manage"],
  },
  {
    id: "catalog-link-tab",
    route: "/catalog",
    marker: "catalog-tab-links",
    activateMarker: "catalog-tab-links",
    title: "6. Liên kết hàng của nhà cung cấp",
    content:
      "Liên kết xác định nhà cung cấp bán nguyên liệu nào, SKU bên họ và giá tham chiếu.",
    allPermissions: ["supplier_ingredient.read"],
  },
  {
    id: "catalog-create-supplier-link",
    route: "/catalog",
    marker: "catalog-create-supplier-link",
    title: "Mở form liên kết NCC – nguyên liệu",
    content: "Bấm Liên kết mới trước khi cấu hình nguồn cấp loại SUPPLIER.",
    allPermissions: ["supplier_ingredient.read", "supplier_ingredient.manage"],
  },
  {
    id: "catalog-supplier-link-form",
    route: "/catalog",
    marker: "catalog-supplier-link-form-fields",
    activateMarker: "catalog-tab-links",
    openViaMarker: "catalog-create-supplier-link",
    closeDialogMarker: "catalog-supplier-link-form",
    title: "Điền form liên kết nhà cung cấp",
    content:
      "Chọn Nhà cung cấp và Nguyên liệu, thêm SKU của NCC nếu có và Giá tham chiếu. Một nguyên liệu có thể có nhiều nhà cung cấp; liên kết này là điều kiện để nhà cung cấp xuất hiện trong form nguồn cấp.",
    allPermissions: ["supplier_ingredient.read", "supplier_ingredient.manage"],
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
    id: "sourcing-rule-form",
    route: "/sourcing",
    marker: "sourcing-rule-form-fields",
    activateMarker: "sourcing-tab-rules",
    openViaMarker: "sourcing-create-rule",
    closeDialogMarker: "sourcing-rule-form",
    title: "Điền form nguồn cấp",
    content:
      "Chọn Cơ sở nhận và Nguyên liệu trước. Loại STOCK yêu cầu Kho xuất vật lý; loại SUPPLIER yêu cầu Nhà cung cấp đã liên kết với nguyên liệu. Mỗi cặp cơ sở–nguyên liệu chỉ có một nguồn hiệu lực; đổi nguồn sẽ tạo revision để truy vết.",
    allPermissions: ["source_rule.manage"],
  },
  {
    id: "sourcing-bulk",
    route: "/sourcing",
    marker: "sourcing-bulk",
    activateMarker: "sourcing-tab-rules",
    title: "Cấu hình nhiều nguồn cùng lúc",
    content:
      "Dùng Cập nhật hàng loạt khi khởi tạo nhiều cơ sở/nguyên liệu. Chuẩn bị mã cơ sở, mã nguyên liệu và mã kho hoặc mã nhà cung cấp trước; lỗi ở một dòng sẽ chặn cả lần áp dụng để tránh cấu hình dở dang.",
    allPermissions: ["source_rule.read", "source_rule.bulk_update"],
  },
  {
    id: "sourcing-bulk-form",
    route: "/sourcing",
    marker: "sourcing-bulk-form-fields",
    activateMarker: "sourcing-tab-rules",
    openViaMarker: "sourcing-bulk",
    closeDialogMarker: "sourcing-bulk-form",
    title: "Nhập nguồn cấp hàng loạt",
    content:
      "Mỗi dòng theo mẫu MÃ_CƠ_SỞ,MÃ_NGUYÊN_LIỆU,STOCK|SUPPLIER,MÃ_NGUỒN. Với STOCK, cột cuối là mã kho vật lý; với SUPPLIER là mã nhà cung cấp. Có thể dùng dấu phẩy, chấm phẩy hoặc tab; kiểm tra mã viết đúng rồi mới Áp dụng.",
    allPermissions: ["source_rule.read", "source_rule.bulk_update"],
  },
  {
    id: "sourcing-eligibility-tab",
    route: "/sourcing",
    marker: "sourcing-tab-eligibility",
    activateMarker: "sourcing-tab-eligibility",
    title: "Cấp mặt hàng được phép xin",
    content:
      "Tour đã mở tab Hàng được phép xin. Đây là bước nối bộ phận với danh sách nguyên liệu họ nhìn thấy khi lập yêu cầu.",
    allPermissions: ["eligibility.read"],
  },
  {
    id: "sourcing-create-eligibility",
    route: "/sourcing",
    marker: "sourcing-create-eligibility",
    title: "Mở form cấp quyền xin hàng",
    content: "Bấm Cấp quyền xin hàng để cấu hình cho một bộ phận.",
    allPermissions: ["eligibility.read", "eligibility.manage"],
  },
  {
    id: "sourcing-eligibility-form",
    route: "/sourcing",
    marker: "sourcing-eligibility-form-fields",
    activateMarker: "sourcing-tab-eligibility",
    openViaMarker: "sourcing-create-eligibility",
    closeDialogMarker: "sourcing-eligibility-form",
    title: "Điền form quyền xin hàng",
    content:
      "Chọn Cơ sở rồi Bộ phận, thêm một hoặc nhiều nguyên liệu và đặt số lượng tối đa mỗi lần gọi nếu cần. Chỉ các nguyên liệu được cấp ở đây mới xuất hiện trong form yêu cầu của bộ phận đó.",
    allPermissions: ["eligibility.read", "eligibility.manage"],
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
    id: "users-role-form",
    route: "/users",
    marker: "users-role-form-fields",
    activateMarker: "users-tab-roles",
    openViaMarker: "users-create-role",
    closeDialogMarker: "users-role-form",
    title: "Cấu hình vai trò trong form",
    content:
      "Mã vai trò viết liền, không dấu và không đổi sau khi tạo; Tên hiển thị mô tả công việc. Trong Bộ quyền, tìm theo tên/mã, chọn đúng các thao tác cần dùng rồi rà lại trước khi lưu. Quyền chỉ quyết định được làm gì; phạm vi dữ liệu sẽ cấu hình ở Grant.",
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
    id: "users-user-form",
    route: "/users",
    marker: "users-user-form-fields",
    activateMarker: "users-tab-users",
    openViaMarker: "users-create-user",
    closeDialogMarker: "users-user-form",
    title: "Điền form tài khoản",
    content:
      "Chọn INTERNAL cho nhân sự hoặc SUPPLIER cho tài khoản đại diện nhà cung cấp. Nhập tên đăng nhập, họ tên và mật khẩu khởi tạo; chọn vai trò rồi chọn Scope. ORGANIZATION thấy toàn tổ chức, FACILITY theo cơ sở, STOCK_LOCATION theo kho, DEPARTMENT theo bộ phận, OWN chỉ dữ liệu của chính người dùng.",
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
    id: "users-grant-form",
    route: "/users",
    marker: "users-grant-form-fields",
    activateMarker: "users-tab-grants",
    openViaMarker: "users-create-grant",
    closeDialogMarker: "users-grant-form",
    title: "Điền form Grant",
    content:
      "Tìm người dùng, chọn vai trò và Scope. Với FACILITY chọn cơ sở; STOCK_LOCATION chọn cơ sở rồi kho; DEPARTMENT chọn cơ sở rồi bộ phận. Một người có thể có nhiều Grant, nhưng không nên cấp phạm vi rộng hơn nhu cầu thực tế.",
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
    id: "requests-create-form",
    route: "/requests",
    marker: "requests-create-form-fields",
    openViaMarker: "requests-create",
    closeDialogMarker: "requests-create-form",
    title: "Điền form yêu cầu hàng",
    content:
      "Chọn Cơ sở rồi Bộ phận nhận; danh sách bộ phận chỉ hiện nơi đã gán kho nhận. Chọn ngày cần hàng, thêm ghi chú nếu cần, sau đó thêm từng nguyên liệu được cấp quyền và số lượng theo đơn vị hiển thị. Nút Tạo bản nháp chưa gửi duyệt; phải mở bản nháp và bấm Gửi duyệt ở bước sau.",
    allPermissions: ["request.create"],
  },
  {
    id: "requests-lifecycle",
    route: "/requests",
    marker: "requests-list",
    title: "Hoàn tất vòng đời yêu cầu",
    content:
      "Tìm theo mã/ghi chú hoặc lọc trạng thái, rồi bấm một dòng để mở chi tiết. DRAFT: người lập còn sửa và Gửi duyệt. SUBMITTED: người có quyền duyệt chọn Duyệt, Từ chối hoặc Yêu cầu sửa. APPROVED sẽ tự sinh đơn theo từng nguồn; không tạo lại yêu cầu để tránh trùng hàng.",
    allPermissions: ["request.read"],
  },
  {
    id: "orders",
    route: "/orders",
    title: "Bước 6 — Theo dõi đơn thực hiện",
    content:
      "Đơn được tạo tự động sau khi yêu cầu được duyệt, không tạo tay tại đây. Mở từng dòng để xem nguồn STOCK/SUPPLIER, lượng cần giao, đã giao, còn thiếu, chứng từ nhà cung cấp và trạng thái thanh toán.",
  },
  {
    id: "orders-list",
    route: "/orders",
    marker: "orders-list",
    title: "Đọc và xử lý đơn thực hiện",
    content:
      "Lọc theo trạng thái và loại nguồn rồi bấm dòng để xem chi tiết. Với STOCK, tiếp tục ở Giao nhận để lập phiếu xuất. Với SUPPLIER, có thể xuất phiếu gửi NCC và cập nhật số đã thanh toán. Chỉ Đóng phần chưa giao khi chắc chắn không nhận thêm; Hủy chỉ dùng trước khi phát sinh giao nhận không thể đảo ngược.",
    allPermissions: ["order.read"],
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
    id: "transfers-create-form",
    route: "/transfers",
    marker: "transfers-create-form-fields",
    openViaMarker: "transfers-create",
    closeDialogMarker: "transfers-create-form",
    title: "Điền form điều chuyển",
    content:
      "Kho xuất và Kho nhận phải khác nhau. Thời gian dự kiến nhận dùng để thông báo cho bên nhận; ghi chú nêu mục đích/chuyến xe. Thêm nguyên liệu và số lượng cần chuyển. Tạo phiếu nháp xong vẫn phải Gửi duyệt; tuyến Kho tổng ↔ Bếp trung tâm có thể tự duyệt theo chính sách.",
    allPermissions: ["transfer.create"],
  },
  {
    id: "transfers-lifecycle",
    route: "/transfers",
    marker: "transfers-list",
    title: "Gửi duyệt và theo dõi điều chuyển",
    content:
      "Bấm một dòng để mở chi tiết. DRAFT có thể sửa hoặc Gửi duyệt; SUBMITTED chờ người có quyền phê duyệt; APPROVED/RELEASED chuyển sang lập phiếu xuất ở Giao nhận. Sau khi nơi nhận ghi sổ phiếu nhập, kiểm tra lượng đã xuất, đã nhận và phần còn thiếu trước khi đóng hồ sơ.",
    allPermissions: ["transfer.read"],
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
    id: "delivery-dispatch-form",
    route: "/delivery",
    marker: "delivery-dispatch-form-fields",
    activateMarker: "delivery-tab-dispatches",
    openViaMarker: "delivery-create-dispatch",
    closeDialogMarker: "delivery-dispatch-form",
    title: "Điền phiếu xuất kho",
    content:
      "Chọn đơn thực hiện đang mở; hệ thống nạp các dòng đã duyệt, đã xuất và lượng còn lại. Nhập lượng xuất đợt này cho từng mặt hàng và ghi chú xe/niêm phong nếu có. Tạo phiếu mới chỉ là chứng từ; chỉ ghi sổ khi hàng đã thực sự rời kho.",
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
    id: "delivery-receipt-form",
    route: "/delivery",
    marker: "delivery-receipt-form-fields",
    activateMarker: "delivery-tab-receipts",
    openViaMarker: "delivery-create-receipt",
    closeDialogMarker: "delivery-receipt-form",
    title: "Điền phiếu nhập nhận hàng",
    content:
      "Chọn đơn đang giao và, nếu có, phiếu xuất liên quan. Nhập số thực nhận sau khi kiểm đếm và ghi tình trạng bao bì/nhiệt độ. Ảnh xác nhận thuộc flow mobile; form web này tập trung vào số thực nhận. Thiếu/thừa phải ghi đúng để hệ thống tạo sai lệch, không sửa số để ép khớp.",
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
    id: "inventory-balances-tab",
    route: "/inventory",
    marker: "inventory-tab-balances",
    activateMarker: "inventory-tab-balances",
    title: "Kiểm tra tồn tức thời",
    content:
      "Lọc theo cơ sở rồi kho, tìm nguyên liệu và đọc số dư hiện tại. Đây là số đã ghi sổ; phiếu xuất/nhập còn DRAFT chưa xuất hiện. Nếu số không đúng, mở Sổ cái trước để tìm chứng từ gây chênh lệch thay vì lập điều chỉnh ngay.",
    allPermissions: ["stock.read"],
  },
  {
    id: "inventory-ledger-tab",
    route: "/inventory",
    marker: "inventory-tab-ledger",
    activateMarker: "inventory-tab-ledger",
    title: "Truy vết bằng Sổ cái kho",
    content:
      "Chọn kho và loại nghiệp vụ để xem từng bút toán tăng/giảm. Đối chiếu mã tham chiếu với phiếu xuất, nhập, điều chỉnh, kiểm kê hoặc báo hỏng; tổng các bút toán là căn cứ giải thích số tồn tức thời.",
    allPermissions: ["stock_ledger.read"],
  },
  {
    id: "inventory-stocktake-tab",
    route: "/inventory",
    marker: "inventory-tab-stocktakes",
    activateMarker: "inventory-tab-stocktakes",
    title: "Kiểm kê định kỳ",
    content:
      "Theo flow, nhân sự kho/cơ sở lập và nhập số đếm trên mobile; web admin dùng tab này để theo dõi các đợt kiểm kê và kết quả chênh lệch. Vì vậy web không hiển thị nút tạo kiểm kê tại đây.",
    allPermissions: ["stocktake.read"],
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
    id: "inventory-adjustment-form",
    route: "/inventory",
    marker: "inventory-adjustment-form-fields",
    activateMarker: "inventory-tab-adjustments",
    openViaMarker: "inventory-create-adjustment",
    closeDialogMarker: "inventory-adjustment-form",
    title: "Điền phiếu điều chỉnh tồn",
    content:
      "Chọn kho và nguyên liệu, nhập số dương để tăng hoặc số âm để giảm, tối đa 3 chữ số thập phân. Lý do tối thiểu 3 ký tự và phải đủ để kiểm toán. Tạo phiếu chưa đổi tồn; chỉ bước ghi sổ có quyền mới làm thay đổi số dư.",
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
    id: "inventory-damage-form",
    route: "/inventory",
    marker: "inventory-damage-form-fields",
    activateMarker: "inventory-tab-damage",
    openViaMarker: "inventory-create-damage",
    closeDialogMarker: "inventory-damage-form",
    title: "Điền biên bản báo hỏng",
    content:
      "Chọn kho, nhập lý do chung, nguyên liệu, số lượng hỏng lớn hơn 0 và ghi chú chi tiết như rách bao bì/hết hạn. Biên bản phải phản ánh số thực tế; quy trình xác nhận sau đó mới cho phép trừ kho và lưu Audit Trail.",
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
    id: "operations-mapping-form",
    route: "/operations",
    marker: "operations-mapping-form-fields",
    activateMarker: "operations-tab-mappings",
    openViaMarker: "operations-create-mapping",
    closeDialogMarker: "operations-mapping-form",
    title: "Điền form ánh xạ iPOS",
    content:
      "Chọn cơ sở, giữ nguồn IPOS nếu đúng hệ thống đang dùng, nhập External Key chính xác như file bán hàng và tên món dễ nhận biết. External Key là khóa ghép dữ liệu; sai một ký tự sẽ khiến doanh số không tìm thấy công thức.",
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
    id: "operations-recipe-form",
    route: "/operations",
    marker: "operations-recipe-form-fields",
    activateMarker: "operations-tab-recipes",
    openViaMarker: "operations-create-recipe",
    closeDialogMarker: "operations-recipe-form",
    title: "Điền form định mức BOM",
    content:
      "Chọn món iPOS đã ánh xạ, kho xuất nguyên liệu và thời điểm hiệu lực. Với từng dòng, chọn nguyên liệu và lượng tiêu hao theo đơn vị cơ sở cho một món bán; dùng Thêm dòng nếu công thức có nhiều thành phần. Phiên bản mới chỉ áp dụng từ thời điểm hiệu lực.",
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
    id: "operations-sales-form",
    route: "/operations",
    marker: "operations-sales-form-fields",
    activateMarker: "operations-tab-sales",
    openViaMarker: "operations-create-sales-import",
    closeDialogMarker: "operations-sales-form",
    title: "Điền form đợt nhập doanh số",
    content:
      "Chọn cơ sở, nguồn IPOS và mã đợt duy nhất. Mỗi dòng CSV gồm mã giao dịch, mã món iPOS, thời gian ISO có múi giờ và số lượng. Form chỉ tạo đợt nhập để kiểm tra; sau khi sửa hết lỗi ánh xạ và đối chiếu tổng, mới Commit đợt dữ liệu.",
    allPermissions: ["sales_import.read", "sales_import.create"],
  },
  {
    id: "operations-sales-lifecycle",
    route: "/operations",
    marker: "operations-sales-list",
    activateMarker: "operations-tab-sales",
    title: "Validate, xem trước rồi Commit",
    content:
      "Đợt DRAFT phải Validate trước. Mở Xem trước để kiểm số dòng hợp lệ/lỗi và các mã món chưa ánh xạ; sửa ánh xạ rồi Validate lại. Chỉ Commit trạng thái VALIDATED sau khi đối chiếu kỳ, số giao dịch và số lượng vì commit đưa dữ liệu vào tính tiêu hao và không nên lặp lại.",
    allPermissions: ["sales_import.read"],
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
    id: "operations-recalculate",
    route: "/operations",
    marker: "operations-recalculate",
    activateMarker: "operations-tab-variance",
    title: "Chọn đúng kỳ cần tính lại",
    content:
      "Bấm Tính lại khi doanh số đã commit, BOM đã có hiệu lực và phiếu kiểm kê của kỳ đã gửi. Tính lại không thay đổi tồn kho; nó dựng lại số tiêu hao lý thuyết và chênh lệch cho kỳ được chọn.",
    allPermissions: ["variance.read", "variance.recalculate"],
  },
  {
    id: "operations-recalculate-form",
    route: "/operations",
    marker: "operations-recalculate-form-fields",
    activateMarker: "operations-tab-variance",
    openViaMarker: "operations-recalculate",
    closeDialogMarker: "operations-recalculate-form",
    title: "Tính lại theo phiếu kiểm kê",
    content:
      "Chọn phiếu kiểm kê đã gửi của đúng kho và ngày nghiệp vụ. Hệ thống dùng mốc kiểm kê, doanh số đã commit và BOM có hiệu lực để tính; nếu danh sách trống, cần hoàn tất/gửi phiếu kiểm kê trước.",
    allPermissions: ["variance.read", "variance.recalculate"],
  },
  {
    id: "operations-alert-tab",
    route: "/operations",
    marker: "operations-tab-alerts",
    activateMarker: "operations-tab-alerts",
    title: "5. Cấu hình cảnh báo tồn",
    content:
      "Quy tắc cảnh báo có thể áp dụng toàn hệ thống hoặc thu hẹp theo cơ sở/nguyên liệu. Dùng ít quy tắc rõ ràng, tránh nhiều ngưỡng chồng nhau khiến người vận hành nhận thông báo trùng.",
    allPermissions: ["alert_rule.manage"],
  },
  {
    id: "operations-create-alert",
    route: "/operations",
    marker: "operations-create-alert",
    title: "Thêm ngưỡng cảnh báo",
    content:
      "Bấm Thêm cảnh báo rồi quyết định phạm vi, loại ngưỡng số lượng tuyệt đối hay phần trăm và giá trị kích hoạt. Quy tắc mới dùng cho các lần đánh giá tồn tiếp theo.",
    allPermissions: ["alert_rule.manage"],
  },
  {
    id: "operations-alert-form",
    route: "/operations",
    marker: "operations-alert-form-fields",
    activateMarker: "operations-tab-alerts",
    openViaMarker: "operations-create-alert",
    closeDialogMarker: "operations-alert-form",
    title: "Điền form cảnh báo tồn",
    content:
      "Để trống Cơ sở để áp dụng toàn tổ chức, để trống Nguyên liệu để áp dụng tất cả mặt hàng trong phạm vi. QUANTITY là số lượng theo đơn vị cơ sở; PERCENT là tỷ lệ phần trăm. Giá trị phải lớn hơn 0; nên bắt đầu bằng ngưỡng thực sự cần hành động rồi hiệu chỉnh theo dữ liệu vận hành.",
    allPermissions: ["alert_rule.manage"],
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
    id: "reports-filters",
    route: "/reports",
    marker: "reports-filters",
    title: "Đặt phạm vi báo cáo trước",
    content:
      "Chọn một cơ sở để điều tra chi tiết hoặc Tất cả cơ sở để so sánh toàn tổ chức. Bộ lọc được dùng chung khi đổi tab; nếu kết quả trống, kiểm tra lại cơ sở và quyền dữ liệu trước khi kết luận chưa có phát sinh.",
  },
  {
    id: "reports-stock",
    route: "/reports",
    marker: "reports-tab-stock",
    activateMarker: "reports-tab-stock",
    title: "Báo cáo tồn kho",
    content:
      "Đọc số lượng theo nguyên liệu/kho/cơ sở và chú ý các dòng dưới ngưỡng. Dùng báo cáo để rà tổng thể; khi cần giải thích một con số, chuyển sang Kho & Tồn kho → Sổ cái để xem từng bút toán.",
    allPermissions: ["report.stock"],
  },
  {
    id: "reports-fulfillment",
    route: "/reports",
    marker: "reports-tab-fulfillment",
    activateMarker: "reports-tab-fulfillment",
    title: "Báo cáo tỷ lệ hoàn tất đơn",
    content:
      "So sánh lượng được duyệt với lượng đã nhận để tìm tuyến/kho/NCC thường giao thiếu. Tỷ lệ thấp cần được đối chiếu với đơn PARTIAL, phần đã đóng và sai lệch giao nhận trước khi đánh giá hiệu suất.",
    allPermissions: ["report.fulfillment"],
  },
  {
    id: "reports-damage",
    route: "/reports",
    marker: "reports-tab-damage",
    activateMarker: "reports-tab-damage",
    title: "Báo cáo hỏng và hao hụt",
    content:
      "Tổng hợp số lượng hỏng/hết hạn theo kho và nguyên liệu. Dùng để nhận diện lặp lại theo mặt hàng hoặc cơ sở, sau đó mở biên bản gốc trong Kho & Tồn kho để xem lý do và người xác nhận.",
    allPermissions: ["report.damage"],
  },
  {
    id: "reports-variance",
    route: "/reports",
    marker: "reports-tab-variance",
    activateMarker: "reports-tab-variance",
    title: "Báo cáo đối soát iPOS",
    content:
      "Expected là tiêu hao theo doanh số và BOM; Actual là biến động/kiểm kê thực tế; Variance là phần chênh. Trạng thái dữ liệu chưa đủ thường do thiếu ánh xạ, BOM, doanh số commit hoặc phiếu kiểm kê — sửa dữ liệu nguồn rồi Tính lại.",
    allPermissions: ["report.variance"],
  },
  {
    id: "reports-payment",
    route: "/reports",
    marker: "reports-tab-payment",
    activateMarker: "reports-tab-payment",
    title: "Báo cáo đối soát thanh toán",
    content:
      "So sánh giá trị đã đối soát với số đã thanh toán theo đơn nhà cung cấp. Muốn cập nhật, mở đơn ở Đơn thực hiện → Đối soát thanh toán; không nhập vượt giá trị đã đối soát và kiểm tra trạng thái PARTIAL/PAID sau khi lưu.",
    allPermissions: ["report.payment"],
  },
  {
    id: "system",
    route: "/system",
    title: "Bước 11 — Kiểm tra hệ thống và Audit Trail",
    content:
      "Sức khỏe API cho biết backend/database có sẵn sàng. Audit Trail ghi ai đã thay đổi gì, lúc nào và trên tài nguyên nào; dùng Request ID để lần theo một giao dịch cụ thể.",
  },
  {
    id: "system-health",
    route: "/system",
    marker: "system-health",
    title: "Phân biệt lỗi hệ thống và lỗi dữ liệu",
    content:
      "API Backend và PostgreSQL phải ở trạng thái sẵn sàng; thẻ Phiên xác thực cho biết tài khoản đang dùng. Nếu API/DB lỗi, bấm Làm mới và báo kỹ thuật kèm thời điểm. Nếu hệ thống khỏe nhưng thao tác thiếu dữ liệu, kiểm tra quyền, phạm vi cơ sở và Audit Trail.",
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
  const required = Array.isArray(item.permission)
    ? item.permission
    : [item.permission]
  return required.some((permission) => permissions.includes(permission))
}

function canUseStep(step: FlowStep, permissions: string[]) {
  if (
    step.allPermissions?.some((permission) => !permissions.includes(permission))
  )
    return false
  if (
    step.anyPermissions &&
    !step.anyPermissions.some((permission) => permissions.includes(permission))
  )
    return false
  return true
}

function routeTarget(route: string) {
  return `[data-tour-page="${route}"] [data-tour="page-heading"]`
}

function markerTarget(route: string, marker: string) {
  return `[data-tour-page="${route}"] [data-tour="${marker}"]`
}

function portalTarget(marker: string) {
  return `[data-tour="${marker}"]`
}

function prepareInteractiveStep(step: FlowStep) {
  if (!step.marker) return

  const attempt = () => {
    if (document.querySelector(portalTarget(step.marker!))) return true

    if (step.activateMarker) {
      const tab = document.querySelector<HTMLElement>(
        markerTarget(step.route, step.activateMarker)
      )
      if (tab && tab.getAttribute("data-state") !== "active") {
        tab.click()
        return false
      }
    }

    if (!step.openViaMarker) return true

    const opener = document.querySelector<HTMLElement>(
      markerTarget(step.route, step.openViaMarker)
    )
    if (!opener) return false
    opener.click()
    return true
  }

  if (attempt()) return
  const observer = new MutationObserver(() => {
    if (attempt()) observer.disconnect()
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  })
  window.setTimeout(() => observer.disconnect(), 10_000)
}

function closeTourDialog(marker: string) {
  const cancel = document.querySelector<HTMLElement>(
    `${portalTarget(marker)} [data-tour="${marker}-cancel"]`
  )
  cancel?.click()
}

function TourLifecycle({
  storageKey,
  enabled,
}: {
  storageKey?: string
  enabled: boolean
}) {
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
  const storageKey = user
    ? `dica:admin-tour:${TOUR_VERSION}:${user.id}`
    : undefined

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
        ? [
            {
              id: "facility",
              target: '[data-tour="facility"]',
              title: "Phạm vi cơ sở",
              content:
                "Chọn cơ sở trước khi thao tác. Lựa chọn này quyết định dữ liệu mặc định trên dashboard và các màn hình nghiệp vụ.",
              position: "bottom-end" as const,
              disableInteraction: true,
            },
          ]
        : []),
      {
        id: "search",
        target: '[data-tour="quick-search"]',
        title: "Tìm nhanh màn hình",
        content:
          "Mở bằng nút này hoặc Ctrl K / ⌘ K, gõ tên nghiệp vụ rồi Enter để đi thẳng tới trang cần làm.",
        position: "bottom-end",
        disableInteraction: true,
      },
      ...(permissions.includes("notification.read_own")
        ? [
            {
              id: "notifications",
              target: '[data-tour="notifications"]',
              title: "Thông báo cần xử lý",
              content:
                "Theo dõi yêu cầu chờ duyệt, cảnh báo tồn kho và sự kiện thuộc phạm vi của bạn. Bấm thông báo để mở đúng chứng từ liên quan.",
              position: "bottom-end" as const,
              disableInteraction: true,
            },
          ]
        : []),
    ]

    const pageSteps = FLOW_STEPS.filter((step) => {
      const navItem = NAV_ITEMS.find((item) => item.href === step.route)
      return canOpen(navItem, permissions) && canUseStep(step, permissions)
    }).map<TourStep>((step) => {
      const target = step.marker
        ? step.closeDialogMarker
          ? portalTarget(step.marker)
          : markerTarget(step.route, step.marker)
        : routeTarget(step.route)
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
                if (element?.getAttribute("data-state") !== "active")
                  element?.click()
              },
            }
          : {}),
        ...(step.closeDialogMarker
          ? { onLeave: () => closeTourDialog(step.closeDialogMarker!) }
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
      const nextStep = steps[stepIndex]
      const nextRoute = nextStep?.route
      if (nextRoute && pathname !== nextRoute) router.replace(nextRoute)
      if (typeof nextStep?.id === "string" && nextStep.id.startsWith("flow:")) {
        const flowStep = FLOW_STEPS.find(
          (step) => `flow:${step.id}` === nextStep.id
        )
        if (flowStep?.activateMarker || flowStep?.openViaMarker) {
          window.setTimeout(() => prepareInteractiveStep(flowStep), 0)
        }
      }
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
