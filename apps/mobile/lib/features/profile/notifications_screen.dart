import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../state/app_state.dart';

class NotificationItem {
  final String title;
  final String message;
  final String time;
  final IconData icon;
  final Color iconColor;
  final bool isRead;

  const NotificationItem({
    required this.title,
    required this.message,
    required this.time,
    required this.icon,
    required this.iconColor,
    this.isRead = false,
  });
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final isGuru = appState.currentUser?.isGuru ?? true;

    final teacherNotifications = const [
      NotificationItem(
        title: 'Draft Absensi Tersimpan',
        message:
            'Draft absensi untuk kelas X MIPA 2 telah disimpan di penyimpanan lokal.',
        time: '15 menit yang lalu',
        icon: Icons.save_as_rounded,
        iconColor: AppColors.primary,
        isRead: false,
      ),
      NotificationItem(
        title: 'Sesi Absensi Tersinkron',
        message:
            'Sesi X MIPA 1 (Matematika Wajib) telah berhasil disinkronkan ke server.',
        time: '1 jam yang lalu',
        icon: Icons.cloud_done_rounded,
        iconColor: AppColors.secondary,
        isRead: true,
      ),
      NotificationItem(
        title: 'Pengajuan Izin Siswa Baru',
        message:
            'Aditya Pratama Putra (X MIPA 1) mengajukan permohonan dispensasi kegiatan OSN.',
        time: '6 jam yang lalu',
        icon: Icons.assignment_outlined,
        iconColor: Color(0xFFD97706),
        isRead: true,
      ),
      NotificationItem(
        title: 'Pengingat Jadwal Mengajar',
        message:
            'Jadwal berikutnya: Matematika Peminatan di kelas XI MIPA 1 pukul 11:00 WIB.',
        time: 'Kemarin',
        icon: Icons.notifications_active_outlined,
        iconColor: AppColors.primaryLight,
        isRead: true,
      ),
    ];

    final studentNotifications = const [
      NotificationItem(
        title: 'Pengajuan Dispensasi Diajukan',
        message:
            'Permohonan dispensasi OSN Anda telah dikirim dan menunggu verifikasi wali kelas.',
        time: '6 jam yang lalu',
        icon: Icons.schedule_rounded,
        iconColor: Color(0xFFD97706),
        isRead: false,
      ),
      NotificationItem(
        title: 'Surat Izin Sakit Disetujui',
        message:
            'Surat izin sakit tanggal 12-13 Oktober telah disetujui oleh Siti Rahmawati, S.Pd.',
        time: '2 hari yang lalu',
        icon: Icons.check_circle_outline_rounded,
        iconColor: AppColors.secondary,
        isRead: true,
      ),
      NotificationItem(
        title: 'Absensi Hari Ini Dicatat',
        message:
            'Kehadiran Anda pada Matematika Wajib telah dicatat: Hadir Tepat Waktu.',
        time: '07:35 WIB',
        icon: Icons.done_rounded,
        iconColor: AppColors.hadir,
        isRead: true,
      ),
    ];

    final items = isGuru ? teacherNotifications : studentNotifications;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Notifikasi'),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (ctx, idx) {
            final item = items[idx];
            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: item.isRead ? Colors.white : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: item.isRead
                      ? const Color(0xFFE2E8F0)
                      : AppColors.secondary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: item.iconColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(item.icon, color: item.iconColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.title,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: item.isRead
                                      ? FontWeight.w600
                                      : FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            if (!item.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.secondary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.message,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          item.time,
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
