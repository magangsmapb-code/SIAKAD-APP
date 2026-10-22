import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors - Emerald / Teal Design System
  static const Color primary = Color(0xFF0F766E); // Primary Emerald/Teal 700 (#0F766E)
  static const Color primaryLight = Color(0xFF14B8A6); // Primary Light / Teal 500 (#14B8A6)
  static const Color primaryDark = Color(0xFF115E59); // Teal 800 (#115E59)
  static const Color primarySoft = Color(0xFFF0FDFA); // Teal 50 Soft (#F0FDFA)
  static const Color secondary = Color(0xFF14B8A6); // Teal 500
  static const Color accent = Color(0xFF14B8A6); // Teal Accent

  // Background & Surfaces
  static const Color backgroundLight = Color(0xFFF8FAFC); // Slate 50 (#F8FAFC)
  static const Color surfaceLight = Color(0xFFFFFFFF); // Pure White (#FFFFFF)
  static const Color cardLight = Color(0xFFFFFFFF);

  static const Color backgroundDark = Color(0xFF0B1120);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color cardDark = Color(0xFF1E293B);

  // Attendance Status Colors (Mandatory Tahap 11 Exact Tokens)
  // Hadir (Success): Background #DCFCE7, Text #166534
  static const Color hadir = Color(0xFF166534);
  static const Color hadirBg = Color(0xFFDCFCE7);

  // Terlambat (Warning): Background #FEF3C7, Text #92400E
  static const Color terlambat = Color(0xFF92400E);
  static const Color terlambatBg = Color(0xFFFEF3C7);

  // Izin (Info): Background #E0F2FE, Text #075985
  static const Color izin = Color(0xFF075985);
  static const Color izinBg = Color(0xFFE0F2FE);

  // Sakit: Background #F3E8FF, Text #6B21A8
  static const Color sakit = Color(0xFF6B21A8);
  static const Color sakitBg = Color(0xFFF3E8FF);

  // Alpa: High Contrast Red - Background #FEE2E2, Text #991B1B
  static const Color alpa = Color(0xFF991B1B);
  static const Color alpaBg = Color(0xFFFEE2E2);

  // Neutral / Unfilled
  static const Color belumDiisi = Color(0xFF64748B);
  static const Color belumDiisiBg = Color(0xFFF1F5F9);

  // Offline Sync Status Colors
  static const Color syncPending = Color(0xFFEA580C);
  static const Color syncPendingBg = Color(0xFFFFF7ED);
  static const Color syncSuccess = Color(0xFF166534);
  static const Color syncSuccessBg = Color(0xFFDCFCE7);

  // Neutral & Text Colors
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900 (#0F172A)
  static const Color textSecondary = Color(0xFF64748B); // Slate 500 (#64748B)
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400
  static const Color border = Color(0xFFE2E8F0); // Slate 200 (#E2E8F0)
  static const Color divider = Color(0xFFF1F5F9);
}
