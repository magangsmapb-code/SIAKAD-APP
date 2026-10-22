import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../core/theme/app_colors.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Pusat Bantuan'),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Contact Header
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Layanan Bantuan SIAKAD',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Butuh kendala teknis atau perbaikan data absensi? Tim Tata Usaha dan Admin SIAKAD siap membantu.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFFCCFBF1),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.phone_outlined,
                        size: 16,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '(0352) 123456 • TU SMA PB Ngrayun',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Pertanyaan Sering Diajukan (FAQ)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),

            _FaqItem(
              question: 'Bagaimana cara mengisi absensi jika sinyal terputus?',
              answer:
                  'Aplikasi SIAKAD Mobile dilengkapi penyimpanan lokal otomatis. Anda tetap dapat menandai siswa dan menekan tombol "Draft Lokal". Data akan masuk ke Antrean Sinkronisasi dan dapat dikirim ketika sinyal kembali.',
            ),
            _FaqItem(
              question: 'Apa perbedaan tombol Simpan Draft dan Kirim Absensi?',
              answer:
                  '"Simpan Draft" mencatat data sementara di perangkat Anda tanpa memvalidasi kelengkapan semua siswa. Sedangkan "Kirim Absensi" menandai sesi selesai dan siap disinkronkan ke server sekolah.',
            ),
            _FaqItem(
              question: 'Bagaimana cara siswa mengajukan surat izin sakit?',
              answer:
                  'Masuk ke peran Siswa, buka menu "Izin", lalu tekan tombol "Ajukan Izin/Sakit". Pilih jenis ketidakhadiran, tanggal, tulis alasan, dan lampirkan foto/file surat dokter jika tersedia.',
            ),
            _FaqItem(
              question: 'Bagaimana penghitungan persentase kehadiran siswa?',
              answer:
                  'Persentase dihitung dengan rumus: (Jumlah Hadir + Terlambat) dibagi Total Pertemuan dikalikan 100%. Batas minimal kehadiran yang disyaratkan sekolah adalah 90%.',
            ),
            _FaqItem(
              question: 'Bagaimana cara mengganti akun demo?',
              answer:
                  'Buka halaman Profil atau tombol "Ganti Peran" di beranda untuk beralih antara akun Guru (Siti Rahmawati, S.Pd.) dan akun Siswa (Aditya Pratama Putra).',
            ),
            const SizedBox(height: 24),

            // Institution Details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppConstants.institutionName,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    AppConstants.institutionAddress,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'NPSN: ${AppConstants.npsn}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  final String question;
  final String answer;

  const _FaqItem({required this.question, required this.answer});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        title: Text(
          question,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              answer,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
