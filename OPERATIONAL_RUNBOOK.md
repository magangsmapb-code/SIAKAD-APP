# PANDUAN OPERASIONAL & SERAH TERIMA DEPLOYMENT (OPERATIONAL RUNBOOK)
## SIAKAD - SMA Pemberdayaan Bangsa Ngrayun, Ponorogo

**Versi Dokumen:** 1.0.0-PROD  
**Tanggal Terbit:** 19 Oktober 2026  
**Klasifikasi:** Konfidensial (Internal Tim Pengelola IT Sekolah)  

---

## 1. ARSITEKTUR SISTEM PRODUKSI

SIAKAD (Sistem Informasi Absensi Kehadiran Akurat Digital) dirancang dengan arsitektur modular berorientasi container (*Docker Containerization*) di atas Virtual Private Server (VPS) Linux:

```
                      INTERNET / PENGGUNA PUBLIK
                                  │
                                  ▼ (Port 80/443 HTTPS)
                   ┌──────────────────────────────┐
                   │    Nginx 1.25 Reverse Proxy  │
                   │    (SSL TLS 1.2/1.3, Rate    │
                   │     Limiting, HSTS, Gzip)    │
                   └──────────────┬───────────────┘
                                  │ (siakad_edge Network)
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
   ┌───────────────────────────┐     ┌───────────────────────────┐
   │    Next.js 15 Standalone  │     │     NestJS 10 Backend     │
   │    Web Portal (Port 3000) │     │     API (Port 4000)       │
   │    Non-root user `nextjs` │     │     Non-root user `nestjs`│
   └───────────────────────────┘     └─────────────┬─────────────┘
                                                   │ (siakad_internal Network)
                                                   ▼
                                     ┌───────────────────────────┐
                                     │  PostgreSQL 16 Database   │
                                     │  (Isolated Internal Net,  │
                                     │   NO Public Port Mapping) │
                                     └─────────────┬─────────────┘
                                                   │
                                                   ▼
                                     ┌───────────────────────────┐
                                     │ Automated Backup Daemon   │
                                     │ (Daily Cron + 7D Rotate)  │
                                     └───────────────────────────┘
```

### Komponen Inti:
1. **Frontend Web (Next.js 15.1.7 Standalone)**:
   - Menjalankan portal web responsif untuk admin, guru, dan wali murid.
   - Menggunakan image Node.js 20 Alpine minimalis (~180 MB) dengan akun non-root `nextjs`.
2. **Backend API (NestJS 10.4.15 & Prisma 5.22.0)**:
   - Melayani seluruh operasi bisnis, autentikasi JWT, validasi absensi atomik, dan perizinan.
   - Menggunakan Prisma ORM yang terhubung secara privat ke PostgreSQL.
3. **Database (PostgreSQL 16 Alpine)**:
   - Berada di jaringan internal Docker (`siakad_internal`) dan **TIDAK mengekspos port 5432 ke internet publik**.
4. **Edge Ingress (Nginx Alpine)**:
   - Mengelola sertifikat SSL Let's Encrypt, HTTP/2, HSTS, security headers, dan proteksi brute force rate limiting.
5. **Aplikasi Mobile (Flutter 3.47.7 & Dart 3.13.5)**:
   - Terpasang pada smartphone Android guru dan siswa untuk presensi harian, draft offline, dan antrean sinkronisasi otomatis.

---

## 2. SPESIFIKASI INFRASTRUKTUR DAN PERSYARATAN VPS

| Spesifikasi | Rekomendasi Minimum | Rekomendasi Ideal (Disarankan) |
| :--- | :--- | :--- |
| **Sistem Operasi** | Ubuntu 22.04 LTS / 24.04 LTS x64 | Ubuntu 24.04 LTS x64 |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 2 GB (dengan Swap 2 GB) | 4 GB - 8 GB |
| **Penyimpanan** | 25 GB SSD / NVMe | 50 GB NVMe |
| **Bandwidth** | 100 Mbps unmetered | 1 Gbps |
| **Perangkat Lunak** | Docker Engine v24+, Docker Compose v2.20+, UFW Firewall, Git | Docker Engine v26+, UFW Firewall, Nginx, Certbot |

---

## 3. PANDUAN DEPLOYMENT PERTAMA KALI (INITIAL SETUP)

### Langkah 1: Persiapan Server VPS & Firewall
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Pasang Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Konfigurasi UFW Firewall (Hanya buka SSH, HTTP, HTTPS)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Langkah 2: Clone Repository & Konfigurasi Environment
```bash
# Clone source code ke direktori produksi
git clone <URL_REPO_SEKOLAH> /opt/siakad-app
cd /opt/siakad-app

# Salin template environment produksi
cp .env.production.example .env.production
cp apps/api/.env.production.example apps/api/.env

# Generate secret token 256-bit berentropi tinggi
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('POSTGRES_PASSWORD=' + require('crypto').randomBytes(24).toString('base64url'))"

# Masukkan secret ke .env.production menggunakan editor teks aman:
nano .env.production
```

### Langkah 3: Eksekusi Migrasi Database Terkendali
```bash
# Jalankan migrasi Prisma via skrip otomatis yang memicu backup awal
chmod +x scripts/*.sh
./scripts/deploy_db_migration.sh
```

### Langkah 4: Penerbitan Sertifikat SSL Let's Encrypt
```bash
# Terbitkan sertifikat SSL gratis untuk domain sekolah
sudo apt install -y certbot
sudo certbot certonly --standalone \
  -d siakad.smapemberdayaanbangsa.sch.id \
  -d api-siakad.smapemberdayaanbangsa.sch.id \
  --email admin@smapemberdayaanbangsa.sch.id \
  --agree-tos --no-eff-email
```

