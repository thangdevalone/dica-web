# Hướng Dẫn Triển Khai DICA Web (VPS & CI/CD)

Tài liệu triển khai frontend **DICA Web (Next.js)** trên VPS cùng với **DICA Backend (NestJS)** qua **GitHub Actions** và **Nginx**.

---

## 1. Kiến Trúc Hệ Thống

Domain: **`https://uat.lauechdica.vn`**

- **Nginx (Host VPS, cổng 80/443)**: Cửa ngõ duy nhất ra Internet, tự động HTTPS qua Certbot.
  - `/api/*` ➔ Backend NestJS (`127.0.0.1:3000`)
  - `/_next/static/*` ➔ Cache tài nguyên tĩnh Next.js
  - `/*` ➔ Web Next.js (`127.0.0.1:3001`)
- **DICA Backend**: Chạy Docker tại `/opt/dica-backend`, API bind `127.0.0.1:3000`.
- **DICA Web**: Chạy Docker tại `/opt/dica-web`, Web bind `127.0.0.1:3001`.
- Cổng 3000 và 3001 chỉ mở nội bộ trên VPS, không mở ra Internet.

---

## 2. Chuẩn Bị Trên VPS

### Bước 2.1: Tạo thư mục deploy
```bash
sudo install -d -o txssltmv -g txssltmv -m 750 /opt/dica-web
```

### Bước 2.2: Tạo file `/opt/dica-web/.env.production`
```bash
sudo tee /opt/dica-web/.env.production << 'EOF'
WEB_PORT=3001
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE=DICA
NEXT_PUBLIC_APP_NAME="DICA Admin"
NEXT_PUBLIC_APP_DESCRIPTION="Hệ Thống Quản Trị Chuỗi Cung Ứng & Tồn Kho F&B"
NEXT_PUBLIC_DEFAULT_THEME=system
EOF

sudo chown txssltmv:txssltmv /opt/dica-web/.env.production
sudo chmod 600 /opt/dica-web/.env.production
```

> **Ghi chú CORS**: Backend tại `/opt/dica-backend/.env.production` đã đặt `CORS_ORIGINS=*`, Web gọi API tương đối qua `/api/v1` không bị lỗi CORS.

---

## 3. Cấu Hình Nginx & SSL

1. Cài đặt Nginx & Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

2. Áp dụng cấu hình từ file [nginx/uat.lauechdica.vn.conf](../nginx/uat.lauechdica.vn.conf):
```bash
sudo cp /path/to/dica-web/nginx/uat.lauechdica.vn.conf /etc/nginx/sites-available/uat.lauechdica.vn
sudo ln -sf /etc/nginx/sites-available/uat.lauechdica.vn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

3. Cấp chứng chỉ SSL miễn phí (Let's Encrypt):
```bash
sudo certbot --nginx -d uat.lauechdica.vn
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Cấu Hình GitHub Secrets (CI/CD Tự Động)

Tại GitHub repo `thangdevalone/dica-web` > **Settings** > **Environments** > Tạo Environment tên `production`:

### Secrets (Bắt buộc):
| Tên Secret | Giá trị |
| :--- | :--- |
| `VPS_HOST` | `103.56.164.155` |
| `VPS_USER` | `txssltmv` |
| `VPS_SSH_PRIVATE_KEY` | Nội dung file `dica_vps.pem` (`C:\Users\thang\.ssh\dica_vps.pem`) |
| `VPS_SSH_KNOWN_HOSTS` | Chuỗi lấy từ lệnh `ssh-keyscan -p 22 -H 103.56.164.155` |

### Variables (Tùy chọn):
| Tên Variable | Mặc định | Ghi chú |
| :--- | :--- | :--- |
| `VPS_PORT` | `22` | Cổng SSH |
| `VPS_DEPLOY_PATH_WEB` | `/opt/dica-web` | Thư mục web trên VPS |
| `NEXT_PUBLIC_API_URL` | `/api/v1` | URL gọi API |

---

## 5. Quy Trình CI/CD Tự Động

Mỗi khi push code lên nhánh `main`:
1. **Verify**: Chạy `npm ci`, `npm audit`, `npm run typecheck`, `npm run build`.
2. **Image**: Đóng gói Docker Next.js standalone (~150MB), push lên GHCR và ghim digest bất biến.
3. **Deploy**: SSH vào VPS, cập nhật `docker-compose.yml`, pull image mới, restart container với zero-downtime, kiểm tra healthcheck và lưu lịch sử image phục vụ rollback.

---

## 6. Lệnh Vận Hành & Rollback Trên VPS

```bash
cd /opt/dica-web

# Xem trạng thái container
docker compose --env-file .env.production ps

# Xem log trực tiếp
docker compose --env-file .env.production logs -f --tail=100 web

# Rollback về phiên bản trước (nếu release mới có lỗi)
export APP_IMAGE="$(cat .previous-image)"
docker compose --env-file .env.production up -d --remove-orphans --wait
```
