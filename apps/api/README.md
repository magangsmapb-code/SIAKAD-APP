# SIAKAD Production Backend API

Backend RESTful API produksi untuk Sistem Informasi Absensi Kehadiran Akurat Digital (SIAKAD) — SMA Pemberdayaan Bangsa Ngrayun, Ponorogo.

Backend dibangun dengan arsitektur modular enterprise, keamanan berlapis, transaksi database ACID, pencatatan audit log komprehensif, serta OpenAPI / Swagger documentation.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS 10.4](https://nestjs.com/) (TypeScript)
- **Database Engine**: [PostgreSQL 18 / 16](https://www.postgresql.org/)
- **ORM & Migrations**: [Prisma ORM 5.22](https://www.prisma.io/)
- **API Spec & Docs**: OpenAPI 3.0 / [Swagger UI](http://localhost:4000/api/v1/docs)
- **Authentication**: JWT Access Token (15m) + Secure Rotated Refresh Token (7d)
- **Password Security**: Bcrypt (Salt Round 10) / Argon2 compatible
- **Security Middlewares**: Helmet HTTP Headers, Cookie Parser, CORS White-listing, Throttler / Rate Limiting
- **Validation**: `class-validator` + `class-transformer` DTO pipes
- **Testing**: Jest (Unit & Integration tests)
- **Timezone**: Explicit `Asia/Jakarta` (WIB)

---

## 📐 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| teachers : "userId"
    users ||--o| students : "userId"
    users ||--o{ audit_logs : "userId"
    
    academic_years ||--o{ classes : "academicYearId"
    academic_years ||--o{ class_enrollments : "academicYearId"
    academic_years ||--o{ teaching_assignments : "academicYearId"
    
    classes ||--o{ students : "classId"
    classes ||--o{ class_enrollments : "classId"
    classes ||--o{ teaching_assignments : "classId"
    classes ||--o{ schedules : "classId"
    classes ||--o{ attendance_sessions : "classId"
    classes ||--o{ permission_requests : "classId"
    teachers ||--o{ classes : "homeroomTeacherId"
    
    teachers ||--o{ teaching_assignments : "teacherId"
    teachers ||--o{ schedules : "teacherId"
    teachers ||--o{ attendance_sessions : "teacherId"
    teachers ||--o{ permission_requests : "reviewedById"
    
    subjects ||--o{ teaching_assignments : "subjectId"
    subjects ||--o{ schedules : "subjectId"
    subjects ||--o{ attendance_sessions : "subjectId"
    
    schedules ||--o{ attendance_sessions : "scheduleId"
    
    students ||--o{ class_enrollments : "studentId"
    students ||--o{ attendance_records : "studentId"
    students ||--o{ permission_requests : "studentId"
    
    attendance_sessions ||--o{ attendance_records : "sessionId"
    attendance_sessions ||--o{ attendance_corrections : "sessionId"
    attendance_records ||--o{ attendance_corrections : "recordId"
```

---

## 🔐 Model Identitas & Role

| Role | Deskripsi Hak Akses |
| --- | --- |
| `SUPER_ADMIN` | Akses penuh sistem, manajemen konfigurasi sekolah, bypass semua filter |
| `ADMIN` / `SCHOOL_ADMIN` | Manajemen data akademik, data guru, data siswa, kelas, jadwal |
| `PRINCIPAL` | Akses monitoring, dashboard agregat, laporan kehadiran sekolah dan kelas |
| `TEACHER` | Mengisi absensi kelas yang diampu/diwalikan, memeriksa izin, melihat jadwal |
| `STUDENT` | Mengakses profil mandiri, riwayat absensi pribadi, mengajukan permohonan izin |

---

## 📡 Daftar Endpoint API (Prefix `/api/v1`)

### 1. Autentikasi (`/api/v1/auth`)

- `POST /api/v1/auth/login` : Masuk menggunakan username, email, NIP guru, atau NIS siswa. Mengembalikan access token, refresh token, dan menyetel secure HTTP-only cookies.
- `POST /api/v1/auth/refresh` : Rotasi refresh token dan penerbitan access token baru.
- `POST /api/v1/auth/logout` : Menghapus refresh token dari database dan membersihkan cookies.
- `GET /api/v1/auth/me` : Mendapatkan profil lengkap pengguna aktif beserta relasi kelas/mengajar.

### 2. Dashboard (`/api/v1/dashboard`)

- `GET /api/v1/dashboard/summary` : Ringkasan data absensi hari ini, jumlah siswa/guru, dan izin (berbasis role).
- `GET /api/v1/dashboard/attendance-trends` : Grafik tren kehadiran harian (parameter `days`).
- `GET /api/v1/dashboard/class-statistics` : Statistik kehadiran per kelas.

### 3. Data Siswa (`/api/v1/students`)

- `GET /api/v1/students` : Daftar siswa dengan pagination (`page`, `limit`), search (`search`), dan filter (`classId`, `status`, `gender`).
- `GET /api/v1/students/:id` : Detail profil, riwayat enrollment, dan riwayat absensi siswa.
- `POST /api/v1/students` : Tambah siswa baru (otomatis membuat akun login dan enrollment kelas).
- `PATCH /api/v1/students/:id` : Perbarui data siswa (tercatat di audit log).

### 4. Data Guru (`/api/v1/teachers`)

- `GET /api/v1/teachers` : Daftar guru dengan filter status dan wali kelas.
- `GET /api/v1/teachers/:id` : Detail profil guru, penugasan mengajar, dan kelas perwalian.
- `POST /api/v1/teachers` : Tambah guru baru beserta akun pengguna.
- `PATCH /api/v1/teachers/:id` : Perbarui data guru.

### 5. Struktur Akademik

- `GET, POST /api/v1/academic-years` : Kelola tahun ajaran.
- `POST /api/v1/academic-years/:id/activate` : Aktifkan tahun ajaran berjalan.
- `GET, POST, PATCH /api/v1/classes` : Kelola kelas, tingkat jenjang, dan wali kelas.
- `GET, POST, PATCH /api/v1/subjects` : Kelola mata pelajaran dan kategori (wajib/peminatan).
- `GET, POST /api/v1/schedules` : Kelola jadwal mata pelajaran dengan validasi bentrok waktu.

### 6. Modul Absensi (`/api/v1/attendance`)

- `GET /api/v1/attendance/sessions` : Daftar sesi absensi dengan filter tanggal, kelas, guru, mapel, dan status.
- `POST /api/v1/attendance/sessions` : Buat sesi absensi baru (verifikasi kewenangan guru pengampu).
- `GET /api/v1/attendance/sessions/:id` : Detail sesi absensi, daftar siswa, catatan kehadiran, dan riwayat koreksi.
- `PATCH /api/v1/attendance/sessions/:id` : Perbarui metadata sesi absensi.
- `POST /api/v1/attendance/sessions/:id/records` : Penyimpanan batch kehadiran siswa dalam **transaksi database atomik** (`prisma.$transaction`).
- `PATCH /api/v1/attendance/sessions/:id/records/:recordId` : Koreksi catatan absensi (otomatis disimpan ke `attendance_corrections` beserta alasan dan audit log).
- `POST /api/v1/attendance/sessions/:id/close` : Tutup sesi absensi secara permanen.
- `GET /api/v1/attendance/summary` : Ringkasan agregat kehadiran per kelas atau per tanggal.

### 7. Pengajuan Izin (`/api/v1/permissions`)

- `GET /api/v1/permissions` : Daftar pengajuan izin (role-scoped).
- `POST /api/v1/permissions` : Ajukan permohonan izin (Sakit, Izin, Dispensasi) dengan tanggal dan lampiran surat.
- `GET /api/v1/permissions/:id` : Detail pengajuan izin.
- `POST /api/v1/permissions/:id/approve` : Setujui permohonan izin (Guru Wali / Admin).
- `POST /api/v1/permissions/:id/reject` : Tolak permohonan izin dengan catatan alasan.

### 8. Laporan Kehadiran (`/api/v1/reports`)

- `GET /api/v1/reports/attendance` : Laporan kehadiran agregat seluruh sekolah.
- `GET /api/v1/reports/students/:id/attendance` : Rekapitulasi kehadiran per siswa.
- `GET /api/v1/reports/classes/:id/attendance` : Rekapitulasi kehadiran kelas beserta rincian per siswa.

---

## 🚀 Panduan Menjalankan Backend

### 1. Prasyarat

- Node.js >= 18 (teruji pada Node.js v26)
- PostgreSQL >= 16 (teruji pada PostgreSQL 18 di `localhost:5432`)
- npm >= 9

### 2. Konfigurasi Lingkungan

Salin file template `.env.example` ke `.env`:

```bash
cd apps/api
cp .env.example .env
```

Sesuaikan `DATABASE_URL` jika menggunakan kredensial custom:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/siakad_db?schema=public"
PORT=4000
JWT_ACCESS_SECRET=siakad_access_token_secret_key_dev_2026_ngrayun
JWT_REFRESH_SECRET=siakad_refresh_token_secret_key_dev_2026_ngrayun
```

### 3. Migrasi Database dan Seed

```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan Migrasi Database
npm run prisma:migrate

# Seed Data Development
npm run prisma:seed
```

### 4. Menjalankan Aplikasi

```bash
# Mode Development (Watch)
npm run start:dev

# Mode Produksi
npm run build
npm run start:prod
```

### 5. Menjalankan Pengujian (Jest)

```bash
npm test
```

### 6. Lingkungan Docker Compose (Alternatif)

Jika ingin menjalankan database PostgreSQL via Docker container:

```bash
docker-compose up -d
```

---

## 🔑 Kredensial Demo Development

| Peran | Username / Identifier | Password | Keterangan |
| --- | --- | --- | --- |
| **Super Admin** | `superadmin` | `admin123` | Administrator Sistem Penuh |
| **Tata Usaha / Admin** | `admin` | `admin123` | Staff Administrasi & Akademik |
| **Kepala Sekolah** | `kepala.sekolah` | `password123` | Drs. H. Mulyono, M.Pd. |
| **Guru Fisika (Wali X MIPA 1)** | `198403152009032008` | `password123` | Siti Rahmawati, S.Pd. (Demo Mobile) |
| **Siswa Demo (X MIPA 1)** | `2401` | `password123` | Aditya Pratama Putra (Demo Mobile) |

---

## 🔄 Prosedur Reset Database Development (Aman)

> [!CAUTION]
> Perintah reset hanya boleh dijalankan pada lingkungan development lokal. Perintah ini akan menghapus semua data tabel lalu menjalankan migrasi dan seeding ulang secara otomatis.

```bash
cd apps/api
npx prisma migrate reset --force
```
