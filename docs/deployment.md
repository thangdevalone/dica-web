# Deploy DICA Web lên VPS cùng DICA Backend

Tài liệu này hướng dẫn chi tiết cách triển khai frontend **DICA Web (Next.js)** trên VPS cùng với **DICA Backend (NestJS)**, thông qua **GitHub Actions CI/CD** và **Nginx Reverse Proxy**.

---

## 1. Kiến Trúc Triển Khai Production

```
                      INTERNET / TRÌNH DUYỆT
                               │
                       HTTPS (Cổng 443)
                               ▼
               ┌───────────────────────────────┐
               │    Nginx Reverse Proxy (VPS)  │
               └───────────────┬───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │ /api/*                              │ / (tất cả trang web)
            ▼                                     ▼
 ┌─────────────────────┐               ┌─────────────────────┐
 │    DICA Backend     │               │      DICA Web       │
 │   (NestJS Docker)   │               │  (Next.js Standalone│
 │   127.0.0.1:3000    │               │       Docker)       │
 └──────────┬──────────┘               │   127.0.0.1:3001    │
            │                          └─────────────────────┘
            ▼
 ┌─────────────────────┐
 │     PostgreSQL      │
 │  (Mạng Docker riêng)│
 └─────────────────────┘
```

- **dica-backend**: Chạy tại `/opt/dica-backend`, API bind cổng `127.0.0.1:3000`.
- **dica-web**: Chạy tại `/opt/dica-web`, Web bind cổng `127.0.0.1:3001`.
- **Nginx**: Phục vụ cổng 80/443, SSL tự động qua Let's Encrypt / Certbot, điều phối traffic và cache file tĩnh Next.js.
- Cả 2 service đều không mở port 3000 / 3001 ra ngoài Internet, đảm bảo an toàn tối đa.

---

## 2. Chuẩn Bị VPS

### Bước 2.1: Tạo thư mục deploy cho Web
Nếu đã có user `deploy` từ quá trình cài đặt backend:
```bash
sudo install -d -o deploy -g deploy -m 750 /opt/dica-web
```

### Bước 2.2: Tạo file cấu hình môi trường Production
Tạo file `/opt/dica-web/.env.production`:
```bash
sudo cp .env.production.example /opt/dica-web/.env.production
sudo chown deploy:deploy /opt/dica-web/.env.production
sudo chmod 600 /opt/dica-web/.env.production
```

Nội dung file `/opt/dica-web/.env.production`:
```ini
WEB_PORT=3001
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE=DICA
NEXT_PUBLIC_APP_NAME="DICA Admin"
NEXT_PUBLIC_APP_DESCRIPTION="Hệ Thống Quản Trị Chuỗi Cung Ứng & Tồn Kho F&B"
NEXT_PUBLIC_DEFAULT_THEME=system
```

> **Lưu ý**: Khi dùng `NEXT_PUBLIC_API_URL=/api/v1`, trình duyệt gọi API tương đối đến cùng domain với web thông qua Nginx, loại bỏ hoàn toàn lỗi CORS và không cần build lại image khi đổi IP/domain!

---

## 3. Cấu Hình Nginx

Xem hướng dẫn chi tiết tại thư mục [nginx/README.md](../nginx/README.md).
File cấu hình khuyên dùng:
- Copy `nginx/conf.d/dica-unified.conf` vào `/etc/nginx/conf.d/dica.conf`.
- Chạy Certbot để cấp chứng chỉ SSL:
  ```bash
  sudo certbot --nginx -d your-real-domain.com
  sudo systemctl reload nginx
  ```

---

## 4. Cấu Hình GitHub Secrets & Variables (Repository `dica-web`)

Vào GitHub Repository `thangdevalone/dica-web` > **Settings** > **Environments** > Tạo Environment tên `production`.

### Secrets (Bắt buộc)
Khai báo giống như ở `dica-backend`:

| Tên Secret            | Ý nghĩa                                         |
| --------------------- | ----------------------------------------------- |
| `VPS_HOST`            | IP hoặc hostname của VPS                        |
| `VPS_USER`            | User deploy trên VPS (ví dụ: `deploy`)          |
| `VPS_SSH_PRIVATE_KEY` | Private SSH key tương ứng để kết nối vào VPS    |
| `VPS_SSH_KNOWN_HOSTS` | Host key của VPS (lấy qua `ssh-keyscan -p 22 -H VPS_HOST`) |

### Variables (Tùy chọn)

| Tên Variable          | Mặc định         | Ghi chú                                           |
| --------------------- | ---------------- | ------------------------------------------------- |
| `VPS_PORT`            | `22`             | Cổng SSH của VPS                                  |
| `VPS_DEPLOY_PATH_WEB` | `/opt/dica-web`  | Đường dẫn triển khai trên VPS                     |
| `NEXT_PUBLIC_API_URL` | `/api/v1`        | URL API backend (nếu dùng subdomain: `https://api.domain.com/api/v1`) |

---

## 5. Quy Trình CI/CD Tự Động

Mỗi khi push hoặc merge vào branch `main`:
1. **Verify**:
   - Cài đặt dependency sạch với `npm ci`.
   - Quét lỗ hổng bảo mật với `npm audit --omit=dev --audit-level=high`.
   - Kiểm tra kiểu dữ liệu với `npm run typecheck`.
   - Kiểm tra đóng gói build với `npm run build`.
2. **Image**:
   - Đóng gói Docker image Next.js standalone đa tầng tối ưu (~150MB).
   - Đẩy lên GitHub Container Registry (`ghcr.io/thangdevalone/dica-web`).
   - Ghim image digest SHA256 bất biến.
3. **Deploy**:
   - Kết nối SSH vào VPS.
   - Upload file `docker-compose.yml`.
   - Tải image mới từ GHCR.
   - Khởi động lại container với zero downtime, kiểm tra healthcheck hoàn tất mới đánh dấu thành công.
   - Ghi lại `.deployed-image` và `.previous-image` để sẵn sàng rollback nếu cần.

---

## 6. Triển Khai Thủ Công Lần Đầu (Tùy chọn)

Nếu muốn khởi chạy nhanh trước khi kích hoạt GitHub Actions:
```bash
cd /opt/dica-web

# Đăng nhập GHCR (nếu package private)
# echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin

# Copy docker-compose.yml vào thư mục
# Đặt APP_IMAGE và khởi chạy:
export APP_IMAGE=ghcr.io/thangdevalone/dica-web:latest
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --wait
docker compose --env-file .env.production ps
curl -I http://127.0.0.1:3001/
```

---

## 7. Rollback Nhanh

Khi phiên bản mới gặp sự cố, rollback về phiên bản trước đó chỉ với 2 lệnh trên VPS:
```bash
cd /opt/dica-web
export APP_IMAGE="$(cat .previous-image)"
docker compose --env-file .env.production up -d --remove-orphans --wait
```

---

## 8. Xem Log Vận Hành

```bash
# Xem log trực tiếp của web:
cd /opt/dica-web
docker compose --env-file .env.production logs -f --tail=100 web

# Xem trạng thái container:
docker compose --env-file .env.production ps
```
