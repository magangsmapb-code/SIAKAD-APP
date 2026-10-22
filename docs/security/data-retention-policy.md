# SIAKAD SMA Pemberdayaan Bangsa — Data Retention & Archival Policy (Tahap 18)

Dokumen ini mendefinisikan jadwal retensi, masa simpan, mekanisme pengarsipan, dan prosedur pemusnahan data akademik di SMA Pemberdayaan Bangsa Ngrayun.

---

## 1. Prinsip Utama Retensi Bukti Akademik

1. **Integritas Bukti Akademik (No Accidental Data Loss)**:
   - Data nilai rapor, transkrip, dan ijazah adalah dokumen legal seumur hidup siswa. Sistem **dilarang menerapkan penghapusan otomatis (auto-purge)** terhadap data nilai dan profil kelulusan.
2. **Pemisahan Data Aktif vs Data Arsip (Hot vs Cold Storage)**:
   - Data operasional harian yang sudah lewat tahun ajaran dipindahkan ke skema/tabel arsip agar query harian tetap ringan tanpa menghilangkan data historis.
3. **Pemusnahan Terkendali**:
   - Pemusnahan data sementara (seperti cache sesi, token refresh kedaluwarsa) dapat dilakukan otomatis. Pemusnahan data audit atau presensi memerlukan berita acara resmi sekolah.

---

## 2. Jadwal Retensi Berdasarkan Kategori Data

| Kategori Data | Contoh Entitas | Periode Simpan Aktif | Status Pasca-Periode | Prosedur Pembersihan |
| :--- | :--- | :--- | :--- | :--- |
| **Profil Siswa & Nilai Rapor** | `Student`, `GradeRecord`, `ReportCard` | Selama siswa bersekolah + 30 Tahun | Diarsipkan permanen | **TIDAK DIHAPUS** (Arsip Abadi Sekolah) |
| **Absensi Harian & Presensi** | `AttendanceRecord`, `AttendanceSession` | 3 Tahun Akademik | Diarsipkan ke Cold Storage | Pembersihan manual dengan persetujuan Kepala Sekolah |
| **Log Audit Keamanan** | `audit_logs` | 2 Tahun | Backup terkompresi terenkripsi | Append-only archival |
| **Draft Offline Mobile** | SharedPreferences / SQLite Mobile | 30 Hari pasca sinkronisasi | Dihapus otomatis dari perangkat | Sinkronisasi tuntas mengosongkan antrean |
| **Token Sesi & Refresh Token** | `users.refreshToken` | 7 Hari (masa berlaku) | Di-overwrite / `null` saat logout | Otomatis dirotasi saat refresh / logout |
| **Lampiran Surat Sakit / Izin** | Dokumen bukti izin | 1 Tahun Akademik | Diarsipkan bersama berkas TU | Verifikasi fisik & arsip digital tahunan |

---

## 3. Catatan Keputusan Sekolah yang Dibutuhkan (Pending Governance Decisions)

Sebelum menerapkan skrip pembersihan otomatis (automated cron purge) untuk data kehadiran dan lampiran izin:
- [ ] Rapat Dewan Guru dan Kepala Sekolah mengenai batas waktu legal penerbitan ulang surat keterangan kehadiran.
- [ ] Standar Operasional Prosedur (SOP) pengarsipan fisik berkas surat dokter/surat izin orang tua oleh Tata Usaha.
- [ ] Alokasi kuota penyimpanan offline/server lokal untuk arsip backup tahunan sebelum pemindahan data ke cold storage.
