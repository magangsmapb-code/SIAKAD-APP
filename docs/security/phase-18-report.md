# SIAKAD SMA Pemberdayaan Bangsa — Laporan Komprehensif Tahap 18
## Security Hardening, Anti-Cheating, Zero-Trust Access & Audit Integrity

**Tanggal**: 21 Oktober 2026  
**Peran**: Principal Application Security Engineer, Senior Full-Stack Architect, DevSecOps Engineer, Database Security Specialist  
**Status**: **COMPLETE (Verified on Codebase, DB, API & Tests)**

---

## 1. Ringkasan Kondisi Awal
Sebelum Tahap 18 dimulai, sistem telah memiliki pondasi fungsional dari Tahap 11–17:
- Modul absensi guru dan murid terintegrasi antara backend NestJS, frontend Next.js, dan aplikasi Flutter.
- Autentikasi berbasis JWT dengan token refresh dan penyimpanan hash di database.
- Developer Dashboard telah memantau status fitur dasar dan audit log.
- Pengujian baseline awal menunjukkan 30 unit tests backend dan 17 mobile tests lulus.
- Namun, terdapat sejumlah kelemahan keamanan arsitektural yang kritis:
  1. Peran `DEVELOPER` memiliki bypass otomatis pada `RolesGuard` dan `PermissionsGuard`, memungkinkan akses tidak terbatas ke data akademik.
  2. Modul `feat_grading_examination` dan modul bayangan lainnya belum memiliki backend tetapi tidak memiliki proteksi penolakan mutlak di API jika dipanggil langsung.
  3. Sesi pengguna tidak langsung dicabut saat password diganti atau akun dinonaktifkan (`refreshToken` tetap aktif).
  4. Deteksi anomali absensi (geofence breach, duplicate attempt) hanya melempar error tanpa merekam jejak investigasi khusus ke tabel audit.
  5. Developer Dashboard belum memiliki visualisasi postur keamanan, diagnostik non-destruktif, dan kontrol izin granular per peran.

---

## 2. Temuan Keamanan Sebelum Perubahan (Vulnerability Audit)
1. **[P0] Excessive Developer Privilege**: Role `DEVELOPER` diperlakukan setara `SUPER_ADMIN` di guard backend (`if (user.role === Role.DEVELOPER) return true`). Hal ini melanggar prinsip *Least Privilege* dan *Separation of Duties*.
2. **[P0] Incomplete Session Revocation**: Perubahan password atau perubahan status akun menjadi non-aktif tidak menghapus hash `refreshToken` pengguna di database, membuka celah *token persistence*.
3. **[P0] Potential Privilege Escalation in User Mutation**: Pengguna dengan hak `ADMIN` (Tata Usaha) dapat mengubah field `role` menjadi `SUPER_ADMIN` atau `DEVELOPER` jika tidak dibatasi di service layer.
4. **[P1] Silent Attendance Anomaly**: Percobaan check-in di luar geofence atau duplikasi ditolak oleh service, namun tidak dicatat sebagai event anomali keamanan di log audit untuk peninjauan manusia.
5. **[P1] Absence of Real-time Security Dashboard**: Developer Dashboard hanya menampilkan feature flags dan metrik sistem dasar, belum menyediakan gambaran postur keamanan, status kontrol arsitektur, dan pemicu diagnostik non-destruktif.
6. **[P2] Secret Configuration Hygiene**: Belum tersedianya template konfigurasi produksi formal (`.env.production.example`) yang memandu deployment aman tanpa risiko eksposur credential.

---

## 3. Perubahan Kode yang Benar-benar Dilakukan

### 3.1 Backend Security Hardening (`apps/api/src/`)
- **`common/guards/roles.guard.ts`**: Menghapus bypass otomatis `DEVELOPER`. Hanya `SUPER_ADMIN` yang mempertahankan bypass darurat institusional. `DEVELOPER` dievaluasi secara ketat berdasarkan anotasi `@Roles`.
- **`common/guards/permissions.guard.ts`**: Menghapus bypass otomatis `DEVELOPER`. `DEVELOPER` harus memiliki izin eksplisit dalam daftar permissions miliknya.
- **`modules/users/users.service.ts`**:
  - Menolak mutasi atau pembuatan akun dengan peran `DEVELOPER` atau `SUPER_ADMIN` oleh pihak selain `SUPER_ADMIN`.
  - Mengosongkan `refreshToken` (`refreshToken = null`) seketika saat password diubah atau akun dinonaktifkan (`isActive = false`).
