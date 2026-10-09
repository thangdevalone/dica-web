# Tiến độ DICA Web Admin

Cập nhật: 09/10/2026. Web dành cho cấu hình; nghiệp vụ tạo/duyệt/xuất/nhận/hoàn hàng thực hiện trên mobile.

## Đã hoàn thành trên Web

- [x] Cấu hình cơ sở, kho, bộ phận, danh mục, quy đổi và nhà cung cấp.
- [x] Cấp hàng được xin theo nhóm/ngoại lệ và cấu hình nguồn cấp.
- [x] Tài khoản, liên kết NCC, role và quyền theo scope.
- [x] Giá chuẩn/ngưỡng, chính sách thanh toán hai người và thời hạn lưu ảnh.
- [x] Nhật ký cấu hình, ngừng sử dụng và xóa ADMIN có preview/mật khẩu.
- [x] Cấu hình mapping/định mức iPOS và rule cảnh báo thử nghiệm.
- [x] Bỏ modern-tour và dependency; hướng dẫn thay bằng 6 bước cấu hình, link theo quyền và tiêu chí hoàn thành.
- [x] Viết lại README đơn giản, có sơ đồ Mermaid và hướng dẫn local/deploy.
- [x] Lint/typecheck/build đạt; kiểm tra hướng dẫn desktop và 19 link route/tab.

Các mục trên xác nhận code và kiểm tra local, chưa thay thế nghiệm thu trên production.

## Còn cần kiểm tra hoặc tích hợp

- [ ] Kiểm thử hướng dẫn và các trang cấu hình trên màn hình nhỏ/thiết bị thật.
- [ ] Nghiệm thu bằng tài khoản ADMIN, quản lý và các scope thực tế; smoke test sau deploy.
- [ ] Xác nhận GitHub Actions của commit mới và deploy production thành công.

iPOS thật, cảnh báo tồn/hao hụt tự động, PDF cho NCC, R2/FCM và app mobile còn việc ở Backend/tích hợp. Không đánh dấu hoàn thành vì Web đã có màn hình cấu hình. Theo dõi tại [TASK Backend](https://github.com/thangdevalone/dica-backend/blob/main/TASK.md) và [review](https://github.com/thangdevalone/dica-backend/blob/main/docs/new-flow-implementation-review.md).

Push `main` kích hoạt CI/build/deploy theo environment production. Web không chạy migration; Backend chạy migrate và bootstrap trước khi bật API.
