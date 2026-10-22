# SIAKAD Mobile — SMA Pemberdayaan Bangsa Ngrayun

Aplikasi Frontend Android SIAKAD (Sistem Informasi Absensi Kehadiran Akurat Digital) dibangun menggunakan **Flutter** dan **Dart**, terpisah dari aplikasi web Next.js namun mengadopsi identitas visual, skema warna akademis (*Academic Navy* `#1E3A8A` & *Emerald* `#059669`), dan dataset mock yang konsisten.

---

## 📱 Ringkasan Fitur

### 1. Multi-Peran (Extensible Roles)

- **Guru / Pendidik** (`Siti Rahmawati, S.Pd.` — NIP: `198403152009032008`):
  - Ringkasan kelas mengajar hari ini.
  - Alur absensi interaktif: pemilihan status (Hadir, Terlambat, Sakit, Izin, Alpa).
  - Pencarian nama dan NIS siswa.
  - Catatan spesifik ketidakhadiran (misal: surat dokter, izin keluarga).
  - Tombol cepat *Semua Hadir*.
  - Penyimpanan **Draft Lokal** (offline-first).
  - Konfirmasi penyimpanan & antrean sinkronisasi (*Sync Queue*).
- **Siswa** (`Aditya Pratama Putra` — NIS: `2401` • X MIPA 1):
  - Ringkasan tingkat kehadiran semester berjalan ($(\text{Hadir} + \text{Terlambat}) / \text{Total Sesi} \times 100\%$).
  - Penghitung mandiri Hadir, Terlambat, Sakit, Izin, Alpa.
  - Jadwal pelajaran harian dan sepekan.
  - Form pengajuan izin & sakit online dengan simulasi lampiran dokumen.
  - Status peninjauan izin oleh wali kelas (Menunggu, Disetujui, Ditolak).
  - Riwayat detail absensi terdahulu beserta catatan guru.
- Struktur `UserRole` telah siap dikembangkan untuk peran **Admin** dan **Orang Tua / Wali**.

### 2. Pengalaman Mobile & Desain Antarmuka

- **Navigasi Bawah**: Menu tab responsif per peran.
- **Kemudahan Satu Tangan**: Tombol aksi utama (Simpan Draft, Kirim Absensi, Ajukan Izin) diletakkan di bagian bawah layar (*bottom sheet / sticky action bar*).
- **Indikator Visual Sinkronisasi**:
  - Badge *Draft Lokal* (Biru)
  - Badge *Menunggu Sinkronisasi* (Oranye)
  - Badge *Tersinkron* (Hijau Emerald)
  - Top Banner *Mode Offline* otomatis muncul saat simulasi jaringan terputus.
- **Komponen & Tema**:
  - Dukungan Tema Sistem, Terang (*Light*), dan Gelap (*Dark*).
  - Status badging yang konsisten dengan aplikasi website.
  - Dialog konfirmasi (`ConfirmDialog`) sebelum tindakan penting (Kirim absensi, Logout).
  - *Empty State*, *Error State*, dan *Loading Indicator* di setiap modul.

---

## 🏛️ Struktur Arsitektur Modular

