import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/sync_badge.dart';
import '../../state/app_state.dart';
import 'attendance_form_screen.dart';

class SyncQueueScreen extends StatefulWidget {
  const SyncQueueScreen({super.key});

  @override
  State<SyncQueueScreen> createState() => _SyncQueueScreenState();
}

class _SyncQueueScreenState extends State<SyncQueueScreen> {
  bool _isSyncing = false;

  void _syncNow(AppState appState) async {
    if (!appState.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Perangkat dalam mode offline. Aktifkan jaringan untuk menyinkronkan data.',
          ),
          backgroundColor: AppColors.syncPending,
        ),
      );
      return;
    }

    setState(() => _isSyncing = true);
    final count = await appState.syncPendingSessions();
    if (!mounted) return;
    setState(() => _isSyncing = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '$count sesi absensi berhasil disinkronkan ke server sekolah.',
        ),
        backgroundColor: AppColors.secondary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final pendingSessions = appState.pendingSyncSessions;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Antrean Sinkronisasi'),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Simulasikan status jaringan',
            icon: Icon(
              appState.isOnline
                  ? Icons.wifi_rounded
                  : Icons.wifi_off_rounded,
              color: appState.isOnline ? Colors.white : const Color(0xFFFDE68A),
            ),
            onPressed: () {
              appState.toggleOnlineStatus();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    appState.isOnline
                        ? 'Simulasi Jaringan: Online (Terhubung).'
                        : 'Simulasi Jaringan: Offline (Koneksi terputus).',
                  ),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status bar banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: appState.isOnline
                  ? const Color(0xFFEFF6FF)
                  : const Color(0xFFFFFBEB),
              child: Row(
                children: [
                  Icon(
                    appState.isOnline
                        ? Icons.cloud_queue_rounded
                        : Icons.cloud_off_rounded,
                    color: appState.isOnline
                        ? AppColors.primary
                        : const Color(0xFFD97706),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appState.isOnline
                              ? 'Status Jaringan: Terhubung (Online)'
                              : 'Status Jaringan: Offline (Koneksi Terputus)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: appState.isOnline
                                ? AppColors.primary
                                : const Color(0xFFB45309),
                          ),
                        ),
                        Text(
                          '${pendingSessions.length} sesi absensi menunggu sinkronisasi.',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => appState.toggleOnlineStatus(),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      appState.isOnline ? 'Set Offline' : 'Set Online',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

            // Pending sessions list or empty state
            Expanded(
              child: pendingSessions.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.cloud_done_rounded,
                      title: 'Semua Data Tersinkron',
                      description:
                          'Tidak ada data absensi yang tertunda. Seluruh draft lokal telah disinkronkan ke server sekolah.',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: pendingSessions.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (ctx, idx) {
                        final session = pendingSessions[idx];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    session.className,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      session.subjectName,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  SyncBadge(
                                    isSynced: session.isSynced,
                                    isLocalDraft: session.isLocalDraft,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '${session.room} • ${session.timeRange}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Pembaruan lokal: ${DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(session.updatedAt)}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${session.hadirCount} Hadir, ${session.sakitCount} Sakit, ${session.izinCount} Izin, ${session.alpaCount} Alpa',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => AttendanceFormScreen(
                                            sessionId: session.id,
                                          ),
                                        ),
                                      );
                                    },
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text('Edit Absensi'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: pendingSessions.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isSyncing ? null : () => _syncNow(appState),
                  icon: _isSyncing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.sync_rounded),
                  label: Text(
                    _isSyncing
                        ? 'Menyinkronkan data...'
                        : 'Sinkronkan Sekarang (${pendingSessions.length})',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
