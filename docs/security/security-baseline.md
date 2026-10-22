# 🛡️ SECURITY BASELINE AUDIT
## SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
*Versi Dokumen: 1.0.0 | Tahap: 18 — Security Hardening, Zero-Trust & Audit Integrity | Tanggal: 21 Oktober 2026*

---

### 1. Ringkasan Eksekutif & Status Sistem

Audit baseline keamanan ini dilakukan sebelum implementasi modifikasi kode pada Tahap 18, berlandaskan arsitektur aktual repositori, status database PostgreSQL 18, aplikasi web Next.js 15, backend NestJS 10, dan aplikasi mobile Flutter 3.47.

Sistem SIAKAD SMA Pemberdayaan Bangsa mengelola data pokok akademik, direktori guru, rombongan belajar, jadwal pelajaran, presensi digital, permohonan dispensasi/izin, serta tata kelola fitur. Audit ini menetapkan kondisi dasar sebelum perbaikan, mengidentifikasi kontrol yang telah berjalan, kontrol yang belum memadai, serta fitur yang belum diimplementasikan.

---

### 2. Inventarisasi Komponen & Teknologi Aktual

| Komponen | Teknologi Aktual | Versi / Runtimes | Status Operasional |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | Next.js (App Router, React 19) | 15.1.7 | Aktif (Port 3000, 16 route statis/dinamis) |
| **Backend REST API** | NestJS, Express | 10.4.15 | Aktif (Port 4000, prefix `/api/v1`) |
| **Database ORM** | Prisma Client & CLI | 5.22.0 | Aktif (PostgreSQL 18, 17 model data) |
| **Mobile App** | Flutter SDK, Dart | Flutter 3.47.7, Dart 3.13.5 | Aktif (17 unit test lulus) |
| **Database Engine** | PostgreSQL 18 | 18.0 (Local / Production) | Aktif dengan data civitas riil |
| **Autentikasi** | JWT (Dual-token: Access & Refresh) | bcrypt 10 rounds, Passport | Aktif (Access 15m, Refresh 7d) |
| **Keamanan HTTP** | Helmet, Cookie-Parser, CORS | Helmet bawaan Express | Aktif di `main.ts` |
| **Rate Limiter** | `@nestjs/throttler` | TTL 60000ms, Limit 100 req | Global Guard di `app.module.ts` |

---

### 3. Pemetaan Role & Hak Akses Berdasarkan Skema Database

Skema Prisma mendefinisikan enum `Role` sebagai berikut:
1. `SUPER_ADMIN`: Administrator institusi tertinggi dengan wewenang penuh tata kelola akun dan kebijakan.
2. `DEVELOPER`: Pengelola infrastruktur teknis, feature toggle, diagnostik server, dan pengaturan modul.
3. `ADMIN`: Staf pengelola operasional harian akademik, guru, siswa, dan absensi.
4. `SCHOOL_ADMIN`: Tenaga Tata Usaha (TU) pengelola administrasi siswa dan permohonan.
5. `PRINCIPAL`: Kepala Sekolah pengawas laporan kehadiran, statistik akademik, dan persetujuan kebijakan.
6. `TEACHER`: Tenaga pendidik pembuka sesi absensi KBM, pengoreksi kehadiran, dan review izin.
7. `STUDENT`: Murid yang melihat jadwal, presensi pribadi, dan mengajukan surat permohonan izin/sakit.

---

### 4. Evaluasi Kontrol Keamanan yang Sudah Berjalan

1. **Dual-Token Authentication dengan Refresh Token Hashing**:
   - Access token berumur pendek (15 menit) diletakkan pada memory dan `HttpOnly` cookie.
   - Refresh token berumur 7 hari disimpan dalam database dalam bentuk hash `bcrypt` (bukan teks polos).
   - Deteksi token reuse: jika token yang dikirim tidak cocok dengan hash di DB, seluruh sesi dicabut seketika (`SECURITY_TOKEN_REUSE_DETECTED`).
2. **Validasi DTO Global**:
   - `ValidationPipe` global diaktifkan dengan opsi `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`, mencegah mass assignment dan parameter injection.
3. **Database Unique Constraints**:
   - `AttendanceRecord`: `@@unique([sessionId, studentId])` mencegah check-in ganda di tingkat basis data.
   - `TeacherAttendance`: `@@unique([teacherId, date])` mencegah check-in masuk berulang untuk guru pada hari yang sama.
   - `ClassEnrollment`: `@@unique([studentId, classId, academicYearId])` mencegah duplikasi pendaftaran kelas.
4. **Isolasi Data Siswa**:
   - Endpoint `GET /students/:id` memverifikasi kepemilikan data (`currentUser.role === Role.STUDENT && currentUser.studentId !== id`), mencegah IDOR.
