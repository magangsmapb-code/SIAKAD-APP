# SIAKAD SMA Pemberdayaan Bangsa — Role & Permission Matrix (Tahap 18)

Dokumen ini mendefinisikan pemetaan hak akses berbasis peran (Role-Based Access Control / RBAC) yang diimplementasikan secara tegas pada backend (NestJS Guards, Services) dan disinkronkan dengan Developer Dashboard.

---

## 1. Prinsip Otorisasi (Zero Trust & Least Privilege)

1. **Deny-by-Default**: Setiap endpoint yang dilindungi mengharuskan otentikasi JWT valid dan pemeriksaan eksplisit peran (`@Roles`) atau izin (`@Permission`).
2. **Server-Side Enforcement**: Backend adalah otoritas mutlak. Tampilan menu atau tombol tersembunyi di frontend hanyalah kenyamanan UI (UX helper), bukan kontrol keamanan.
3. **Pemisahan Peran Developer & Akademik**: Peran `DEVELOPER` dikhususkan untuk tata kelola infrastruktur teknis, feature toggles, dan observabilitas sistem. `DEVELOPER` tidak memiliki bypass otomatis ke data akademik siswa/guru (nilai, kehadiran, rapor, transaksi keuangan).
4. **Super Admin Immutability**: Hanya `SUPER_ADMIN` yang memiliki otoritas penuh lintas sistem dan hak menugaskan peran `SUPER_ADMIN` atau `DEVELOPER`.

---

## 2. Definisi Peran Sistem

| Peran | Kode Enum | Lingkup Tanggung Jawab |
| :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | Administrator tertinggi sistem, tata kelola akun istimewa, audit master |
| **Developer** | `DEVELOPER` | Konfigurasi teknis, feature flag registry, diagnostik sistem, observabilitas (tanpa akses mutasi akademik) |
| **Kepala Sekolah** | `PRINCIPAL` | Pengawasan institusi, persetujuan akhir nilai & rapor, pemantauan absensi makro |
| **Tata Usaha** | `ADMIN` / `TU` | Pengelolaan data master siswa, guru, kelas, surat menyurat, administrasi umum |
| **Guru** | `TEACHER` | Pencatatan absensi kelas yang diampu, input nilai mata pelajaran, jurnal mengajar |
| **Murid** | `STUDENT` | Akses data diri, check-in absensi mandiri, melihat nilai, melihat jadwal |

---

## 3. Matriks Hak Akses Granular (Permission Matrix)

Keterangan:
- `✓` : Memiliki izin secara default
- `✗` : Ditolak (Forbidden 403)
- `*` : Dibatasi oleh lingkup kepemilikan data (Owner / Assigned Class Scope)

| Modul / Domain | Kode Permission | SUPER_ADMIN | DEVELOPER | PRINCIPAL | ADMIN (TU) | TEACHER | STUDENT |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pengguna** | `users.view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| | `users.create` | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| | `users.update` | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| | `users.delete` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| | `users.manage_roles` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Pengaturan** | `settings.view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| | `settings.manage` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Audit Log** | `audit.view` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| | `audit.export` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **Developer / Infra**| `developer.manage_features` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| | `developer.view_diagnostics` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Absensi** | `attendance.view_own` | ✓ | ✗ | ✓ | ✓ | ✓* | ✓* |
| | `attendance.view_all` | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| | `attendance.create` | ✓ | ✗ | ✗ | ✓ | ✓* | ✓* |
| | `attendance.correct` | ✓ | ✗ | ✓ | ✓ | ✓* | ✗ |
| | `attendance.manage_settings` | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| | `attendance.manage_feature_access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| | `attendance.view_audit_log` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Nilai & Rapor** | `grading.view_own` | ✓ | ✗ | ✓ | ✓ | ✓* | ✓* |
| | `grading.input` | ✓ | ✗ | ✗ | ✗ | ✓* | ✗ |
| | `grading.approve` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| | `grading.lock` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **Ujian (Not Impl)**| `examination.take` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| | `examination.manage` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 4. Mekanisme Penegakan di Backend

### 4.1 Roles Guard (`roles.guard.ts`)
```typescript
// SUPER_ADMIN mempertahankan akses darurat penuh (Break-glass access)
if (user.role === Role.SUPER_ADMIN) {
  return true;
}
// DEVELOPER dievaluasi secara ketat berdasarkan decorator @Roles() endpoint
return requiredRoles.includes(user.role);
```

### 4.2 Permissions Guard (`permissions.guard.ts`)
```typescript
// SUPER_ADMIN memiliki seluruh izin
if (user.role === Role.SUPER_ADMIN) {
  return true;
}
// Evaluasi izin spesifik pengguna terhadap permission endpoint
return requiredPermissions.some((permission) => userPermissions.includes(permission));
```

### 4.3 Isolasi Penugasan Peran Istimewa (`users.service.ts`)
Upaya penugasan peran `SUPER_ADMIN` atau `DEVELOPER` oleh pengguna non-`SUPER_ADMIN` akan ditolak secara eksplisit dengan status `ForbiddenException`:
```typescript
if ((role === Role.DEVELOPER || role === Role.SUPER_ADMIN) && currentUserRole !== Role.SUPER_ADMIN) {
  throw new ForbiddenException('Only SUPER_ADMIN can assign privileged DEVELOPER or SUPER_ADMIN roles');
}
```

---

## 5. Sinkronisasi Developer Dashboard
Matriks izin ini tercermin secara transparan pada Developer Dashboard (`/settings`), memungkinkan `SUPER_ADMIN` mengaktifkan/menonaktifkan permission tertentu per peran secara dinamis tanpa mengubah baris kode, sementara proteksi immutabilitas mencegah perubahan yang menurunkan keamanan sistem inti.
