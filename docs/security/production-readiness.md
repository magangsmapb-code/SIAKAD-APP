# SIAKAD SMA Pemberdayaan Bangsa — Production Readiness & Deployment Checklist (Tahap 18)

Dokumen ini mendefinisikan checklist kesiapan produksi, konfigurasi server, reverse proxy, keamanan TLS, dan mitigasi risiko operasional sebelum sistem di-deploy ke lingkungan produksi SMA Pemberdayaan Bangsa Ngrayun.

---

## 1. Status Kesiapan Lingkungan (Production Readiness Matrix)

| Komponen | Status Saat Ini | Syarat Menuju Go-Live Produksi | Tindakan yang Diperlukan |
| :--- | :--- | :--- | :--- |
| **Backend API (NestJS)** | **READY (Hardened)** | Node.js v20+ LTS, PM2 cluster / Docker container | Set `NODE_ENV=production`, isolasi port 3001 |
| **Database (PostgreSQL 18)**| **READY (Hardened)** | Port 5432 tidak terekspos publik; koneksi ber-password kuat | Konfigurasi `pg_hba.conf` listen di localhost / private VPC |
| **Frontend Web (Next.js)** | **READY (Hardened)** | Node.js v20+, Reverse proxy HTTPS, security headers | Build statis/SSR produksi, disable source maps di prod |
| **Aplikasi Flutter Mobile** | **READY (Staging)** | Build Release (APK/AAB teroptimasi), TLS valid | Generate signed release APK dengan keystore rahasia |
| **TLS / SSL Certificate** | **PENDING SERVER** | Sertifikat TLS publik aktif (misal: Let's Encrypt / Cloudflare) | Konfigurasi reverse proxy Nginx / Caddy |
| **Reverse Proxy & WAF** | **PENDING SERVER** | Nginx / Caddy dengan rate limit, gzip, dan CSP | Terapkan konfigurasi Nginx aman |
| **Modul Ujian (CBT)** | **LOCKED (Not Implemented)** | Belum dibangun di backend/DB | Tetap terkunci (`NOT_IMPLEMENTED`) hingga Tahap 19+ |
| **Object Storage (S3/MinIO)**| **PENDING CONFIG** | Bucket privat ber-signed URL | Migrasi dari URL lampiran metadata ke MinIO lokal/S3 |

---

## 2. Arsitektur Reverse Proxy Nginx yang Direkomendasikan

Untuk mengisolasi backend dan frontend dari akses internet langsung:
```nginx
# /etc/nginx/sites-available/siakad.smapemberdayaanbangsa.sch.id

server {
    listen 80;
    server_name siakad.smapemberdayaanbangsa.sch.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name siakad.smapemberdayaanbangsa.sch.id;

    ssl_certificate /etc/letsencrypt/live/siakad/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siakad/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Client payload limit
    client_max_body_size 10M;

    # Next.js Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # NestJS Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Checklist Pra-Deployment Produksi (Pre-Flight Verification)

- [x] Template `.env.production.example` tersedia tanpa ada nilai rahasia produksi.
- [x] Seluruh password dan secret produksi di-generate secara acak berkekuatan tinggi (min. 32 karakter acak).
- [x] Port database PostgreSQL (5432) tertutup dari akses internet publik.
- [x] CORS origin diatur secara spesifik ke domain sekolah resmi (bukan wildcard `*`).
- [x] Session revocation aktif saat password akun diubah atau akun dinonaktifkan.
- [x] Modul ujian yang belum diimplementasikan terkunci rapat pada backend.
- [x] Audit log mencatat anomali dan mutasi data sensitif dengan sanitasi data otomatis.
- [x] Backup database harian terjadwal (menggunakan cron `pg_dump` terenkripsi).