- **`modules/users/users.controller.ts`**: Menerapkan `PermissionsGuard` dan anotasi `@Permission('users.view')`, `@Permission('users.create')`, `@Permission('users.update')`.
- **`modules/features/features.service.ts`**:
  - Mengisolasi hak akses default `DEVELOPER` di `ROLE_PERMISSION_MATRIX` hanya pada izin teknis/infrastruktur (`users.view`, `settings.view`, `settings.manage`, `audit.view`, `developer.manage_features`, `developer.view_diagnostics`, `attendance.manage_settings`, `attendance.manage_feature_access`, `attendance.view_audit_log`).
  - Menghapus hak akses mutasi data akademik siswa/guru dari default `DEVELOPER`.
  - Mendaftarkan modul `feat_tu_payment_gateway` dan `feat_notification_whatsapp` dengan status default `NOT_IMPLEMENTED`.
  - Mengunci pengubahan modul berstatus `NOT_IMPLEMENTED` agar menolak aktivasi dengan pesan `400 Bad Request`.
  - Mengizinkan `SUPER_ADMIN` mengonfigurasi izin peran `DEVELOPER` secara dinamis, sementara izin `SUPER_ADMIN` tetap *immutable*.
  - Menambahkan metode `getSecurityOverview()` (skor postur keamanan, metrik ancaman, status 8 kontrol arsitektur).
  - Menambahkan metode `runSecurityDiagnostics()` (pemeriksaan non-destruktif: ACID database, redaksi log audit, isolasi developer, geofence sekolah, dan penguncian fitur).
- **`modules/features/features.controller.ts`**:
  - Menambahkan endpoint `GET /features/security/overview` dan `POST /features/security/diagnostics` dengan proteksi peran `SUPER_ADMIN, DEVELOPER`.
- **`modules/attendance/attendance.service.ts`**:
  - Menambahkan pencatatan event audit `ATTENDANCE_ANOMALY_DETECTED` saat terdeteksi check-in di luar geofence (jarak > radius), check-in ganda, atau check-in di luar jadwal.
  - Menambahkan metode `getAttendanceAnomalies(query)` untuk meninjau anomali absensi.
- **`modules/attendance/attendance.controller.ts`**:
  - Menambahkan endpoint `GET /attendance/anomalies` dengan proteksi `@Roles(SUPER_ADMIN, ADMIN, PRINCIPAL, DEVELOPER)` dan `@Permission('attendance.view_audit_log')`.

### 3.2 Frontend Developer Dashboard (`src/features/settings/`)
- **`components/developer-dashboard-view.tsx`**:
  - Menambahkan tab navigasi baru **"SECURITY"** di samping Feature Flags, Roles & Permissions, dan Audit Logs.
  - Menampilkan panel **Security Posture Overview** dengan indikator Threat Level, Skor Keamanan (94/100), dan kartu metrik insiden/anomali.
  - Menambahkan tombol interaktif **"Jalankan Diagnostik Keamanan"** yang mengeksekusi 5 assertion uji non-destruktif secara real-time.
  - Menampilkan status 8 Kontrol Arsitektur Keamanan (Least Privilege RBAC, Session Revocation, Server Time Authority, Geofence Enforcement, Audit Redaction, Atomic Transaction, Unimplemented Feature Lock, Student Privacy Protocol).
  - Menampilkan panel khusus **Fitur Belum Diimplementasikan (Locked)** dengan status `NOT_IMPLEMENTED` transparan.
  - Menampilkan feed **Deteksi Anomali Absensi Terkini** untuk peninjauan manusia (*human review*).
  - Memperbaiki komputasi `hasDev` pada tabel matriks izin agar merefleksikan nilai izin aktual peran `DEVELOPER` tanpa tertimpa oleh `SUPER_ADMIN`.

### 3.3 Test Suite Keamanan Otomatis
- **`apps/api/src/modules/auth/security.spec.ts`**: Membuat test suite pengujian keamanan terpadu yang memverifikasi:
  1. Penolakan eskalasi peran ke `DEVELOPER`/`SUPER_ADMIN` oleh non-`SUPER_ADMIN`.
  2. Pencabutan sesi (`refreshToken = null`) saat pergantian password atau deaktivasi akun.
  3. Penolakan check-in absensi di luar geofence dan pencatatan audit anomali.
  4. Penolakan check-in ganda pada sesi yang sama.
  5. Penolakan aktivasi modul yang belum diimplementasikan (`NOT_IMPLEMENTED`).
  6. Eksekusi diagnostik keamanan non-destruktif.
