import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/widgets/sync_badge.dart';
import '../../data/models/attendance_model.dart';
import '../../data/models/user_model.dart';
import '../../state/app_state.dart';
import '../attendance/attendance_form_screen.dart';
import '../attendance/sync_queue_screen.dart';
import '../history/attendance_history_screen.dart';
import '../profile/notifications_screen.dart';

class TeacherDashboardScreen extends StatelessWidget {
  final Function(int)? onNavigateTab;

  const TeacherDashboardScreen({super.key, this.onNavigateTab});

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final user = appState.currentUser;
    final now = DateTime.now();
    final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'id_ID');
    final formattedDate = dateFormat.format(now);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => appState.init(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Teacher Name, Date, Notification Icon
                _buildHeader(context, user, formattedDate, appState),
                const SizedBox(height: 18),

                // Sync Status Card / Offline Banner
                _buildSyncStatusCard(context, appState),
                const SizedBox(height: 20),

                // Today Attendance Summary Counters (Hadir, Sakit, Izin, Alpa)
                _buildTodaySummarySection(appState),
                const SizedBox(height: 24),

                // Classes to Attend Today (Daftar kelas yang perlu diabsen)
                _buildClassesToAttendSection(context, appState),
                const SizedBox(height: 24),

                // Today's Teaching Schedule (Jadwal Mengajar)
                _buildScheduleSection(context, appState),
                const SizedBox(height: 24),

                // Quick Action Shortcuts (Akses Cepat)
                _buildQuickActions(context, appState),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    User? user,
    String formattedDate,
    AppState appState,
  ) {
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: AppColors.primary,
          child: const Icon(
            Icons.person_outline_rounded,
            color: Colors.white,
            size: 26,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user?.name ?? 'Siti Rahmawati, S.Pd.',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                formattedDate,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        // Demo Role Switcher Chip
        ActionChip(
          label: const Text('Ganti Peran'),
          avatar: const Icon(Icons.swap_horiz_rounded, size: 16),
          onPressed: () => _showRoleSwitchSheet(context, appState),
          visualDensity: VisualDensity.compact,
          backgroundColor: Colors.white,
          side: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        const SizedBox(width: 6),
        IconButton(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            );
          },
          icon: const Icon(Icons.notifications_outlined),
          color: AppColors.textPrimary,
        ),
      ],
    );
  }

  Widget _buildSyncStatusCard(BuildContext context, AppState appState) {
    final pendingCount = appState.pendingSyncCount;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: pendingCount > 0 ? AppColors.syncPendingBg : AppColors.syncSuccessBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: pendingCount > 0
              ? AppColors.syncPending.withValues(alpha: 0.3)
              : AppColors.syncSuccess.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            pendingCount > 0
                ? Icons.cloud_upload_outlined
                : Icons.cloud_done_rounded,
            color: pendingCount > 0
                ? AppColors.syncPending
                : AppColors.syncSuccess,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pendingCount > 0
                      ? '$pendingCount Sesi Menunggu Sinkronisasi'
                      : 'Semua Data Absensi Tersinkron',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: pendingCount > 0
                        ? AppColors.syncPending
                        : AppColors.syncSuccess,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  pendingCount > 0
                      ? 'Tersimpan aman di penyimpanan lokal perangkat.'
                      : 'Terhubung dengan sistem absensi sekolah.',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (pendingCount > 0)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SyncQueueScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.syncPending,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Lihat Antrean',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTodaySummarySection(AppState appState) {
    // Calculate aggregate across all teacher's sessions today
    int totalHadir = 0;
    int totalTerlambat = 0;
    int totalSakit = 0;
    int totalIzin = 0;
    int totalAlpa = 0;

    for (final s in appState.sessions) {
      totalHadir += s.hadirCount;
      totalTerlambat += s.terlambatCount;
      totalSakit += s.sakitCount;
      totalIzin += s.izinCount;
      totalAlpa += s.alpaCount;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Ringkasan Absensi Hari Ini',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              '${appState.todayClassesDone}/${appState.todayClassesTotal} Kelas Diabsen',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _SummaryBox(
                label: 'Hadir',
                count: totalHadir,
                color: AppColors.hadir,
                bgColor: AppColors.hadirBg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryBox(
                label: 'Terlambat',
                count: totalTerlambat,
                color: AppColors.terlambat,
                bgColor: AppColors.terlambatBg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryBox(
                label: 'Sakit',
                count: totalSakit,
                color: AppColors.sakit,
                bgColor: AppColors.sakitBg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryBox(
                label: 'Izin',
                count: totalIzin,
                color: AppColors.izin,
                bgColor: AppColors.izinBg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryBox(
                label: 'Alpa',
                count: totalAlpa,
                color: AppColors.alpa,
                bgColor: AppColors.alpaBg,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildClassesToAttendSection(BuildContext context, AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Daftar Kelas Perlu Diabsen',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab?.call(1),
              child: const Text(
                'Lihat Semua',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (appState.sessions.isEmpty)
          const Center(child: Text('Tidak ada sesi mengajar hari ini'))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: appState.sessions.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (ctx, idx) {
              final session = appState.sessions[idx];
              return _SessionCard(
                session: session,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => AttendanceFormScreen(sessionId: session.id),
                    ),
                  );
                },
              );
            },
          ),
      ],
    );
  }

  Widget _buildScheduleSection(BuildContext context, AppState appState) {
    final todaySchedules =
        appState.teacherSchedules.where((s) => s.isToday).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Jadwal Mengajar Hari Ini',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab?.call(2),
              child: const Text(
                'Jadwal Lengkap',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (todaySchedules.isEmpty)
          const Text('Tidak ada jadwal hari ini.')
        else
          ...todaySchedules.map(
            (sch) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      sch.startTime,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sch.subjectName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${sch.className} • ${sch.room} (${sch.totalStudents} siswa)',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (sch.isAttendanceCompleted)
                    const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.hadir,
                      size: 20,
                    )
                  else
                    const Icon(
                      Icons.pending_actions_rounded,
                      color: Color(0xFFD97706),
                      size: 20,
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Akses Cepat',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionButton(
                label: 'Riwayat Absensi',
                icon: Icons.history_edu_rounded,
                color: AppColors.primary,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const AttendanceHistoryScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionButton(
                label: 'Antrean Sinkron',
                icon: Icons.sync_rounded,
                color: AppColors.secondary,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SyncQueueScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showRoleSwitchSheet(BuildContext context, AppState appState) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ganti Peran Pengguna (Mode Demo)',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            const Text(
              'Pilih profil untuk mendemonstrasikan pengalaman guru atau siswa:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 18),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: AppColors.primary,
                child: Icon(Icons.school, color: Colors.white, size: 20),
              ),
              title: const Text(
                'Siti Rahmawati, S.Pd. (Guru)',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text('Input absensi kelas & antrean sinkronisasi'),
              trailing: appState.currentRole == UserRole.guru
                  ? const Icon(Icons.check, color: AppColors.primary)
                  : null,
              onTap: () {
                Navigator.of(ctx).pop();
                appState.switchRole(UserRole.guru);
              },
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: AppColors.secondary,
                child: Icon(Icons.person, color: Colors.white, size: 20),
              ),
              title: const Text(
                'Aditya Pratama Putra (Siswa)',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text('Ringkasan absensi pribadi & form izin'),
              trailing: appState.currentRole == UserRole.siswa
                  ? const Icon(Icons.check, color: AppColors.secondary)
                  : null,
              onTap: () {
                Navigator.of(ctx).pop();
                appState.switchRole(UserRole.siswa);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryBox extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _SummaryBox({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final AttendanceSession session;
  final VoidCallback onTap;

  const _SessionCard({required this.session, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: 0.5,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      session.className,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  SessionStatusBadge(status: session.status),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(
                    Icons.access_time_rounded,
                    size: 14,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    session.timeRange,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Icon(
                    Icons.room_outlined,
                    size: 14,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    session.room,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  SyncBadge(
                    isSynced: session.isSynced,
                    isLocalDraft: session.isLocalDraft,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Attendance Counter mini summary
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Terisi: ${session.totalStudents - session.belumDiisiCount}/${session.totalStudents} Siswa',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Row(
                      children: [
                        const Text(
                          'Buka Absensi',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 12,
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.label,
    required this.icon,
    required this.color,
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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
