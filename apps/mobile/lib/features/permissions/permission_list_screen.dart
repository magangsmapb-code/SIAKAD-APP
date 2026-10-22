import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart';
import '../../state/app_state.dart';
import 'permission_form_screen.dart';

class PermissionListScreen extends StatelessWidget {
  const PermissionListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final permissions = appState.studentPermissions;
    final dateFormat = DateFormat('d MMMM yyyy', 'id_ID');

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Pengajuan Izin & Sakit'),
        elevation: 0,
      ),
      body: SafeArea(
        child: permissions.isEmpty
            ? EmptyStateView(
                icon: Icons.assignment_outlined,
                title: 'Belum Ada Pengajuan',
                description:
                    'Anda belum memiliki riwayat pengajuan izin atau surat keterangan sakit.',
                buttonText: 'Buat Pengajuan Baru',
                onButtonPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const PermissionFormScreen(),
                    ),
                  );
                },
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: permissions.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (ctx, idx) {
                  final item = permissions[idx];
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
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                item.type.label,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: item.status.backgroundColor,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color:
                                      item.status.color.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                item.status.label,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: item.status.color,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(
                              Icons.calendar_today_rounded,
                              size: 14,
                              color: AppColors.textMuted,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              item.startDate.day == item.endDate.day
                                  ? dateFormat.format(item.startDate)
                                  : '${dateFormat.format(item.startDate)} - ${dateFormat.format(item.endDate)}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item.reason,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                            height: 1.4,
                          ),
                        ),
                        if (item.attachmentName != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.attach_file_rounded,
                                size: 14,
                                color: AppColors.secondary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                item.attachmentName!,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.secondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (item.reviewedBy != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Diverifikasi oleh: ${item.reviewedBy}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                if (item.reviewNotes != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Catatan: "${item.reviewNotes}"',
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
                        ],
                      ],
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const PermissionFormScreen(),
            ),
          );
        },
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Buat Izin'),
      ),
    );
  }
}
