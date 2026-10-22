# SIAKAD SMA Pemberdayaan Bangsa — Automated Security Testing Guide (Tahap 18)

Dokumen ini menjelaskan strategi pengujian keamanan otomatis, cakupan test suite, hasil eksekusi aktual, dan integrasi dengan pipeline CI/CD GitHub Actions.

---

## 1. Ikhtisar Rangkaian Pengujian Keamanan

Rangkaian pengujian keamanan otomatis dirancang untuk dijalankan di lingkungan lokal pengembang dan pipeline CI tanpa memodifikasi database produksi.

### Ringkasan Eksekusi Aktual (Tahap 18 Baseline)
- **Backend Test Suites**: 6 passed, 6 total (`security.spec.ts`, `features.service.spec.ts`, `auth.service.spec.ts`, `attendance.service.spec.ts`, `roles.guard.spec.ts`, `permissions.service.spec.ts`)
- **Backend Tests Count**: 40 passed, 40 total
- **Mobile Test Suites**: 5 passed, 5 total (`api_parsing_test.dart`, `attendance_sync_workflow_test.dart`, `auth_and_session_test.dart`, `offline_queue_storage_test.dart`, `widget_test.dart`)
- **Mobile Tests Count**: 17 passed, 17 total
- **Next.js Frontend Quality**: `npm run typecheck` (0 error), `npm run lint` (0 error, 0 warning)

---

## 2. Cakupan Pengujian Keamanan Spesifik

### 2.1 Pengujian Autentikasi & Sesi (`security.spec.ts`, `auth.service.spec.ts`)
- [x] **Login Kredensial Valid & Invalid**: Memastikan hash bcrypt diverifikasi dan password salah mengembalikan `UnauthorizedException`.
- [x] **Session Invalidation**: Memastikan `refreshToken` diatur ke `null` seketika saat password diubah atau akun dinonaktifkan (`isActive = false`).
- [x] **Token Revocation Check**: Memastikan refresh token yang sudah dicabut tidak dapat digunakan untuk memperpanjang sesi.

### 2.2 Pengujian Otorisasi & Pencegahan Eskalasi (`roles.guard.spec.ts`, `security.spec.ts`)
- [x] **Isolasi Peran DEVELOPER**: Memverifikasi bahwa akun dengan peran `DEVELOPER` tidak dapat mengakses endpoint yang hanya diperuntukkan bagi `TEACHER` atau `STUDENT`.
- [x] **Pencegahan Eskalasi Peran di Body**: Memverifikasi bahwa `users.service.ts` menolak upaya akun non-`SUPER_ADMIN` menugaskan peran `DEVELOPER` atau `SUPER_ADMIN`.
- [x] **Otorisasi Super Admin**: Memastikan hanya `SUPER_ADMIN` yang dapat mengubah matriks izin peran `DEVELOPER` dan peran `SUPER_ADMIN` bersifat *immutable*.

### 2.3 Pengujian Anti-Cheating & Integritas Absensi (`attendance.service.spec.ts`, `security.spec.ts`)
- [x] **Penolakan Check-in di Luar Geofence**: Memastikan koordinat di luar radius sekolah (misal: jarak > 100m) ditolak dengan status `BadRequestException` dan dicatat sebagai `ATTENDANCE_ANOMALY_DETECTED`.
- [x] **Pencegahan Check-in Ganda**: Memastikan upaya check-in kedua pada sesi yang sama ditolak (`400 Bad Request`) dan memicu anomali log.
- [x] **Otoritas Waktu Server**: Memastikan waktu check-in menggunakan `new Date()` dari server dan mengabaikan manipulasi waktu klien.

### 2.4 Pengujian Penguncian Modul Belum Diimplementasikan (`security.spec.ts`, `features.service.spec.ts`)
- [x] **Fitur Belum Selesai Terkunci**: Memverifikasi bahwa percobaan mengaktifkan `feat_grading_examination`, `feat_tu_payment_gateway`, atau `feat_notification_whatsapp` ditolak secara tegas dengan `BadRequestException`.
- [x] **Diagnostik Non-Destruktif**: Memverifikasi `runSecurityDiagnostics()` memeriksa keutuhan konfigurasi keamanan tanpa mengubah data produksi.

---

## 3. Menjalankan Pengujian Keamanan Secara Lokal

### Menjalankan Backend Security Tests:
```powershell
cd "apps/api"
npm test
```

### Menjalankan Mobile Security & Sync Tests:
```powershell
cd "apps/mobile"
..\..\Flutter\flutter\bin\flutter.bat test
```

### Menjalankan Pemeriksaan Tipe dan Linter Frontend:
```powershell
npm run typecheck
npm run lint
```
