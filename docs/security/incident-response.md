# SIAKAD SMA Pemberdayaan Bangsa — Incident Response & Monitoring Plan (Tahap 18)

Dokumen ini mendefinisikan prosedur deteksi, eskalasi, investigasi, mitigasi, dan resolusi insiden keamanan siber dan integritas data di lingkungan SIAKAD SMA Pemberdayaan Bangsa Ngrayun.

---

## 1. Klasifikasi Tingkat Keparahan Insiden (Severity Levels)

| Level | Kategori | Contoh Kejadian | Batas Waktu Respon (SLA) |
| :--- | :--- | :--- | :--- |
| **P0 — Critical** | Kompromi Sistem / Integritas | Eskalasi peran ke `SUPER_ADMIN`, manipulasi nilai rapor langsung ke database, kebocoran kunci JWT / DB | < 1 Jam (Penanganan Langsung) |
| **P1 — High** | Serangan Aktif / Upaya Akses | Brute-force login masif, upaya aktivasi fitur belum selesai, anomali absensi massal berkoordinasi | < 4 Jam |
| **P2 — Medium** | Pelanggaran Kebijakan / Anomali | Geofence breach tunggal siswa, token expired reuse berulang, kegagalan request rate limit | < 24 Jam (Hari Kerja) |
| **P3 — Low** | Peringatan Operasional | Percobaan akses halaman menu tanpa izin oleh siswa penasaran, typo password pengguna umum | < 48 Jam |

---

## 2. Siklus Hidup Status Insiden (Incident Lifecycle)

Sistem mengadopsi 5 status insiden terstandarisasi:
1. `OPEN`: Anomali terdeteksi oleh sistem audit atau dilaporkan oleh guru/admin; menunggu penugasan penyelidik.
2. `INVESTIGATING`: Staf teknis / Tim Keamanan sedang memeriksa log audit, IP, koordinat, dan payload request.
3. `MITIGATED`: Ancaman langsung telah dinetralkan (misal: sesi pelaku dicabut, IP diblokir, akun dinonaktifkan).
4. `RESOLVED`: Akar masalah telah diperbaiki, data akademik telah direkonsiliasi, dan dokumen post-mortem selesai.
5. `FALSE_POSITIVE`: Anomali disebabkan oleh kendala teknis yang sah (misal: gangguan sinyal GPS di area perbukitan Ngrayun, guru berganti perangkat ponsel).

---

## 3. Alur Penanganan Insiden Keamanan (Incident Workflow)

```
[Deteksi Otomatis / Laporan]
           │
           ▼
     Status: OPEN
           │
           ▼
[Pemeriksaan Awal & Verifikasi Manusia]
   ├── Bila Kesalahan Teknis Sah ──► Status: FALSE_POSITIVE (Catat Alasan)
   └── Bila Pelanggaran Nyata
           │
           ▼
   Status: INVESTIGATING
           │
           ▼
[Tindakan Mitigasi Darurat]
   ├── Cabut Refresh Token (Revoke Session)
   ├── Nonaktifkan Akun Pelaku (`isActive = false`)
   └── Batalkan Transaksi / Perubahan Data Ilegal
           │
           ▼
   Status: MITIGATED
           │
           ▼
[Pemulihan & Rekonsiliasi]
   ├── Koreksi Nilai / Absensi dengan Persetujuan Kepala Sekolah
   ├── Patch Celah Keamanan & Update Unit Tests
   └── Penulisan Laporan Insiden
           │
           ▼
   Status: RESOLVED
```

---

## 4. Prinsip Keadilan & Anti-Hukuman Otomatis (No Automated Punishment)

1. **Human-in-the-Loop Verification**:
   - Sistem **dilarang memberikan sanksi akademik atau pembatalan nilai secara otomatis** hanya karena sebuah algoritma atau sinyal GPS mendeteksi anomali.
   - Semua anomali kehadiran masuk ke daftar peninjauan Guru BK dan Wali Kelas untuk diklarifikasi langsung dengan siswa.
2. **Konteks Geografis Ngrayun**:
   - Wilayah Ngrayun memiliki topografi berbukit dengan variasi akurasi GPS perangkat seluler antara 15 hingga 80 meter. Anomali jarak > 100m harus diverifikasi apakah akibat sinyal melompat (GPS jitter) sebelum dicurigai sebagai manipulasi fake GPS.
3. **Mekanisme Koreksi Resmi**:
   - Jika terbukti false positive, guru pengampu berwenang melakukan koreksi absensi melalui alur resmi yang tetap tercatat di audit log.
