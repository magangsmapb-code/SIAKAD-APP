import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class OfflineBanner extends StatelessWidget {
  final bool isOnline;
  final VoidCallback? onToggle;

  const OfflineBanner({super.key, required this.isOnline, this.onToggle});

  @override
  Widget build(BuildContext context) {
    if (isOnline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: const Color(0xFFFEF3C7),
      child: Row(
        children: [
          const Icon(
            Icons.wifi_off_rounded,
            size: 16,
            color: Color(0xFFB45309),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Mode Offline: Absensi tersimpan sebagai draft lokal.',
              style: TextStyle(
                color: Color(0xFF92400E),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (onToggle != null)
            GestureDetector(
              onTap: onToggle,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Hubungkan',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