5. **Pencegahan Aktivasi Fitur Semu**:
   - `FeaturesService.update` memblokir pengaktifan fitur berstatus `NOT_IMPLEMENTED` (seperti `feat_grading_examination`).
   - Memeriksa rantai dependensi sebelum mengizinkan aktivasi fitur.
6. **Sanitasi Audit Log**:
   - `AuditService.sanitizeData()` otomatis menyamarkan field sensitif (`password`, `passwordHash`, `refreshToken`, `token`, `secret`) menjadi `[REDACTED]`.

---

### 5. Celah Keamanan & Temuan Baseline (Gap Analysis)

| ID Temuan | Kategori | Tingkat Risiko | Deskripsi Temuan | Lokasi Kode | Status Sebelum Tahap 18 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Authorization | **CRITICAL** | `RolesGuard` dan `PermissionsGuard` memberikan bypass otomatis tanpa batas kepada `DEVELOPER`. Hal ini memungkinkan peran teknis memodifikasi presensi akademik dan nilai siswa secara langsung. | `common/guards/roles.guard.ts`, `common/guards/permissions.guard.ts` | **OPEN (Perlu Hardening)** |
| **SEC-02** | Privilege Escalation | **CRITICAL** | Endpoint `POST /users` dan `PATCH /users/:id` hanya membatasi promosi `SUPER_ADMIN`, namun belum membatasi promosi `DEVELOPER` oleh peran `ADMIN`. | `modules/users/users.service.ts` | **OPEN (Perlu Hardening)** |
| **SEC-03** | Session Security | **HIGH** | Saat admin mengubah kata sandi pengguna atau menonaktifkan pengguna (`isActive: false`), refresh token pengguna belum di-revoke (`refreshToken: null`), sehingga sesi aktif lama berpotensi masih dapat di-refresh. | `modules/users/users.service.ts` | **OPEN (Perlu Hardening)** |
| **SEC-04** | Anti-Cheating | **HIGH** | Kegagalan absensi berulang (di luar jadwal, di luar radius GPS, benturan kelas) hanya mengembalikan error ke klien dan belum diagregasi ke pipeline deteksi anomali untuk peninjauan manusia (*human review*). | `modules/attendance/attendance.service.ts` | **OPEN (Perlu Hardening)** |
| **SEC-05** | Storage Security | **MEDIUM** | Bukti surat sakit/izin masih menggunakan metadata teks (`attachmentUrl`) tanpa object storage privat (S3/MinIO) dan belum ada generator signed URL berumur pendek. | `modules/permissions/permissions.service.ts` | **NOT_CONFIGURED (Perlu Isolasi & Dok)** |
| **SEC-06** | Developer UI | **MEDIUM** | Developer Dashboard belum memiliki tab khusus Security Overview yang menyajikan ringkasan temuan risiko, status rate limiting, MFA, dan tombol uji kontrol keamanan non-destruktif. | `src/features/settings/components/developer-dashboard-view.tsx` | **OPEN (Perlu Integrasi)** |

---

### 6. Status Modul yang Belum Diimplementasikan

Sesuai instruksi audit dan pencegahan klaim fiktif:
- **`feat_grading_examination` (Ujian CBT & Rapor)**: Berstatus **`NOT_IMPLEMENTED`**. Tidak ada tabel ujian atau penilaian pada skema database. Modul terkunci dari aktivasi dan tidak boleh diklaim telah memiliki anti-cheat ujian.
- **`feat_tu_payment_gateway` (Pembayaran SPP Online)**: Berstatus **`NOT_IMPLEMENTED`**.
- **`feat_notification_whatsapp` (Gateway WhatsApp Notifikasi)**: Berstatus **`NOT_IMPLEMENTED`**.
- **Hardware Fisik RFID/ESP32**: Berstatus **`MOCK / SIMULATOR STAGED`**. Kiosk reader beroperasi menggunakan emulator batch API dan belum terpasang fisik di gerbang sekolah.

---

### 7. Hasil Baseline Testing Sebelum Perubahan

- **Frontend Linter (`npm run lint`)**: 0 errors, 0 warnings (100% CLEAN).
- **Frontend Typecheck (`npm run typecheck`)**: Exit code 0 (TypeScript Strict PASSED).
- **Frontend Production Build (`npm run build`)**: 16/16 route statis dan dinamis ter-generate sukses.
- **Backend Unit Tests (`npm test`)**: 5 test suite, 28 test cases lulus (100% PASSED).
- **Backend Production Build (`nest build`)**: Exit code 0 (PASSED).
- **Prisma Schema (`npx prisma validate`)**: Skema valid dan sinkron dengan PostgreSQL 18.
- **Flutter Mobile (`flutter test` & `flutter analyze`)**: 17 unit test lulus, 0 analysis issues.
