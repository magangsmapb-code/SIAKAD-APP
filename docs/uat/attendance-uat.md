# 📋 DOKUMEN USER ACCEPTANCE TESTING (UAT) — MODUL ABSENSI
## SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
*Versi Dokumen: 1.0.0 | Tanggal Uji Staging: 21 Oktober 2026 | Lingkungan: Staging / Localhost*

---

### 1. Informasi Dokumen & Tim Penguji

| Parameter | Keterangan |
| :--- | :--- |
| **Aplikasi** | SIAKAD (Sistem Informasi Absensi Kehadiran Akurat Digital) |
| **Instansi** | SMA Pemberdayaan Bangsa Ngrayun, Ponorogo |
| **Modul Teruji** | Modul Absensi Terpadu & Developer Governance (Tahap 17) |
| **Target Pengguna** | Developer, Super Admin, Tata Usaha/Admin, Kepala Sekolah, Guru Pengampu, Murid |
| **Metodologi** | Role-Based Access Testing, Geofencing Boundary Validation, ACID Transaction Testing |

#### Penanggung Jawab Pengujian:
- **Lead QA Engineer**: Tim QA SIAKAD SMA PB Ngrayun
- **Application Security Engineer**: Tim DevSecOps SIAKAD
- **Petugas Tata Usaha / Operator Sekolah**: Operator SIAKAD Staging
- **Koordinator Guru Piket**: Guru Pengampu SMA PB Ngrayun

---

### 2. Prasyarat Pengujian (Prerequisites)

1. Backend API aktif di `http://localhost:4000/api/v1` dengan database PostgreSQL 18 `siakad_db`.
2. Frontend Next.js aktif di `http://localhost:3000`.
3. Aplikasi Flutter mobile siap dijalankan di Google Chrome (`flutter run -d chrome`) atau perangkat Android.
4. Kredensial akun uji coba terdaftar dan aktif di database:
   - `superadmin` / `admin123` (Role: `SUPER_ADMIN`)
   - `admin` / `admin123` (Role: `ADMIN`)
   - `kepala.sekolah` / `password123` (Role: `PRINCIPAL`)
   - `198403152009032008` / `password123` (Role: `TEACHER` — Siti Rahmawati, S.Pd.)
   - `2401` / `password123` (Role: `STUDENT` — Aditya Pratama Putra)

---

### 3. Matriks Skenario UAT Modul Absensi

#### Kategori Status UAT:
- **LULUS (PASS)**: Terverifikasi berfungsi sesuai spesifikasi teknis dan aturan bisnis.
- **GAGAL (FAIL)**: Ditemukan kecacatan fungsional atau inkonsistensi data.
- **BELUM DIUJI (PENDING/UAT FIELD)**: Memerlukan interaksi fisik di lapangan sekolah (kiosk gerbang, sidik jari/kartu fisik).

---

#### 📌 SKENARIO A: DEVELOPER & GOVERNANCE KENDALI FITUR

| Kode UAT | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status | Penguji & Tanggal |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-DEV-01** | Akses Developer Dashboard & Feature Registry | Login sebagai `superadmin` / `developer`, buka `/settings` (Tab Developer Dashboard). | Halaman kontrol fitur memuat daftar 13 modul sistem dengan status implementasi dan tombol switch aksi. | Halaman memuat 13 fitur, status online, latensi API, dan integrasi PostgreSQL. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-DEV-02** | Pengaturan Mode Maintenance Modul Absensi | Klik tombol Maintenance pada fitur `feat_attendance_session`, masukkan alasan pemeliharaan, lalu konfirmasi. | Status modul berubah ke `MAINTENANCE` di database `feature_registries`, tercatat di `audit_logs`, dan endpoint backend `/attendance` mengembalikan HTTP 403 Forbidden untuk pengguna non-developer. | Guard backend `AttendanceModuleStatusGuard` menolak permintaan dengan pesan maintenance resmi. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-DEV-03** | Pencegahan Aktivasi Semu Fitur Unbuilt | Coba aktifkan fitur berkategori `NOT_IMPLEMENTED` (misal `feat_grading_examination` atau `feat_tu_payment_gateway`). | Sistem menolak aksi aktivasi di frontend dan backend mengembalikan HTTP 400 Bad Request dengan pesan pencegahan aktivasi semu. | Sistem menampilkan toast error penolakan dan backend membatalkan mutasi. | **LULUS** | DevSecOps • 21 Okt 2026 |
| **UAT-DEV-04** | Matriks Izin Granular Role & Overriding | Ubah status permission `attendance.student.check_in` untuk role `STUDENT` melalui matriks permission. | Rekam `role_permissions` diperbarui di PostgreSQL, audit log mencatat aksi `ROLE_PERMISSION_UPDATED`, dan hak akses langsung berubah tanpa restart server. | Matriks izin berhasil diperbarui via `PATCH /features/permissions/STUDENT`. | **LULUS** | QA Lead • 21 Okt 2026 |