```text
apps/mobile/lib/
├── app/
│   ├── app.dart                   # Root MaterialApp & AppStateScope
│   └── constants.dart             # Identitas sekolah, tahun ajaran, semester
├── core/
│   ├── routing/
│   │   └── app_router.dart        # Named routes & navigator
│   ├── theme/
│   │   ├── app_colors.dart        # Color palette (Navy, Emerald, Amber, Rose)
│   │   └── app_theme.dart         # Material 3 Light & Dark themes
│   └── widgets/
│       ├── confirm_dialog.dart    # Dialog konfirmasi aksi penting
│       ├── empty_state.dart       # Komponen empty view reusable
│       ├── offline_banner.dart    # Banner penanganan koneksi terputus
│       ├── status_badge.dart      # Badge kehadiran & sesi
│       └── sync_badge.dart        # Badge draft lokal vs tersinkron
├── data/
│   ├── mock/
│   │   └── mock_data.dart         # Mock datasets selaras dengan Next.js SIAKAD
│   ├── models/
│   │   ├── attendance_model.dart  # AttendanceStatus, Session, Entries
│   │   ├── permission_model.dart  # PermissionItem, Type, Status
│   │   ├── schedule_model.dart    # ScheduleItem
│   │   ├── student_model.dart     # StudentItem, Gender
│   │   └── user_model.dart        # User, UserRole
│   └── repositories/
│       ├── attendance_repository.dart
│       ├── auth_repository.dart
│       ├── permission_repository.dart
│       └── schedule_repository.dart
├── features/
│   ├── attendance/
│   │   ├── attendance_form_screen.dart # Form absensi interaktif
│   │   ├── session_list_screen.dart    # Daftar kelas yang perlu diabsen
│   │   └── sync_queue_screen.dart      # Antrean sinkronisasi & tombol sync
│   ├── auth/
│   │   ├── forgot_password_screen.dart # UI lupa password
│   │   ├── login_screen.dart           # Login guru & siswa + autofill
│   │   ├── role_selection_screen.dart  # Demo role switcher
│   │   └── splash_screen.dart          # Splash screen & bootstrapper
│   ├── dashboard/
│   │   ├── main_navigation_shell.dart  # Bottom navigation shell
│   │   ├── student_dashboard_screen.dart
│   │   └── teacher_dashboard_screen.dart
│   ├── history/
│   │   └── attendance_history_screen.dart # Riwayat kehadiran berfilter
│   ├── permissions/
│   │   ├── permission_form_screen.dart # Form pengajuan izin siswa
│   │   └── permission_list_screen.dart # Daftar status pengajuan izin
│   ├── profile/
│   │   ├── help_screen.dart            # FAQ & kontak sekolah
│   │   ├── notifications_screen.dart   # Feed notifikasi
│   │   ├── profile_screen.dart         # Profil & menu logout
│   │   └── settings_screen.dart        # Pengaturan tema & simulasi offline
│   └── schedules/
│       └── schedule_list_screen.dart   # Jadwal harian & mingguan
├── state/
│   └── app_state.dart             # Reactive state management (ChangeNotifier)
└── main.dart                      # Bootstrap & inisialisasi lokal Indonesia
```

---

## 🚀 Cara Menjalankan Proyek

SDK Flutter tersedia di direktori lokal:
`c:\xampp\htdocs\SIAKAD APP\Flutter\flutter\bin\flutter.bat`

### 1. Menjalankan Analisis Statis Dart

```powershell
cd "c:\xampp\htdocs\SIAKAD APP\apps\mobile"
& "..\..\Flutter\flutter\bin\flutter.bat" analyze
```

*Hasil: `No issues found!` (0 error, 0 warning).*

### 2. Menjalankan Pengujian Otomatis (Unit & Widget Test)

```powershell
& "..\..\Flutter\flutter\bin\flutter.bat" test
```

*Hasil: `All tests passed!` (4 pengujian berhasil).*

### 3. Menjalankan Aplikasi Mobile

- **Di Perangkat Android Terhubung (atau Emulator):**

  ```powershell
  & "..\..\Flutter\flutter\bin\flutter.bat" run
  ```

- **Di Browser (Chrome Web) untuk Demonstrasi Responsif Cepat:**

  ```powershell
  & "..\..\Flutter\flutter\bin\flutter.bat" run -d chrome
  ```

- **Di Aplikasi Desktop Windows:**

  ```powershell
  & "..\..\Flutter\flutter\bin\flutter.bat" run -d windows
  ```

---

## 📋 Catatan Lingkungan & Keterbatasan Tahap Ini

1. **Flutter SDK**: Tersedia versi **Flutter 3.47.7 (Channel stable) • Dart 3.13.5**.
2. **Android Toolchain**: Pada sistem Windows ini, Android Studio / `cmdline-tools` belum terpasang (`ANDROID_HOME` belum terdefinisi). Oleh karena itu, pengujian build APK langsung membutuhkan instalasi Android Command Line Tools terlebih dahulu. Sesuai instruksi, kami tidak mengklaim APK sudah berhasil dibangun secara fisik sebelum toolchain tersebut dikonfigurasi.
3. **Penyimpanan Offline & Sinkronisasi**:
   - Seluruh alur offline-first diimplementasikan pada level repository menggunakan arsitektur antrean sinkronisasi (`SyncQueue`).
   - Sesi dapat disimpan sebagai draft lokal (`isLocalDraft = true`, `isSynced = false`), lalu disinkronkan melalui tombol *Sinkronkan Sekarang*.
   - Simulasi koneksi online/offline dapat diuji secara langsung melalui menu Pengaturan maupun tombol cepat di layar Antrean Sinkronisasi.