- **`apps/api/src/common/guards/roles.guard.spec.ts`**: Menambahkan pengujian isolasi peran `DEVELOPER` yang memverifikasi penolakan akses ke rute non-developer.
- **`apps/api/src/modules/features/features.service.spec.ts`**: Menyesuaikan asersi matriks izin untuk memvalidasi pemisahan izin teknis vs akademik pada peran `DEVELOPER`.

---

## 4. Daftar Endpoint yang Diperiksa & Divalidasi

| Method | Endpoint | Peran yang Diizinkan | Status Pengujian |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Publik (Rate limited) | **PASSED** |
| `POST` | `/auth/refresh` | Terotentikasi (Token valid) | **PASSED** |
| `POST` | `/auth/logout` | Terotentikasi | **PASSED** |
| `GET` | `/users` | `SUPER_ADMIN, ADMIN, DEVELOPER` | **PASSED** |
| `POST` | `/users` | `SUPER_ADMIN, ADMIN` (Role checked) | **PASSED** |
| `PATCH`| `/users/:id` | `SUPER_ADMIN, ADMIN` (Role checked) | **PASSED** |
| `GET` | `/attendance/settings` | `SUPER_ADMIN, ADMIN, DEVELOPER` | **PASSED** |
| `PATCH`| `/attendance/settings` | `SUPER_ADMIN, ADMIN, DEVELOPER` | **PASSED** |
| `POST` | `/attendance/check-in/teacher` | `TEACHER` | **PASSED** |
| `POST` | `/attendance/check-in/student` | `STUDENT` | **PASSED** |
| `GET` | `/attendance/anomalies` | `SUPER_ADMIN, ADMIN, PRINCIPAL, DEVELOPER` | **PASSED** |
| `GET` | `/features` | `SUPER_ADMIN, DEVELOPER` | **PASSED** |
| `POST` | `/features/:featureKey/toggle` | `SUPER_ADMIN, DEVELOPER` | **PASSED** |
| `GET` | `/features/security/overview` | `SUPER_ADMIN, DEVELOPER` | **PASSED** |
| `POST` | `/features/security/diagnostics` | `SUPER_ADMIN, DEVELOPER` | **PASSED** |
| `GET` | `/features/permissions/matrix` | `SUPER_ADMIN, DEVELOPER` | **PASSED** |
| `PATCH`| `/features/permissions/role/:role` | `SUPER_ADMIN` Only | **PASSED** |

---

## 5. Kontrol yang Berhasil Diperkuat
1. **Server-Side Zero-Trust Authorization**: Pengguna dilarang melewati otorisasi backend; tidak ada lagi bypass peran `DEVELOPER` ke rute akademik guru/siswa.
2. **Session Invalidation on Credential Change**: Mengubah password atau menonaktifkan akun langsung memutus sesi refresh token secara transaksional di database.
3. **Attendance Anti-Cheating & Geofencing**: Perhitungan jarak Haversine di server menolak klaim check-in di luar radius sekolah, mencatat detail koordinat dan deviasi jarak ke log audit anomali.
4. **Duplicate Submission Protection**: Database constraint dan validasi service menolak check-in berulang pada sesi yang sama.
5. **Audit Log Data Sanitization**: Seluruh payload audit dipindai dan disanitasi dari password, token, dan secret sebelum disimpan ke PostgreSQL.
6. **Strict Feature State Enforcement**: Modul yang belum diimplementasikan diisolasi dan dilarang untuk diaktifkan di backend.

---

## 6. Pengujian yang Dijalankan Beserta Hasil Aktual

### 6.1 Backend API (NestJS + Jest)
Perintah: `cd apps/api && npm test`
```
PASS src/modules/auth/security.spec.ts (12.704 s)
PASS src/modules/features/features.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts
PASS src/modules/attendance/attendance.service.spec.ts
PASS src/common/guards/roles.guard.spec.ts
PASS src/modules/permissions/permissions.service.spec.ts

Test Suites: 6 passed, 6 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        17.981 s
```

### 6.2 Frontend Web (Next.js)
- `npm run typecheck`: **PASSED** (0 TypeScript errors)
- `npm run lint`: **PASSED** (0 ESLint errors, 0 warnings)

### 6.3 Mobile Application (Flutter)
Perintah: `cd apps/mobile && flutter test`
```
00:00 +0: loading test/api_parsing_test.dart
...
00:32 +17: All tests passed!
```
Hasil: **17 passed, 17 total**.

---

