import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/attendance_model.dart';
import '../../state/app_state.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() =>
      _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  AttendanceStatus? _filterStatus;

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final records = appState.studentHistory;

    final filteredRecords = records.where((r) {
      if (_filterStatus == null) return true;
      return r.status == _filterStatus;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Riwayat Kehadiran'),
        elevation: 0,
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
                      label: 'Semua',
                      isSelected: _filterStatus == null,
                      onTap: () => setState(() => _filterStatus = null),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Hadir',
                      isSelected: _filterStatus == AttendanceStatus.hadir,
                      onTap: () => setState(
                        () => _filterStatus = AttendanceStatus.hadir,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Terlambat',
                      isSelected: _filterStatus == AttendanceStatus.terlambat,
                      onTap: () => setState(
                        () => _filterStatus = AttendanceStatus.terlambat,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Sakit',
                      isSelected: _filterStatus == AttendanceStatus.sakit,
                      onTap: () => setState(
                        () => _filterStatus = AttendanceStatus.sakit,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Izin',
                      isSelected: _filterStatus == AttendanceStatus.izin,
                      onTap: () => setState(
                        () => _filterStatus = AttendanceStatus.izin,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Alpa',
                      isSelected: _filterStatus == AttendanceStatus.alpa,
                      onTap: () => setState(
                        () => _filterStatus = AttendanceStatus.alpa,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Records list
            Expanded(
              child: filteredRecords.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.history_edu_rounded,
                      title: 'Tidak Ada Riwayat',
                      description:
                          'Tidak ada catatan kehadiran pada filter status ini.',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredRecords.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (ctx, idx) {
                        final record = filteredRecords[idx];
                        return _HistoryCard(record: record);
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
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

class _HistoryCard extends StatelessWidget {
  final AttendanceRecord record;

  const _HistoryCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'id_ID');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  record.subjectName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              AttendanceStatusBadge(status: record.status),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                Icons.calendar_today_rounded,
                size: 13,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 6),
              Text(
                dateFormat.format(record.date),
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 10),
              const Icon(
                Icons.access_time_rounded,
                size: 13,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 4),
              Text(
                record.time,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Guru Pengampu: ${record.teacherName}',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          if (record.notes != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: record.status.backgroundColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: record.status.color.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.notes_rounded, size: 14, color: record.status.color),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      record.notes!,
                      style: TextStyle(
                        fontSize: 11,
                        color: record.status.color,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