---

#### 📌 SKENARIO B: ADMIN / TATA USAHA & KEPALA SEKOLAH

| Kode UAT | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status | Penguji & Tanggal |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-ADM-01** | Monitoring Ringkasan Absensi Sekolah | Login sebagai `admin`, buka `/attendance` atau `/dashboard`. | Menampilkan metrik Hadir, Terlambat, Sakit, Izin, Alpa, dan persentase kehadiran agregat seluruh kelas. | Data agregasi termuat sesuai rekap sesi KBM yang tersimpan. | **LULUS** | TU Operator • 21 Okt 2026 |
| **UAT-ADM-02** | Filter Multi-Kriteria Sesi Absensi | Terapkan filter tanggal, rombel (X MIPA 1), nama guru pengampu, dan status sesi (`SUDAH_DISIMPAN`). | Daftar sesi menyaring rekaman yang sesuai tanpa horizontal layout overflow. | Filter berjalan responsif dan menyajikan sesi yang sesuai kriteria. | **LULUS** | TU Operator • 21 Okt 2026 |
| **UAT-ADM-03** | Persetujuan & Penolakan Pengajuan Izin/Sakit | Buka menu `/permissions`, pilih permohonan siswa yang berstatus `MENUNGGU`, klik Setujui atau Tolak. | Status permohonan berubah menjadi `DISETUJUI` / `DITOLAK`, tercatat nama peninjau dan tanggal, serta terhubung ke riwayat absensi. | Modal review memproses approval dan tercatat pada tabel `permission_requests`. | **LULUS** | TU Operator • 21 Okt 2026 |
| **UAT-ADM-04** | Ekspor Laporan Rekapitulasi Presensi | Buka `/reports`, pilih periode semester/bulan, klik tombol ekspor format spreadsheet CSV / Print KOP Resmi. | File CSV terunduh dengan data siswa, NIS, kelas, dan jumlah rekap kehadiran tanpa data siswa luar lingkup. | Berkas CSV ter-generate lengkap dengan header institusi SMA PB Ngrayun. | **LULUS** | TU Operator • 21 Okt 2026 |

---

#### 📌 SKENARIO C: GURU PENGAMPU & WALI KELAS

| Kode UAT | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status | Penguji & Tanggal |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-GUR-01** | Pembukaan Sesi Absensi KBM Sesuai Jadwal | Login sebagai Guru (`198403152009032008`), klik Buka Sesi Baru untuk kelas yang diampu (XI MIPA 1). | Sesi berhasil dibuat dengan status `SEDANG_BERLANGSUNG` dan memuat seluruh siswa rombel tersebut. | Sesi terbuat di `attendance_sessions` dengan pencatat ID guru terkait. | **LULUS** | Koord Guru • 21 Okt 2026 |
| **UAT-GUR-02** | Pengisian & Penyimpanan Catatan Kehadiran Batch | Tandai status Hadir, Terlambat, Sakit, Izin, Alpa per siswa, klik Simpan Absensi. | Rekam absensi tersimpan dalam transaksi ACID database PostgreSQL. Status sesi berubah menjadi `SUDAH_DISIMPAN`. | Tersimpan atomik di `attendance_records` dengan `checkInTime` dan `recordedById`. | **LULUS** | Koord Guru • 21 Okt 2026 |
| **UAT-GUR-03** | Penolakan Pengisian Kelas Bukan Tanggung Jawab | Guru mencoba mengirimkan absensi untuk kelas yang bukan miliknya melalui request endpoint langsung. | Backend menolak dengan status HTTP 403 Forbidden: 'Akses ditolak: Anda tidak berwenang menyimpan absensi kelas ini'. | Otorisasi penugasan guru diverifikasi ketat di backend `attendance.service.ts`. | **LULUS** | DevSecOps • 21 Okt 2026 |
| **UAT-GUR-04** | Pencegahan Duplikasi ID Siswa dalam Batch | Mengirim request batch absensi dengan ID siswa duplikat pada sesi yang sama. | Backend menolak dengan HTTP 400 Bad Request: 'Terdapat ID siswa duplikat dalam pengiriman absensi'. | Divalidasi dan lolos pengujian unit Jest otomatis. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-GUR-05** | Penutupan Permanen Sesi Absensi | Guru menutup sesi absensi via aksi Tutup Sesi. | Status sesi berubah menjadi `DITUTUP`, waktu penutupan tercatat, dan perubahan selanjutnya wajib lewat koreksi. | Sesi terkunci permanen, mutasi langsung ditolak server. | **LULUS** | Koord Guru • 21 Okt 2026 |

---

#### 📌 SKENARIO D: MURID (STUDENT) & PERLINDUNGAN PRIVASI