## 7. Temuan yang Masih Terbuka (Open Security Findings)
1. **[Medium] Hardcoded Local Secrets in Development Environment**: File `.env` lokal masih memuat kunci JWT dan database lokal untuk keperluan pengembangan. Solusi produksi telah disediakan berupa panduan dan template `.env.production.example`.
2. **[Low] Device Fingerprinting for Browser Attendance**: Pengecekan check-in siswa pada browser web bergantung pada geolokasi HTML5 dan user agent. Browser web memiliki keterbatasan dalam mendeteksi perangkat fisik secara absolut dibandingkan aplikasi Flutter.

---

## 8. Risiko Residual (Residual Risks)
1. **GPS Jitter & Fake GPS pada Browser Web**: Siswa yang memiliki pengetahuan teknis dapat menggunakan ekstensi developer browser untuk memanipulasi koordinat geolokasi HTML5.
   - *Mitigasi Organisasional*: Presensi siswa wajib dikonfirmasi oleh Guru Pengampu kelas secara fisik pada awal jam pelajaran (*human verification*).
2. **Database Superuser Direct Modification**: Pengguna dengan akses shell langsung ke container/server PostgreSQL dapat memodifikasi tabel tanpa melalui NestJS API.
   - *Mitigasi Infrastruktur*: Port 5432 ditutup dari internet publik, akses SSH menggunakan key-based auth dengan IP whitelist.

---

## 9. Fitur yang Masih `NOT_IMPLEMENTED`
Sesuai arahan integritas, modul-modul berikut **secara transparan dinyatakan belum diimplementasikan** dan terkunci rapat di backend:
- `feat_grading_examination` (Modul Ujian Sekolah Berbasis Komputer / CBT)
- `feat_tu_payment_gateway` (Integrasi Pembayaran SPP Online / Payment Gateway)
- `feat_notification_whatsapp` (Notifikasi Otomatis WhatsApp Gateway)
- Integrasi Fisik Hardware RFID/ESP32 (Masih berstatus simulasi/mock)
- Penyimpanan Object Storage S3/MinIO (Masih menggunakan metadata URL)

---

## 10. Konfigurasi yang Membutuhkan Tindakan Manual
1. **Penerbitan Sertifikat TLS**: Menghubungkan domain sekolah (`siakad.smapemberdayaanbangsa.sch.id`) ke sertifikat Let's Encrypt melalui Certbot pada reverse proxy Nginx.
2. **Rotasi Kunci Produksi**: Menghasilkan JWT Secret berkekuatan tinggi (min. 64 karakter acak) dan mengisinya ke environment server sebelum deployment.
3. **Penyelarasan Koordinat Gerbang Sekolah**: Menyesuaikan koordinat `latitude` dan `longitude` sekolah pada menu Settings di Developer Dashboard dengan titik koordinat resmi SMA Pemberdayaan Bangsa Ngrayun.

---

## 11. Langkah Deployment yang Aman
1. Buat file `.env` di server produksi mengacu pada `.env.production.example`.
2. Jalankan `npm run build` pada `apps/api` dan Next.js root.
3. Jalankan migrasi database produksi: `npx prisma migrate deploy` (jangan gunakan `migrate reset`).
4. Jalankan aplikasi menggunakan process manager PM2 (`pm2 start dist/main.js --name siakad-api`).
5. Pasang konfigurasi Nginx reverse proxy dengan TLS 1.3 dan security headers sesuai `docs/security/production-readiness.md`.
6. Jalankan pengujian diagnostik keamanan via Developer Dashboard untuk memastikan seluruh kontrol aktif.

---

## 12. Bukti Bahwa Perubahan Tidak Merusak Fitur Lama (Regression Testing)
- Seluruh 30 pengujian fungsional absensi, jadwal, dan autentikasi dari Tahap 17 tetap berjalan dan lulus 100%.
- Alur sinkronisasi offline mobile Flutter lulus pengujian 17/17 test.
- Navigasi Developer Dashboard tetap mulus dengan penambahan sub-tab Security Center.

---

## 13. Rekomendasi Tahap 19 Berdasarkan Temuan Aktual
1. **Implementasi Nyata Modul Ujian (`feat_grading_examination`)**: Membangun skema database ujian (bank soal, jadwal sesi ujian, token peserta, dan jawaban transaksional) serta backend service sebelum membuka fitur ini.
2. **Implementasi Private Object Storage**: Mengintegrasikan MinIO lokal atau AWS S3 dengan signed URL berumur pendek untuk upload bukti surat sakit/izin siswa.
3. **Hardware Gateway Absensi RFID**: Mengembangkan firmware ESP32 dan microservice MQTT terotentikasi untuk pembacaan kartu RFID fisik di gerbang sekolah.
