# SIAKAD — Sistem Informasi Absensi Kehadiran Akurat Digital

## SMA Pemberdayaan Bangsa Ngrayun, Ponorogo

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![ESLint](https://img.shields.io/badge/ESLint-Clean%20Pass-4B32C3?style=flat&logo=eslint)](https://eslint.org/)

---

## 1. Ringkasan Proyek

**SIAKAD** (*Sistem Informasi Absensi Kehadiran Akurat Digital*) adalah fondasi sistem kehadiran dan presensi terpadu untuk **SMA Pemberdayaan Bangsa Ngrayun, Ponorogo**.

Sistem ini dirancang khusus untuk memenuhi standar digitalisasi madrasah/sekolah modern di kawasan Ngrayun, Ponorogo dengan mengintegrasikan:

1. **Presensi Realtime Siswa**: Mendukung pencatatan gerbang masuk via Kartu RFID Mifare, Kiosk Pemindaian Wajah (*Face Recognition*), QR Code dinamis, dan verifikasi guru piket.
2. **Dashboard Multi-Peran**: Variasi antarmuka khusus untuk Admin/Tata Usaha, Guru Pengampu/Wali Kelas, Kepala Sekolah, dan Siswa.
3. **Pencarian Cepat Global (Ctrl+K)**: Pencarian instan untuk data siswa, guru pengajar, rombongan belajar, dan mata pelajaran.
4. **Pemilih Tahun Ajaran**: Konfigurasi semester aktif (`2026/2027 Ganjil`, dll.) yang terhubung ke seluruh metrik aplikasi.
5. **Manajemen Pengguna Terpadu**: Pengelolaan hak akses peran, aktivasi akun, dan reset kredensial.
6. **Verifikasi Perizinan & Sakit Digital**: Pengajuan dan persetujuan surat izin resmi atau surat sakit dokter oleh wali kelas, BK, atau Kepala Sekolah.
7. **Analitik & Rekapitulasi Presensi**: Grafik tren kehadiran mingguan berbasis Recharts, rekapitulasi capaian per kelas, dan ekspor CSV/Excel siap arsip Cabang Dinas Pendidikan.
8. **Kesiapan Integrasi Arsitektur**: Siap dihubungkan ke backend **NestJS REST/WebSocket API** dan aplikasi **Android Flutter** pada fase berikutnya.

---

## 2. Stack Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1 (App Router) | Server Components default, Client Components pada interaksi |
| **Bahasa** | TypeScript Strict Mode | Bebas `any` tanpa alasan, kontrak data kuat (`src/types/`) |
| **Styling** | Tailwind CSS + CSS Variables | HSL Design Tokens, mode terang/gelap, standard kontras WCAG |
| **Komponen UI** | Radix UI Primitives + CVA | Button, Dialog, Select, Dropdown, Tabs, Tooltip, Avatar, Checkbox |
| **Ikonografi** | Lucide React | Konsisten 16px-20px dengan stroke seragam |
| **Form & Validasi** | React Hook Form + Zod | Validasi skema ketat (login, presensi manual, perizinan, setting) |
| **Visualisasi Data** | Recharts | Grafik batang presensi mingguan responsif & tooltip khusus |
| **Notifikasi** | Sonner | Toast notification modern dan elegan |
| **Linter** | ESLint 9 + Next Core Web Vitals | Zero warnings, zero errors |

---

## 3. Identitas & Design System

### Palet Warna Institusional (Design Tokens via CSS Variables)

- **Deep Academic Navy** (`--foreground: 217 60% 11%`, `#0B192C`): Warna wibawa institusi pendidikan.
- **Royal Primary Blue** (`--primary: 221.2 83.2% 53.3%`, `#2563EB`): Warna aksen utama interaktif dan navigasi.
- **Status Hadir (Emerald Green)** (`--status-hadir`, `#16A34A`): Status hadir tepat waktu (< 07:00 WIB).
- **Status Terlambat (Warm Amber)** (`--status-terlambat`, `#D97706`): Siswa hadir dalam rentang toleransi (07:00 - 07:15 WIB).
- **Status Izin (Sky Blue)** (`--status-izin`, `#0284C7`): Siswa berhalangan dengan surat keterangan resmi.
- **Status Sakit (Purple)** (`--status-sakit`, `#7C3AED`): Siswa sakit dengan surat rujukan dokter/puskesmas.
- **Status Alpa (Crimson Red)** (`--status-alpa`, `#DC2626`): Tidak hadir tanpa konfirmasi orang tua.

### Standar UI/UX

- **Tipografi**: Font sans modern dengan `tnum` (tabular numbers) untuk ketepatan angka presensi dan waktu tap.
- **Border Radius**: `--radius: 0.5rem` (8px).
- **Fokus Aksesibilitas**: Standard outline `ring-2 ring-primary ring-offset-2` untuk navigasi keyboard menyeluruh.
- **Shadow Hierarki**: `shadow-subtle`, `shadow-card`, dan `shadow-elevated`.

---

## 4. Struktur Folder

```text
c:\xampp\htdocs\SIAKAD APP/
├── public/                     # Aset statis & logo
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route group autentikasi
│   │   │   └── login/page.tsx  # Halaman login institusi
│   │   ├── (dashboard)/        # Route group tata kelola
│   │   │   ├── layout.tsx      # Layout dashboard (Sidebar + Topbar + Footer)
│   │   │   ├── dashboard/page.tsx # Dashboard adaptif multi-peran
│   │   │   ├── attendance/page.tsx # Presensi realtime & log RFID
│   │   │   ├── students/page.tsx   # Direktori siswa & kartu RFID
│   │   │   ├── teachers/page.tsx   # Data pendidik & staf
│   │   │   ├── classes/page.tsx    # Rombel & wali kelas
│   │   │   ├── subjects/page.tsx   # Mata pelajaran kurikulum
│   │   │   ├── schedules/page.tsx  # Jadwal pelajaran & sesi
│   │   │   ├── permissions/page.tsx# Verifikasi izin & sakit
│   │   │   ├── reports/page.tsx    # Generator rekapitulasi & ekspor
│   │   │   ├── users/page.tsx      # Manajemen akun pengguna sistem
│   │   │   └── settings/page.tsx   # Pengaturan ambang batas jam
│   │   ├── globals.css         # Design tokens & CSS variables
│   │   ├── layout.tsx          # Root layout & providers
│   │   └── page.tsx            # Root redirect ke /dashboard
│   ├── components/
│   │   ├── ui/                 # Primitif UI (Button, Input, Badge, Dialog, Select, dll.)
│   │   ├── layout/             # Sidebar, Topbar, MobileNav, UserNav, SearchDialog, Footer
│   │   └── shared/             # StatCard, TableToolbar, SearchInput, Pagination, dll.
│   ├── contexts/               # DemoRoleContext (manajemen peran & tahun ajaran)
│   ├── features/               # Modular business logic per domain
│   │   ├── auth/               # LoginForm & types
│   │   ├── dashboard/          # Multi-role views (Admin, Teacher, Principal, Student)
│   │   ├── attendance/         # LiveAttendanceFeed, ManualAttendanceModal
│   │   ├── students/           # StudentTable, StudentDetailModal
│   │   ├── permissions/        # PermissionTable, PermissionReviewModal
│   │   ├── teachers/           # TeacherList
│   │   ├── classes/            # ClassGrid
│   │   ├── subjects/           # SubjectList
│   │   ├── schedules/          # ScheduleView
│   │   ├── reports/            # ReportGenerator
│   │   ├── users/              # UserManagement
│   │   └── settings/           # SettingsForm
│   ├── hooks/                  # Custom hooks (useMounted, dll.)
│   ├── lib/
│   │   ├── constants.ts        # Profil sekolah, akun demo, navigasi, status map
│   │   ├── utils.ts            # ClassName merge, format tanggal & angka id-ID
│   │   └── validators.ts       # Zod schemas untuk form validation
│   ├── types/                  # Kontrak tipe TypeScript (Student, Teacher, UserProfile, dll.)
│   └── mocks/
│       └── data.ts             # Data lokal realistis SMA PB Ngrayun Ponorogo
├── components.json             # Konfigurasi shadcn/ui
├── next.config.mjs             # Konfigurasi Next.js
├── package.json                # Dependensi paket
├── postcss.config.mjs          # Konfigurasi PostCSS
├── tailwind.config.ts          # Konfigurasi Tailwind & perluasan tema
└── tsconfig.json               # Konfigurasi TypeScript strict
```

---

## 5. Cara Instalasi & Menjalankan Proyek

### Prasyarat

- Node.js versi 18.18+ atau 20+ (Telah diuji pada Node.js v26.10.0)
- npm versi 9+ (Telah diuji pada npm 11.19.1)

### Langkah Instalasi

1. Buka terminal di direktori proyek:

   ```bash
   cd "c:\xampp\htdocs\SIAKAD APP"
   ```

2. Jalankan instalasi dependensi (jika belum terpasang):

   ```bash
   npm install
   ```

3. Jalankan server pengembangan lokal (*development mode*):

   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

4. Untuk memeriksa kompilasi tipe TypeScript:

   ```bash
   npm run typecheck
   ```

5. Untuk memeriksa linter:

   ```bash
   npm run lint
   ```

6. Untuk membangun bundel produksi (*production build*):

   ```bash
   npm run build
   ```

---

## 6. Fitur Unggulan yang Telah Diimplementasikan

- [x] **Dashboard Multi-Peran**: Variasi antarmuka untuk Admin/TU, Guru Pengampu/Wali Kelas, Kepala Sekolah, dan Siswa dengan bilah peralihan instan.
- [x] **Sidebar Collapsible & Mobile Drawer**: Navigasi 11 rute lengkap dengan status server RFID dan responsif di ponsel/tablet.
- [x] **Pencarian Cepat Global (Ctrl+K)**: Dialog modal untuk mencari siswa, pengajar, kelas, dan pintasan menu secara instan.
- [x] **Pemilih Tahun Ajaran**: Dropdown tahun ajaran di header yang menyinkronkan status akademik di seluruh tampilan.
- [x] **Presensi Realtime Gerbang**: Aliran data masuk/pulang, pencarian cepat, filter rombel, filter status, ekspor berkas CSV.
- [x] **Modal Presensi Manual**: Form modal guru piket untuk menandai presensi darurat lengkap dengan catatan keterangan.
- [x] **Direktori Siswa & Tag RFID**: Tabel data siswa, UID kartu RFID, dan modal pop-up detail data siswa lengkap.
- [x] **Manajemen Pengguna (`/users`)**: Daftar akun sistem, filter hak akses peran, aktivasi akun, dan dialog tambah akun baru.
- [x] **Verifikasi Perizinan**: Tabel persetujuan surat izin/sakit dengan dialog *Approve/Reject* dan verifikasi dokumen dokter.
- [x] **Generator Rekapitulasi Presensi**: Pratinjau bulanan per rombel siap ekspor Excel/CSV dan siap cetak (*print-ready*).
- [x] **Pengaturan Ambang Batas Waktu**: Konfigurasi batas jam masuk (07:00), toleransi (07:15), jam pulang, dan gateway notifikasi wali murid.
- [x] **Developer Dashboard & Tata Kelola Fitur**: Konsol terpusat di `/settings` (Tab 3) dengan Feature Registry relasional, penegakan dependensi, dan pencegahan aktivasi modul unbuilt.
- [x] **Granular RBAC Matrix**: 30 permission domain granular dipetakan ke 7 roles institusional.
- [x] **Jejak Audit Otomatis (Audit Logs)**: Perekaman mutasi fitur dan data sensitif di level backend PostgreSQL.
- [x] **Aplikasi Mobile Flutter (Android)**: Presensi mobile offline-first dengan sinkronisasi otomatis, validasi sesi, dan isolasi role.
- [x] **Backend API NestJS**: 12 modul controller, JWT authentication ganda, rate limiting Throttler (100 req/min), dan Swagger OpenAPI.

---

## 7. Cara Menjalankan Backend & Mobile App

### Backend API (NestJS + PostgreSQL)
```bash
cd "c:\xampp\htdocs\SIAKAD APP\apps\api"
npm install
npx prisma migrate deploy
npm run build
node --max-old-space-size=2048 dist/src/main.js
# Backend berjalan di http://localhost:4000/api/v1
# Swagger UI di http://localhost:4000/api/v1/docs
```

### Mobile App (Flutter)
```bash
cd "c:\xampp\htdocs\SIAKAD APP\apps\mobile"
flutter pub get
flutter run -d chrome # atau hubungkan perangkat Android fisik via adb
```

---

## 8. Panduan Pengujian & QA Otomatis (Test Suite)

| Komponen | Perintah Pengujian | Hasil Pengujian |
| :--- | :--- | :--- |
| **Frontend Web Lint** | `npm run lint` | ✔ 0 error, 0 warning |
| **Frontend Web Typecheck**| `npm run typecheck` | ✔ 0 error (TypeScript strict) |
| **Frontend Web Build** | `npm run build` | ✔ 16/16 route static generated |
| **Backend Unit Tests** | `npm test` (di `apps/api`) | ✔ 28/28 passed (5 test suites) |
| **Mobile App Analysis**| `flutter analyze` (di `apps/mobile`) | ✔ No issues found (120s) |
| **Mobile App Tests** | `flutter test` (di `apps/mobile`) | ✔ 17/17 passed |

---

## 9. Prosedur Pemulihan Darurat (Emergency Runbook)

Jika administrator terkunci akibat kesalahan konfigurasi izin:
```bash
cd "c:\xampp\htdocs\SIAKAD APP\apps\api"
# Reset akses SUPER_ADMIN via CLI
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { username: 'admin' }, data: { role: 'SUPER_ADMIN', isActive: true } }).then(() => console.log('Admin restored!')).finally(() => p.$disconnect());"

# Reset seluruh fitur aktif ke status default
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.featureRegistry.updateMany({ where: { implementationStatus: 'IMPLEMENTED' }, data: { isEnabled: true, maintenanceStatus: 'ACTIVE' } }).then(() => console.log('Features restored!')).finally(() => p.$disconnect());"
```
