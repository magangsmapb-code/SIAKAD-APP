import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/widgets/sync_badge.dart';
import '../../data/models/attendance_model.dart';
import '../../state/app_state.dart';
import 'attendance_form_screen.dart';

class SessionListScreen extends StatefulWidget {
  const SessionListScreen({super.key});

  @override
  State<SessionListScreen> createState() => _SessionListScreenState();
}

class _SessionListScreenState extends State<SessionListScreen> {
  String _selectedFilter = 'Semua';

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final sessions = appState.sessions;

    final filteredSessions = sessions.where((s) {
      if (_selectedFilter == 'Semua') return true;
      if (_selectedFilter == 'Perlu Diabsen') {
        return s.status != SessionStatus.sudahDisimpan;
      }
      if (_selectedFilter == 'Sudah Disimpan') {
        return s.status == SessionStatus.sudahDisimpan;
      }
      if (_selectedFilter == 'Draft Lokal') {
        return s.isLocalDraft;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Absensi Kelas'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => appState.init(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter chip row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: Colors.white,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'Semua (${sessions.length})',
                      isSelected: _selectedFilter == 'Semua',
                      onTap: () => setState(() => _selectedFilter = 'Semua'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Perlu Diabsen (${appState.todayClassesPending})',
                      isSelected: _selectedFilter == 'Perlu Diabsen',
                      onTap: () =>
                          setState(() => _selectedFilter = 'Perlu Diabsen'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Sudah Disimpan (${appState.todayClassesDone})',
                      isSelected: _selectedFilter == 'Sudah Disimpan',
                      onTap: () =>
                          setState(() => _selectedFilter = 'Sudah Disimpan'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Draft Lokal (${appState.pendingSyncCount})',
                      isSelected: _selectedFilter == 'Draft Lokal',
                      onTap: () =>
                          setState(() => _selectedFilter = 'Draft Lokal'),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Session List
            Expanded(
              child: filteredSessions.isEmpty
                  ? const Center(
                      child: Text(
                        'Tidak ada sesi absensi pada filter ini.',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredSessions.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (ctx, idx) {
                        final session = filteredSessions[idx];
                        return _SessionListItemCard(
                          session: session,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => AttendanceFormScreen(
                                  sessionId: session.id,
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _SessionListItemCard extends StatelessWidget {
  final AttendanceSession session;
  final VoidCallback onTap;

  const _SessionListItemCard({required this.session, required this.onTap});

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
          padding: const EdgeInsets.all(16),
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
                        fontSize: 15,
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
              const SizedBox(height: 8),
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
              const SizedBox(height: 12),
              // Mini Attendance Status Bar
              Row(
                children: [
                  _StatusCounterPill(
                    label: 'H',
                    count: session.hadirCount,
                    color: AppColors.hadir,
                    bgColor: AppColors.hadirBg,
                  ),
                  const SizedBox(width: 6),
                  _StatusCounterPill(
                    label: 'T',
                    count: session.terlambatCount,
                    color: AppColors.terlambat,
                    bgColor: AppColors.terlambatBg,
                  ),
                  const SizedBox(width: 6),
                  _StatusCounterPill(
                    label: 'S',
                    count: session.sakitCount,
                    color: AppColors.sakit,
                    bgColor: AppColors.sakitBg,
                  ),
                  const SizedBox(width: 6),
                  _StatusCounterPill(
                    label: 'I',
                    count: session.izinCount,
                    color: AppColors.izin,
                    bgColor: AppColors.izinBg,
                  ),
                  const SizedBox(width: 6),
                  _StatusCounterPill(
                    label: 'A',
                    count: session.alpaCount,
                    color: AppColors.alpa,
                    bgColor: AppColors.alpaBg,
                  ),
                  const Spacer(),
                  Text(
                    '${session.attendanceRate.toStringAsFixed(0)}% Hadir',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: AppColors.textMuted,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusCounterPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _StatusCounterPill({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        '$label: $count',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}
