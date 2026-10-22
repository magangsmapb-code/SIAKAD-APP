import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/confirm_dialog.dart';
import '../../state/app_state.dart';
import '../auth/role_selection_screen.dart';
import 'notifications_screen.dart';
import 'settings_screen.dart';
import 'help_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _handleLogout(BuildContext context, AppState appState) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Keluar dari SIAKAD?',
      message:
          'Apakah Anda yakin ingin keluar dari akun ${appState.currentUser?.name}? Anda dapat masuk kembali kapan saja.',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      confirmColor: AppColors.alpa,
      icon: Icons.logout_rounded,
    );

    if (confirmed == true && context.mounted) {
      await appState.logout();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final user = appState.currentUser;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Profil Pengguna'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            children: [
              // User Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: user?.isGuru ?? true
                          ? AppColors.primary
                          : AppColors.secondary,
                      child: Icon(
                        user?.isGuru ?? true
                            ? Icons.assignment_ind_rounded
                            : Icons.person_rounded,
                        size: 38,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user?.name ?? 'Nama Pengguna',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: user?.isGuru ?? true
                            ? AppColors.primary.withValues(alpha: 0.1)
                            : AppColors.secondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        user?.role.label ?? 'Pengguna',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: user?.isGuru ?? true
                              ? AppColors.primary
                              : AppColors.secondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      user?.isGuru ?? true
                          ? 'NIP: ${user?.identifier}'
                          : 'NIS: ${user?.identifier} • ${user?.className}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (user?.email != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        user!.email!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Academic Context Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.school_outlined,
                      color: AppColors.primary,
                      size: 20,
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppConstants.institutionName,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Tahun Ajaran ${AppConstants.academicYear} • Semester ${AppConstants.currentSemester}',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Navigation Menu Items
              _ProfileMenuItem(
                icon: Icons.notifications_outlined,
                title: 'Notifikasi',
                subtitle: 'Pemberitahuan absensi dan jadwal',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const NotificationsScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),
              _ProfileMenuItem(
                icon: Icons.settings_outlined,
                title: 'Pengaturan Aplikasi',
                subtitle: 'Tema tampilan dan simulasi jaringan',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SettingsScreen()),
                  );
                },
              ),
              const SizedBox(height: 10),
              _ProfileMenuItem(
                icon: Icons.help_outline_rounded,
                title: 'Pusat Bantuan',
                subtitle: 'Panduan penggunaan & kontak sekolah',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const HelpScreen()),
                  );
                },
              ),
              if (appState.isDemoMode) ...[
                const SizedBox(height: 10),
                _ProfileMenuItem(
                  icon: Icons.swap_horiz_rounded,
                  title: 'Ganti Peran Demo',
                  subtitle: 'Pilih tampilan Guru atau Siswa',
                  iconColor: AppColors.primaryLight,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const RoleSelectionScreen(),
                      ),
                    );
                  },
                ),
              ],
              const SizedBox(height: 24),

              // Logout Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () => _handleLogout(context, appState),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Keluar dari Akun'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.alpa,
                    side: const BorderSide(color: AppColors.alpa),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                AppConstants.appVersion,
                style: TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color iconColor;
  final VoidCallback onTap;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor = AppColors.primary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
