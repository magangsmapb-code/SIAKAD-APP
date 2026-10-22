# SIAKAD SMA Pemberdayaan Bangsa — Student Data Privacy Policy (Tahap 18)

Dokumen ini menetapkan prinsip, batasan, dan prosedur perlindungan data pribadi siswa (Privacy by Design & Data Minimization) di lingkungan SMA Pemberdayaan Bangsa Ngrayun, selaras dengan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022) di Indonesia.

---

## 1. Prinsip Utama Perlindungan Data Siswa

1. **Prinsip Minimisasi Data (Data Minimization)**:
   - Sistem hanya mengumpulkan data siswa yang esensial untuk penyelenggaraan pendidikan akademik: Nama Lengkap, NIS, NISN, Kelas, Jenis Kelamin, Nomor Kontak Wali, dan Alamat Domisili.
   - Sistem **tidak mengumpulkan** data sensitif berlebih seperti data biometrik (sidik jari mentah, pemindaian retina, template pengenalan wajah) atau riwayat medis rinci tanpa kebutuhan legal yang jelas.

2. **Pembatasan Pemantauan Lokasi (Geolokasi Transaksional)**:
   - Koordinat GPS siswa **hanya diambil secara transaksional pada saat tombol check-in ditekan** untuk menghitung jarak Haversine ke titik koordinat gerbang/kelas sekolah.
   - Sistem **dilarang keras** melakukan background tracking atau melacak perpindahan lokasi siswa secara terus-menerus di luar jam dan proses absensi.
   - Koordinat mentah tidak ditampilkan di laporan publik dan hanya disimpan secara internal untuk verifikasi anomali.

3. **Batasan Teknologi Anti-Cheating & AI**:
   - Pengenalan wajah (Face Recognition) **tidak digunakan** sebagai alat verifikasi mutlak karena risiko bias, privasi, dan keterbatasan perangkat siswa di pedesaan.
   - Sinyal anomali (misal: jarak > radius) tidak menghasilkan hukuman otomatis, melainkan diteruskan sebagai penanda peninjauan manusia (*human-in-the-loop verification*).

4. **Pencegahan Kebocoran ke Pihak Ketiga**:
   - Data siswa disimpan secara mandiri pada database internal sekolah (on-premises / private cloud VPS).
   - Data siswa dilarang dikirim, dijual, atau disinkronkan ke platform analitik pihak ketiga publik tanpa persetujuan eksplisit orang tua/wali murid.

---

## 2. Pengendalian Hak Akses Berbasis Kebutuhan (Need-to-Know Basis)

- **Siswa**: Hanya dapat melihat biodata, absensi, dan nilai miliknya sendiri. Tidak dapat melihat nilai rekan sekelas.
- **Wali Kelas & Guru Pengampu**: Hanya dapat melihat data siswa di kelas yang berada di bawah kewenangan mengajarnya.
- **Tata Usaha**: Mengelola data induk siswa untuk keperluan registrasi Dapodik dan rapor.
- **Developer / Staf TI**: Dibatasi hanya pada pengelolaan skema dan infrastruktur. Dilarang melakukan ekspor atau membaca data siswa secara sepihak.

---

## 3. Pengendalian Ekspor dan Unduhan Dokumen Sensitif

1. **Otorisasi Ketat**: Ekspor massal data siswa (format CSV/Excel) hanya diizinkan bagi peran `SUPER_ADMIN` dan `ADMIN` (Tata Usaha).
2. **Pencatatan Jejak Audit**: Setiap unduhan atau ekspor data siswa memicu event audit `EXPORT_STUDENT_DATA` yang mencatat identitas aktor, waktu, IP address, jumlah baris data, dan kriteria filter.
3. **Pemberian Tanda Air (Watermarking)**: Dokumen rapor PDF memuat metadata dan penanda cetak untuk mencegah pemalsuan dokumen fisik.
