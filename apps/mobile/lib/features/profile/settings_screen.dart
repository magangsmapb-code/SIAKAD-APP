import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../core/theme/app_colors.dart';
import '../../state/app_state.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.state;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Pengaturan'),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Theme Section
            _buildSectionHeader('Tampilan & Tema'),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _ThemeSelectionTile(
                    title: 'Ikuti Sistem Operasi',
                    subtitle: 'Menyesuaikan tema otomatis perangkat',
                    isSelected: appState.themeMode == ThemeMode.system,
                    onTap: () => appState.setThemeMode(ThemeMode.system),
                  ),
                  const Divider(height: 1),
                  _ThemeSelectionTile(
                    title: 'Tema Terang',
                    subtitle: 'Tampilan bersih latar belakang putih',
                    isSelected: appState.themeMode == ThemeMode.light,
                    onTap: () => appState.setThemeMode(ThemeMode.light),
                  ),
                  const Divider(height: 1),
                  _ThemeSelectionTile(
                    title: 'Tema Gelap',
                    subtitle: 'Mengurangi silau di lingkungan redup',
                    isSelected: appState.themeMode == ThemeMode.dark,
                    onTap: () => appState.setThemeMode(ThemeMode.dark),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Network Simulation & Offline Handling Section
            _buildSectionHeader('Jaringan & Mode Offline'),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    value: appState.isOnline,
                    activeThumbColor: AppColors.secondary,
                    title: const Text('Status Koneksi Online'),
                    subtitle: Text(
                      appState.isOnline
                          ? 'Terhubung dengan jaringan (data dapat disinkronkan).'
                          : 'Mode offline aktif (perubahan tersimpan ke draft lokal).',
                    ),
                    onChanged: (_) => appState.toggleOnlineStatus(),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.storage_rounded,
                      color: AppColors.primary,
                    ),
                    title: const Text('Penyimpanan Lokal Demo'),
                    subtitle: Text(
                      '${appState.pendingSyncCount} sesi absensi dalam antrean lokal',
                    ),
                    trailing: appState.pendingSyncCount > 0
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.syncPendingBg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${appState.pendingSyncCount} Draft',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.syncPending,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        : const Text(
                            'Bersih',
                            style: TextStyle(
                              color: AppColors.hadir,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // About App Section
            _buildSectionHeader('Tentang Aplikasi'),
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
                    AppConstants.appName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    AppConstants.appFullName,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '${AppConstants.institutionName} • Ponorogo',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    AppConstants.appVersion,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.primaryLight,
                      fontWeight: FontWeight.w600,
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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _ThemeSelectionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeSelectionTile({
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: isSelected
          ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
          : const Icon(Icons.radio_button_unchecked_rounded, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
