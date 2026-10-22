# SIAKAD SMA Pemberdayaan Bangsa — Audit Event Catalog (Tahap 18)

Katalog ini merangkum seluruh event keamanan dan operasional yang dicatat oleh sistem ke tabel `audit_logs`.

---

## 1. Domain Autentikasi & Akun

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `AUTH_LOGIN_SUCCESS` | Info (Low) | Login berhasil menggunakan kredensial valid | `username`, `role`, `ipAddress`, `userAgent` |
| `AUTH_LOGIN_FAILED` | Warning (Medium) | Percobaan login gagal (password salah / user inactive) | `attemptedUsername`, `ipAddress`, `reason` |
| `AUTH_TOKEN_REFRESHED` | Info (Low) | Penukaran refresh token valid untuk access token baru | `userId`, `ipAddress` |
| `AUTH_LOGOUT` | Info (Low) | Logout resmi, token dicabut | `userId`, `ipAddress` |
| `AUTH_SESSION_REVOKED` | High (P1) | Sesi aktif dibatalkan seketika karena reset password / deaktivasi | `targetUserId`, `revocationReason`, `executedBy` |

---

## 2. Domain Keamanan Hak Akses & Pengguna

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `USER_CREATED` | Medium | Pembuatan akun baru oleh admin | `createdUserId`, `assignedRole`, `creatorId` |
| `USER_UPDATED` | Medium | Perubahan data akun, nomor telepon, status aktif | `updatedUserId`, `changedFields`, `updaterId` |
| `USER_DELETED` | High | Penghapusan akun pengguna dari sistem | `deletedUserId`, `deletedBy` |
| `PRIVILEGE_ESCALATION_BLOCKED`| Critical (P0) | Percobaan menetapkan role DEVELOPER/SUPER_ADMIN oleh non-admin | `actorId`, `targetUserId`, `attemptedRole`, `ipAddress` |
| `ROLE_PERMISSION_UPDATED` | High (P1) | Perubahan matriks permission peran oleh SUPER_ADMIN | `targetRole`, `permissionDiff`, `authorizedBy` |

---

## 3. Domain Konfigurasi Fitur & Sistem

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `FEATURE_FLAG_TOGGLED` | Medium | Pengubahan status modul di Developer Dashboard | `featureKey`, `oldStatus`, `newStatus`, `actorId` |
| `FEATURE_ACTIVATION_BLOCKED` | High (P1) | Percobaan mengaktifkan modul yang belum diimplementasikan | `featureKey`, `targetStatus`, `rejectionReason` |
| `ATTENDANCE_SETTINGS_UPDATED`| High (P1) | Perubahan radius geofence, jam kerja, atau koordinat sekolah | `oldRadius`, `newRadius`, `oldCoords`, `newCoords`, `actorId` |
| `SECURITY_DIAGNOSTICS_RUN` | Info | Pelaksanaan uji diagnostik non-destruktif | `resultsCount`, `passedCount`, `failedCount`, `actorId` |

---

## 4. Domain Anti-Cheating & Kehadiran

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `TEACHER_CHECKIN` | Info | Check-in kehadiran guru berhasil | `sessionId`, `scheduleId`, `teacherId`, `distanceMeters`, `method` |
| `STUDENT_CHECKIN` | Info | Check-in kehadiran siswa berhasil | `sessionId`, `studentId`, `distanceMeters`, `method` |
| `ATTENDANCE_CORRECTED` | Medium | Koreksi manual kehadiran oleh guru/admin | `recordId`, `studentId`, `oldStatus`, `newStatus`, `reason`, `correctorId` |
| `ATTENDANCE_ANOMALY_DETECTED`| High / Medium | Terdeteksi anomali check-in (geofence breach, duplicate, off-schedule) | `type`, `severity`, `confidence`, `reason`, `attemptedCoordinates`, `distanceMeters`, `allowedRadiusMeters` |

---

## 5. Domain Integritas Nilai & Akademik

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `GRADE_INPUTTED` | Info | Guru mengisi atau memperbarui draft nilai | `subjectId`, `classId`, `studentId`, `component`, `teacherId` |
| `GRADE_SUBMITTED` | Medium | Guru mengajukan nilai final untuk verifikasi | `subjectId`, `classId`, `academicYear`, `submittedBy` |
| `GRADE_APPROVED` | High | Kepala Sekolah menyetujui nilai final | `subjectId`, `classId`, `approvedBy` |
| `GRADE_LOCKED` | High | Nilai dikunci permanen untuk pencetakan rapor | `subjectId`, `classId`, `academicYear`, `lockedBy` |
| `GRADE_UNLOCK_REQUESTED`| Critical | Permohonan resmi pembukaan kembali nilai terkunci | `subjectId`, `classId`, `reason`, `requestedBy` |

---

## 6. Domain Ekspor Data & Akses Sensitif

| Kode Event | Tingkat Risiko | Pemicu (Trigger) | Metadata Utama Tersimpan |
| :--- | :--- | :--- | :--- |
| `EXPORT_STUDENT_DATA` | High | Ekspor massal data siswa (Excel/PDF) | `exportFormat`, `filtersApplied`, `recordCount`, `actorId` |
| `EXPORT_AUDIT_LOGS` | High | Ekspor riwayat log audit untuk investigasi | `timeRange`, `recordCount`, `actorId`, `ipAddress` |