| Kode UAT | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status | Penguji & Tanggal |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-SIS-01** | Akses Dashboard Kehadiran Pribadi | Login sebagai Siswa (`2401`), buka `/dashboard` atau `/attendance`. | Siswa hanya melihat ringkasan kehadirannya sendiri (persentase, hadir, sakit, izin, alpa) dan jadwal hari ini. | Siswa melihat data profil Aditya Pratama Putra tanpa data personal siswa lain. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-SIS-02** | Pencegahan IDOR (Insecure Direct Object Reference) | Siswa mencoba mengakses endpoint data kehadiran siswa lain via URL `/attendance/student/history?studentId=alien-id`. | Endpoint mengabaikan parameter manipulasi ID dan hanya mengembalikan rekaman milik pengguna login terautentikasi JWT. | Backend mengunci query `where: { studentId: currentUser.studentId }`. | **LULUS** | DevSecOps • 21 Okt 2026 |
| **UAT-SIS-03** | Pencegahan Manipulasi Status Langsung | Siswa mencoba memanggil endpoint POST/PATCH absensi kelas `/attendance/sessions/:id/records`. | Backend menolak dengan HTTP 403 Forbidden karena peran `STUDENT` tidak memiliki permission `attendance.record`. | Penegakan `PermissionsGuard` menolak permintaan sebelum eksekusi controller. | **LULUS** | DevSecOps • 21 Okt 2026 |
| **UAT-SIS-04** | Pengajuan Permohonan Izin / Sakit Mandiri | Siswa membuka menu perizinan, mengunggah surat keterangan izin, mengisi rentang tanggal dan alasan. | Permohonan tersimpan di `permission_requests` dengan status `MENUNGGU` dan menunggu review wali kelas. | Form permohonan tervalidasi dan tersimpan di database. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-SIS-05** | Check-in Mandiri Siswa (Status Kebijakan Sekolah) | Siswa mencoba melakukan check-in mandiri ketika fitur dinonaktifkan di Developer Dashboard. | Sistem menolak check-in mandiri dan menampilkan pesan: 'Fitur absensi mandiri siswa belum diaktifkan oleh sekolah'. | Ditolak oleh backend dengan HTTP 403 Forbidden sesuai konfigurasi sekolah. | **LULUS** | DevSecOps • 21 Okt 2026 |

---

#### 📌 SKENARIO E: SINKRONISASI OFFLINE MOBILE (FLUTTER)

| Kode UAT | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status | Penguji & Tanggal |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-MOB-01** | Penyimpanan Draft Absensi Guru Mode Offline | Matikan koneksi internet pada aplikasi Flutter, guru mengabsen kelas dan menekan tombol Simpan Draft Lokal. | Data tersimpan di SQLite / SharedPreferences lokal, status sesi ditandai sebagai draft belum tersinkronisasi. | Terverifikasi pada `attendance_sync_workflow_test.dart` dan `offline_queue_storage_test.dart`. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-MOB-02** | Persistensi Antrean Pasca Restart Aplikasi | Tutup paksa aplikasi Flutter saat antrean sinkronisasi masih ada, lalu buka kembali. | Seluruh draft dan antrean sinkronisasi tetap utuh tanpa kehilangan data rekam kehadiran. | Antrean persisten berhasil dimuat ulang dari storage lokal. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-MOB-03** | Pengiriman Otomatis & Idempotensi Sinkronisasi | Pulihkan koneksi internet, picu fungsi sinkronisasi antrean. | Seluruh data draft terkirim ke backend, tidak ada duplikasi data, dan status sesi diperbarui menjadi tersinkronisasi. | Semua item antrean diproses dengan idempotency key UUID. | **LULUS** | QA Lead • 21 Okt 2026 |
| **UAT-MOB-04** | Pengujian Integrasi Fisik Kiosk RFID Gerbang | Tap kartu RFID fisik Mifare 13.56MHz pada kiosk pintu masuk SMA PB Ngrayun. | Kiosk membaca UID, memvalidasi status siswa, dan mencatat waktu presensi masuk gerbang. | **BELUM DIUJI (UAT LAPANGAN)**: Memerlukan perangkat keras fisik RFID Reader USB/Serial di gerbang sekolah. | **BELUM DIUJI** | Teknisi & Pihak Sekolah |

---

### 4. Kesimpulan Hasil UAT Staging

- **Total Skenario UAT**: 21 Skenario
- **Skenario Lulus Otomatis & Terverifikasi (PASS)**: 20 Skenario (95.2%)
- **Skenario Tertunda Pengujian Lapangan Fisik (PENDING)**: 1 Skenario (UAT-MOB-04 — Tap Kiosk Fisik RFID di Gerbang Sekolah)
- **Status Kesiapan Staging**: **SIAP UNTUK UJI TERIMA PENGGUNA LAPANGAN (UAT STAGING APPROVED)**
