# SIAKAD SMA Pemberdayaan Bangsa — API Security Matrix (Tahap 18)

Dokumen ini memetakan seluruh endpoint API backend (`apps/api`), kontrol keamanan, autentikasi, otorisasi, pembatasan lingkup data, rate limit, pencatatan audit, dan status pengujian.

---

## 1. Standar Keamanan Endpoint
1. **Transport Layer Security**: Wajib HTTPS di lingkungan produksi.
2. **Authentication**: Bearer Token (JWT). Token ditolak jika kedaluwarsa, dicabut (`refreshToken = null`), atau pengguna `isActive: false`.
3. **Data Scope**: Validasi kepemilikan data (Owner Data Scope). Guru hanya dapat mengakses kelas/jadwal miliknya, siswa hanya dapat melihat data dirinya.
4. **Rate Limiting**: Diterapkan melalui `@nestjs/throttler` (Global: 100 req/60s; Auth: 5 req/60s; Sensitive: 10 req/60s).
5. **Audit Event**: Seluruh mutasi data dan anomali keamanan dicatat ke database tabel `audit_logs`.

---

## 2. Matriks Keamanan Endpoint Backend

| Method | Endpoint | Authentication | Permission / Role | Data Scope | Rate Limit | Audit Event | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Publik | Tidak ada | Akses Kredensial | 5 req / 60s | `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILED` | **VERIFIED** |
| `POST` | `/auth/refresh` | Publik (Header/Body) | Refresh Token Valid | User Session | 10 req / 60s | `AUTH_TOKEN_REFRESHED` | **VERIFIED** |
| `POST` | `/auth/logout` | JWT Guard | Terotentikasi | Current User | 10 req / 60s | `AUTH_LOGOUT` | **VERIFIED** |
| `GET` | `/auth/me` | JWT Guard | Terotentikasi | Current User Only | 60 req / 60s | None (Read) | **VERIFIED** |
| `GET` | `/users` | JWT Guard | `SUPER_ADMIN, ADMIN, DEVELOPER` / `users.view` | Semua Akun (Filtered) | 60 req / 60s | None (Read) | **VERIFIED** |
| `POST` | `/users` | JWT Guard | `SUPER_ADMIN, ADMIN` / `users.create` | Institusi | 10 req / 60s | `USER_CREATED` | **VERIFIED** |
| `PATCH`| `/users/:id` | JWT Guard | `SUPER_ADMIN, ADMIN` / `users.update` | Institusi (Privileged Role isolated to SUPER_ADMIN) | 10 req / 60s | `USER_UPDATED` / `SESSION_REVOKED` | **VERIFIED** |
| `DELETE`| `/users/:id` | JWT Guard | `SUPER_ADMIN` / `users.delete` | Institusi | 5 req / 60s | `USER_DELETED` | **VERIFIED** |
| `GET` | `/attendance/stats` | JWT Guard | `SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER` | Global / Teacher Classes | 60 req / 60s | None (Read) | **VERIFIED** |
| `GET` | `/attendance/daily` | JWT Guard | `SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER` | Global / Teacher Classes | 60 req / 60s | None (Read) | **VERIFIED** |
| `GET` | `/attendance/monthly` | JWT Guard | `SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER` | Global / Teacher Classes | 60 req / 60s | None (Read) | **VERIFIED** |
| `GET` | `/attendance/settings` | JWT Guard | `SUPER_ADMIN, ADMIN, DEVELOPER` | Konfigurasi Sekolah | 60 req / 60s | None (Read) | **VERIFIED** |
| `PATCH`| `/attendance/settings` | JWT Guard | `SUPER_ADMIN, ADMIN, DEVELOPER` / `attendance.manage_settings` | Konfigurasi Sekolah | 10 req / 60s | `ATTENDANCE_SETTINGS_UPDATED` | **VERIFIED** |
| `POST` | `/attendance/check-in/teacher` | JWT Guard | `TEACHER` / `attendance.create` | Assigned Schedule Only | 10 req / 60s | `TEACHER_CHECKIN` / `ATTENDANCE_ANOMALY_DETECTED` | **VERIFIED** |
| `POST` | `/attendance/check-in/student` | JWT Guard | `STUDENT` / `attendance.create` | Self Student ID Only | 10 req / 60s | `STUDENT_CHECKIN` / `ATTENDANCE_ANOMALY_DETECTED` | **VERIFIED** |
| `GET` | `/attendance/anomalies` | JWT Guard | `SUPER_ADMIN, ADMIN, PRINCIPAL, DEVELOPER` / `attendance.view_audit_log` | Security Review Filter | 30 req / 60s | None (Read Audit) | **VERIFIED** |
| `GET` | `/features` | JWT Guard | `SUPER_ADMIN, DEVELOPER` | System Feature Flags | 60 req / 60s | None (Read) | **VERIFIED** |
| `POST` | `/features/:featureKey/toggle` | JWT Guard | `SUPER_ADMIN, DEVELOPER` / `developer.manage_features` | System (Unbuilt features blocked) | 10 req / 60s | `FEATURE_FLAG_TOGGLED` | **VERIFIED** |
| `GET` | `/features/permissions/matrix` | JWT Guard | `SUPER_ADMIN, DEVELOPER` | Security Policy | 60 req / 60s | None (Read) | **VERIFIED** |
| `PATCH`| `/features/permissions/role/:role` | JWT Guard | `SUPER_ADMIN` Only (SUPER_ADMIN immutable) | Role Permissions | 10 req / 60s | `ROLE_PERMISSION_UPDATED` | **VERIFIED** |
| `GET` | `/features/security/overview` | JWT Guard | `SUPER_ADMIN, DEVELOPER` | Security Metrics & Posture | 30 req / 60s | None (Read) | **VERIFIED** |
| `POST` | `/features/security/diagnostics` | JWT Guard | `SUPER_ADMIN, DEVELOPER` | Non-destructive Assertions | 5 req / 60s | `SECURITY_DIAGNOSTICS_RUN` | **VERIFIED** |
| `POST` | `/examination/*` | N/A | `NOT_IMPLEMENTED` | N/A | N/A | N/A | **LOCKED (400)** |
| `POST` | `/payments/*` | N/A | `NOT_IMPLEMENTED` | N/A | N/A | N/A | **LOCKED (400)** |

---

## 3. Hasil Pengujian Endpoint Negatif & Otorisasi
- **Unauthenticated Access**: Mengembalikan `401 Unauthorized`.
- **Wrong Role (e.g., Student accessing `/users`)**: Mengembalikan `403 Forbidden`.
- **Developer Access to Teacher Check-in**: Mengembalikan `403 Forbidden`.
- **Privilege Escalation in Body Payload (`role: "SUPER_ADMIN"`)**: Ditolak dengan `403 Forbidden` jika dilakukan oleh non-`SUPER_ADMIN`.
- **Cross-Account Data Manipulation**: Student ID diverifikasi terhadap token subject; manipulasi `studentId` ditolak.
- **Unimplemented Feature Activation**: Mengembalikan `400 Bad Request` ("Cannot enable unimplemented feature...").
