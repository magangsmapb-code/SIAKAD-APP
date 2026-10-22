# SIAKAD SMA Pemberdayaan Bangsa — Audit Log Integrity & Governance (Tahap 18)

Dokumen ini menjelaskan arsitektur, kebijakan integritas, mekanisme sanitasi data, dan tata kelola log audit di SIAKAD SMA Pemberdayaan Bangsa.

---

## 1. Arsitektur Audit Log

Log audit diimplementasikan melalui `AuditService` (`apps/api/src/modules/audit/audit.service.ts`) dan disimpan pada tabel database PostgreSQL `audit_logs`.

### Skema Data Inti
- `id` (UUIDv4): Identitas unik log audit.
- `createdAt` (Timestamp with timezone): Waktu mutlak server (bukan waktu lokal browser/klien).
- `userId` (UUID, nullable): Identitas pengguna pelaku aksi (null jika tindakan sistem/anomali pra-autentikasi).
- `action` (String): Nama aksi terstandarisasi (misal: `AUTH_LOGIN_SUCCESS`, `ATTENDANCE_ANOMALY_DETECTED`).
- `resource` (String): Entitas target yang terdampak (misal: `AttendanceRecord`, `User`, `FeatureRegistry`).
- `resourceId` (String, nullable): ID spesifik objek target.
- `details` (JSONB): Metadata kontekstual yang telah melalui proses sanitasi data sensitif.

---

## 2. Prinsip Integritas Bukti (Audit Evidence Integrity)

1. **Append-Only Pattern**:
   - Secara arsitektural dan operasional, tabel `audit_logs` hanya menerima operasi `INSERT`.
   - Tidak ada endpoint API yang menyediakan mutasi (`UPDATE`) atau penghapusan (`DELETE`) pada `audit_logs`.
   - Pada tingkat database, role operasional aplikasi dibatasi agar tidak dapat memodifikasi log historis.

2. **Klaim Immutabilitas Jujur & Terbuka**:
   - Sistem **tidak mengklaim** audit log 100% *cryptographically immutable* (seperti WORM drive fisik atau public blockchain) karena superuser database (DBA `postgres`) secara teknis memiliki akses shell langsung ke penyimpanan disk.
   - Namun, integritas log dijaga melalui:
     - Pemisahan hak akses aplikasi vs DBA.
     - Redundansi log audit ke backup harian terenkripsi.
     - Perekaman correlation ID dan IP address penyerang saat terdeteksi anomali.

3. **Atomic Execution pada Operasi Kritis**:
   - Mutasi data penting (misalnya koreksi kehadiran atau perubahan role) dijalankan dalam satu transaksi database Prisma bersamaan dengan pencatatan audit log. Jika pencatatan log gagal, transaksi dibatalkan (rollback) untuk mencegah aksi tanpa jejak audit.

---

## 3. Kebijakan Sanitasi Data Sensitif (Data Sanitization)

Log audit **dilarang keras** menyimpan:
- Password plain-text maupun hash bcrypt.
- Token otentikasi (JWT Access Token / Refresh Token).
- Kunci privat, API Secret, MFA secret / OTP.
- Data biometrik mentah siswa.

### Aturan Redaksi Otomatis (`[REDACTED]`)
`AuditService` secara otomatis memindai dan mengganti field-field sensitif pada metadata sebelum menulis ke database:
```typescript
const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'secret', 'otp', 'creditCard'];
function sanitizePayload(payload: any) {
  // Rekursif mengganti nilai kunci sensitif dengan "[REDACTED]"
}
```

---

## 4. Retensi dan Akses Log Audit

| Kategori Log | Periode Retensi Minimum | Pembatasan Hak Akses |
| :--- | :--- | :--- |
| **Autentikasi & Akun** | 365 Hari (1 Tahun) | `SUPER_ADMIN`, `DEVELOPER` |
| **Kehadiran & Anomali** | 730 Hari (2 Tahun Akademik) | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `DEVELOPER` |
| **Nilai & Rapor** | 1825 Hari (5 Tahun) | `SUPER_ADMIN`, `PRINCIPAL` |
| **Perubahan Fitur/Infra** | 365 Hari (1 Tahun) | `SUPER_ADMIN`, `DEVELOPER` |

Setelah masa retensi aktif berakhir, log diarsipkan secara terkompresi dan terenkripsi ke cold storage dengan akses terkunci.