### Langkah 5: Menjalankan Seluruh Layanan dengan Docker Compose
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Verifikasi status seluruh container
docker compose -f docker-compose.prod.yml ps
```

---

## 4. PANDUAN PEMBARUAN APLIKASI (ZERO-DOWNTIME UPDATE)

Jika terdapat rilis perbaikan bug atau fitur baru:

```bash
cd /opt/siakad-app

# 1. Buat backup database sebelum pembaruan
./scripts/backup_db.sh

# 2. Ambil perubahan kode terbaru
git pull origin main

# 3. Jalankan migrasi jika terdapat skema database baru
./scripts/deploy_db_migration.sh

# 4. Bangun ulang container dan restart secara rolling
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --no-deps web api

# 5. Jalankan smoke test untuk memastikan aplikasi sehat
node scripts/smoke_test_production.js
```

---

## 5. STRATEGI BACKUP & DISASTER RECOVERY (RPO & RTO)

### Metrik Pemulihan Sekolah (Target SLA):
- **Recovery Point Objective (RPO)**: **24 Jam** (Maksimal kehilangan data 1 hari kalender; dapat ditingkatkan menjadi 6 jam saat masa ujian/penilaian semester).
- **Recovery Time Objective (RTO)**: **< 15 Menit** (Waktu pemulihan sistem dari kegagalan total hingga beroperasi normal kembali). Berdasarkan hasil pengujian laboratorium aktual, restore database berhasil selesai dalam **1.00 detik**.

### Skedul Backup Otomatis:
- Dijalankan oleh container `siakad_prod_backup` setiap 24 jam sekali.
- Retensi lokal: 7 hari arsip terkompresi (`siakad_backup_YYYYMMDD_HHMMSS.sql.gz`).
- **Rekomendasi Tambahan**: Sinkronkan folder `/backups` ke penyimpanan off-site (seperti Google Drive for Education milik sekolah atau AWS S3 Glacier) menggunakan `rclone`.

### Prosedur Restore Database (Pemulihan Bencana):
```bash
# Menjalankan pemulihan database dari file backup pilihan:
./scripts/restore_db.sh ./backups/siakad_db_20261019_081839.sql.gz
```

---

## 6. OBSERVABILITY, LOGGING & MONITORING

### Healthcheck Endpoints:
- **API Health**: `https://api-siakad.smapemberdayaanbangsa.sch.id/api/v1/health`  
  *Mengembalikan status `ok`, uptime, dan status konektivitas database.*
- **Web Frontend**: `https://siakad.smapemberdayaanbangsa.sch.id/login`

### Memeriksa Log Layanan (Sanitized Logging):
```bash
# Log Nginx Access & Error
docker compose -f docker-compose.prod.yml logs -f nginx

# Log Backend API (Telah disanitasi dari password/token)
docker compose -f docker-compose.prod.yml logs -f --tail=100 api

# Log Database PostgreSQL
docker compose -f docker-compose.prod.yml logs -f --tail=50 postgres
```

### Pemantauan Konsumsi Resource (CPU, RAM, Disk):
```bash
# Cek pemakaian RAM & CPU container secara realtime:
docker stats --no-stream

# Cek sisa ruang penyimpanan harddisk:
df -h
```

---

## 7. PROSEDUR BUILD & DISTRIBUSI APK ANDROID

### Persiapan Release Keystore:
1. Generate keystore sekolah (jalankan sekali):
   ```bash
   keytool -genkey -v -keystore apps/mobile/android/siakad-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias siakad
   ```
2. Buat file `apps/mobile/android/key.properties` berdasarkan `key.properties.example`.
3. Jalankan kompilasi release APK:
   ```bash
   cd apps/mobile
   flutter build apk --release \
     --dart-define=API_BASE_URL=https://api-siakad.smapemberdayaanbangsa.sch.id/api/v1 \
     --dart-define=DEMO_MODE=false
   ```
4. File APK siap didistribusikan ke guru dan siswa di:
   `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## 8. PROSEDUR TANGGAP DARURAT (INCIDENT RESPONSE SOP)

| Gejala Insiden | Kemungkinan Penyebab | Tindakan Cepat (First Action) |
| :--- | :--- | :--- |
| **Website Error 502 Bad Gateway** | Container `api` atau `web` mengalami crash atau OOM. | Jalankan `docker compose -f docker-compose.prod.yml restart api web`. Periksa log `docker compose logs --tail=100 api`. |
| **Database Connection Refused** | PostgreSQL restart atau kehabisan disk space. | Periksa `df -h`. Jika disk penuh, bersihkan cache docker (`docker system prune -f`). Restart DB: `docker compose restart postgres`. |
| **Gagal Sinkronisasi Mobile** | HP guru menggunakan mode demo lama atau API URL salah. | Pastikan aplikasi mobile terpasang versi release terbaru dan koneksi internet stabil. |
| **Lupa Password Admin** | Kehilangan akses akun super admin. | Jalankan perintah CLI terproteksi: `docker exec -it siakad_prod_api npm run prisma:seed` atau update via query psql. |

---

## 9. KONTAK PENGELOLA SISTEM

- **Penanggung Jawab Sistem**: Tim IT & Operator SIAKAD SMA Pemberdayaan Bangsa Ngrayun
- **Lokasi Sekolah**: Ngrayun, Ponorogo, Jawa Timur
- **Email Administrator**: `it@smapemberdayaanbangsa.sch.id`
