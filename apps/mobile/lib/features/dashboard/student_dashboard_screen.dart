import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/user_model.dart';
import '../../state/app_state.dart';
import '../permissions/permission_form_screen.dart';
import '../permissions/permission_list_screen.dart';
import '../history/attendance_history_screen.dart';
import '../profile/notifications_screen.dart';

class StudentDashboardScreen extends StatelessWidget {
  final Function(int)? onNavigateTab;

  const StudentDashboardScreen({super.key, this.onNavigateTab});

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
                // Header: Student Name, Class, Avatar
                _buildHeader(context, user, formattedDate, appState),
                const SizedBox(height: 18),

                // Attendance Rate Banner (Ringkasan Kehadiran)
                _buildAttendanceRateCard(appState),
                const SizedBox(height: 20),

                // Detailed Attendance Counters (Hadir, Sakit, Izin, Alpa)
                _buildAttendanceCounters(appState),
                const SizedBox(height: 24),

                // Quick Action: Form Pengajuan Izin
                _buildPermissionCTA(context),
                const SizedBox(height: 24),

                // Today's Learning Schedule (Jadwal Pelajaran Hari Ini)
                _buildTodaySchedule(context, appState),
                const SizedBox(height: 24),

                // Permission Requests Status (Status Pengajuan Izin)
                _buildPermissionsStatusSection(context, appState),
                const SizedBox(height: 24),

                // Recent Attendance History (Riwayat Absensi Terkini)
                _buildRecentHistorySection(context, appState),
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
          backgroundColor: AppColors.secondary,
          child: const Icon(
            Icons.school_rounded,
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
                user?.name ?? 'Aditya Pratama Putra',
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
                '${user?.className ?? "X MIPA 1"} • NIS ${user?.identifier ?? "2401"}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
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

  Widget _buildAttendanceRateCard(AppState appState) {
    final rate = appState.studentAttendanceRate;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tingkat Kehadiran Semester Ini',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Target: >90%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${rate.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '${appState.studentHadirCount + appState.studentTerlambatCount} dari ${appState.studentTotalSessions} Pertemuan',
                  style: const TextStyle(
                    color: Color(0xFFCCFBF1),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: rate / 100,
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF34D399), // Emerald 400
              ),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceCounters(AppState appState) {
    return Row(
      children: [
        Expanded(
          child: _StudentStatCard(
            label: 'Hadir',
            value: appState.studentHadirCount,
            color: AppColors.hadir,
            bgColor: AppColors.hadirBg,
            icon: Icons.check_circle_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StudentStatCard(
            label: 'Terlambat',
            value: appState.studentTerlambatCount,
            color: AppColors.terlambat,
            bgColor: AppColors.terlambatBg,
            icon: Icons.access_time_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StudentStatCard(
            label: 'Sakit',
            value: appState.studentSakitCount,
            color: AppColors.sakit,
            bgColor: AppColors.sakitBg,
            icon: Icons.medication_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StudentStatCard(
            label: 'Izin',
            value: appState.studentIzinCount,
            color: AppColors.izin,
            bgColor: AppColors.izinBg,
            icon: Icons.assignment_turned_in_rounded,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StudentStatCard(
            label: 'Alpa',
            value: appState.studentAlpaCount,
            color: AppColors.alpa,
            bgColor: AppColors.alpaBg,
            icon: Icons.cancel_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildPermissionCTA(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.secondary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.note_add_rounded,
              color: AppColors.secondary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Berhalangan Hadir?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Ajukan surat izin atau sakit online ke wali kelas',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const PermissionFormScreen(),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Ajukan',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodaySchedule(BuildContext context, AppState appState) {
    final todaySchedules =
        appState.studentSchedules.where((s) => s.isToday).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Jadwal Pelajaran Hari Ini',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab?.call(1),
              child: const Text(
                'Lihat Sepekan',
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
          const Text('Tidak ada jadwal pelajaran hari ini.')
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
                          '${sch.teacherName} • ${sch.room}',
                          style: const TextStyle(
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
          ),
      ],
    );
  }

  Widget _buildPermissionsStatusSection(
    BuildContext context,
    AppState appState,
  ) {
    final permissions = appState.studentPermissions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Status Pengajuan Izin',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const PermissionListScreen(),
                  ),
                );
              },
              child: const Text(
                'Semua Pengajuan',
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
        if (permissions.isEmpty)
          const Text('Belum ada riwayat pengajuan izin.')
        else
          ...permissions.map(
            (perm) => Container(
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
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: perm.status.backgroundColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.description_rounded,
                      color: perm.status.color,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              perm.type.label,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: perm.status.backgroundColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                perm.status.label,
                                style: TextStyle(
                                  color: perm.status.color,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          perm.reason,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
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
          ),
      ],
    );
  }

  Widget _buildRecentHistorySection(BuildContext context, AppState appState) {
    final recent = appState.studentHistory.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Riwayat Absensi Terkini',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const AttendanceHistoryScreen(),
                  ),
                );
              },
              child: const Text(
                'Lihat Detail',
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
        ...recent.map(
          (rec) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rec.subjectName,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        DateFormat('d MMMM yyyy', 'id_ID').format(rec.date),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (rec.notes != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Catatan: ${rec.notes!}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                AttendanceStatusBadge(status: rec.status),
              ],
            ),
          ),
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
              trailing: const Icon(Icons.check, color: AppColors.secondary),
              onTap: () {
                Navigator.of(ctx).pop();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentStatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final Color bgColor;
  final IconData icon;

  const _StudentStatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.bgColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          Text(
            '$value',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
