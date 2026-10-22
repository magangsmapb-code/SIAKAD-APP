import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class SyncBadge extends StatelessWidget {
  final bool isSynced;
  final bool isLocalDraft;

  const SyncBadge({
    super.key,
    required this.isSynced,
    this.isLocalDraft = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLocalDraft) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFE0F2FE),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBAE6FD)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.edit_note_rounded, size: 13, color: Color(0xFF075985)),
            SizedBox(width: 4),
            Text(
              'Draft Lokal',
              style: TextStyle(
                color: Color(0xFF075985),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    if (!isSynced) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AppColors.syncPendingBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.syncPending.withValues(alpha: 0.3),
          ),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_upload_outlined,
              size: 13,
              color: AppColors.syncPending,
            ),
            SizedBox(width: 4),
            Text(
              'Menunggu Sinkronisasi',
              style: TextStyle(
                color: AppColors.syncPending,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.syncSuccessBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.syncSuccess.withValues(alpha: 0.3),
        ),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.cloud_done_rounded,
            size: 13,
            color: AppColors.syncSuccess,
          ),
          SizedBox(width: 4),
          Text(
            'Tersinkron',
            style: TextStyle(
              color: AppColors.syncSuccess,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
