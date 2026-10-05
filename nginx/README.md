# Cấu hình Nginx cho https://uat.lauechdica.vn

Nginx được cài trực tiếp trên máy chủ VPS (không dùng Docker Compose). Chỉ cần đúng **1 file duy nhất**: `uat.lauechdica.vn.conf`.

---

## 1. Cài Đặt Nginx & Certbot (Trên VPS Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 2. Copy File Cấu Hình Vào Nginx

Copy nội dung file `uat.lauechdica.vn.conf` vào `/etc/nginx/sites-available/uat.lauechdica.vn`:

```bash
sudo nano /etc/nginx/sites-available/uat.lauechdica.vn
# (Dán nội dung file uat.lauechdica.vn.conf vào đây và lưu lại)
```

Tạo liên kết để kích hoạt site:
```bash
sudo ln -sf /etc/nginx/sites-available/uat.lauechdica.vn /etc/nginx/sites-enabled/
```

*(Lưu ý: Nếu có file default cũ không dùng: `sudo rm /etc/nginx/sites-enabled/default`)*

---

## 3. Cấp Chứng Chỉ SSL (Let's Encrypt Tự Động)

Chạy 1 lệnh duy nhất để Certbot tự xin SSL và cấu hình vào Nginx:

```bash
sudo certbot --nginx -d uat.lauechdica.vn
```

---

## 4. Kiểm Tra & Áp Dụng

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Mở Cổng Tường Lửa (UFW)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
