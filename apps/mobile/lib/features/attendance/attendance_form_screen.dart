import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/confirm_dialog.dart';
import '../../core/widgets/sync_badge.dart';
import '../../data/models/attendance_model.dart';
import '../../state/app_state.dart';
import 'sync_queue_screen.dart';

class AttendanceFormScreen extends StatefulWidget {
  final String sessionId;

  const AttendanceFormScreen({super.key, required this.sessionId});

  @override
  State<AttendanceFormScreen> createState() => _AttendanceFormScreenState();
}

class _AttendanceFormScreenState extends State<AttendanceFormScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _markAllPresent(AppState appState) {
    appState.markAllPresent(widget.sessionId);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Semua siswa yang belum diisi ditandai Hadir.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _saveDraft(AppState appState) async {
    try {
      await appState.saveDraft(widget.sessionId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.save_as_rounded, color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text('Draft absensi berhasil disimpan secara lokal.'),
            ],
          ),
          backgroundColor: AppColors.primary,
          duration: Duration(seconds: 3),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menyimpan draft: $e'),
          backgroundColor: AppColors.alpa,
        ),
      );
    }
  }

  void _submitAttendance(AppState appState, AttendanceSession session) async {
    final belumDiisi = session.belumDiisiCount;

    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Kirim Hasil Absensi?',
      message: belumDiisi > 0
          ? 'Masih terdapat $belumDiisi siswa yang berstatus belum diisi. Tetap ingin mengirimkan absensi kelas ${session.className}?'
          : 'Absensi kelas ${session.className} (${session.subjectName}) akan disimpan dan dimasukkan ke antrean sinkronisasi server.',
      confirmText: 'Kirim Absensi',
      cancelText: 'Batal',
      confirmColor: AppColors.secondary,
      icon: Icons.check_circle_outline_rounded,
    );

    if (confirmed != true || !mounted) return;

    try {
      final submittedSession = await appState.submitAttendance(widget.sessionId);
      if (!mounted) return;

      if (submittedSession.isSynced) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.cloud_done_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Absensi berhasil disimpan ke server sekolah.'),
              ],
            ),
            backgroundColor: AppColors.secondary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.save_as_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Tersimpan di perangkat lokal. Menunggu sinkronisasi saat terhubung ke server.',
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.syncPending,
            action: SnackBarAction(
              label: 'Lihat Antrean',
              textColor: Colors.white,
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SyncQueueScreen()),
                );
              },
            ),
          ),
        );
      }

      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Terjadi kesalahan: $e'),
          backgroundColor: AppColors.alpa,
        ),
      );
    }
  }

  void _openNoteDialog(
    BuildContext context,
    AppState appState,
    StudentAttendanceEntry entry,
  ) {
    final noteController = TextEditingController(text: entry.notes ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Catatan: ${entry.studentName}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Status saat ini: ${entry.status.label}',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: entry.status.color,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: noteController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText:
                    'Tulis keterangan (misal: "Izin ke Puskesmas", "Surat dokter terlampir")',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              appState.updateStudentStatus(
                widget.sessionId,
                entry.studentId,
                entry.status,
                notes: noteController.text.trim().isEmpty
                    ? null
                    : noteController.text.trim(),
              );
              Navigator.of(ctx).pop();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Simpan Catatan', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final session = appState.getSessionById(widget.sessionId);

    if (session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sesi Absensi')),
        body: const Center(child: Text('Sesi absensi tidak ditemukan')),
      );
    }

    final entries = session.entries.where((e) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return e.studentName.toLowerCase().contains(q) ||
          e.nis.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${session.className} • ${session.subjectName}',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            Text(
              '${session.room} • ${session.timeRange}',
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: SyncBadge(
                isSynced: session.isSynced,
                isLocalDraft: session.isLocalDraft,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Live Status Summary Counter Bar
            _buildLiveCounterBar(session),

            // Search Bar & Mark All Present helper
            _buildSearchAndActionRow(appState, session),

            // Student list
            Expanded(
              child: entries.isEmpty
                  ? Center(
                      child: Text(
                        'Tidak ditemukan siswa dengan kata kunci "$_searchQuery"',
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                      itemCount: entries.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (ctx, idx) {
                        final entry = entries[idx];
                        return _StudentAttendanceRow(
                          entry: entry,
                          onStatusChanged: (newStatus) {
                            appState.updateStudentStatus(
                              widget.sessionId,
                              entry.studentId,
                              newStatus,
                            );
                          },
                          onAddNote: () =>
                              _openNoteDialog(context, appState, entry),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      // Bottom Sticky Action Bar (One-handed comfortable buttons)
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              flex: 1,
              child: OutlinedButton.icon(
                onPressed: () => _saveDraft(appState),
                icon: const Icon(Icons.save_outlined, size: 18),
                label: const Text('Draft Lokal'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: () => _submitAttendance(appState, session),
                icon: const Icon(Icons.send_rounded, size: 18),
                label: const Text('Kirim Absensi'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveCounterBar(AttendanceSession session) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _CounterBadge(
            label: 'Hadir',
            count: session.hadirCount,
            color: AppColors.hadir,
            bgColor: AppColors.hadirBg,
          ),
          _CounterBadge(
            label: 'Terlambat',
            count: session.terlambatCount,
            color: AppColors.terlambat,
            bgColor: AppColors.terlambatBg,
          ),
          _CounterBadge(
            label: 'Sakit',
            count: session.sakitCount,
            color: AppColors.sakit,
            bgColor: AppColors.sakitBg,
          ),
          _CounterBadge(
            label: 'Izin',
            count: session.izinCount,
            color: AppColors.izin,
            bgColor: AppColors.izinBg,
          ),
          _CounterBadge(
            label: 'Alpa',
            count: session.alpaCount,
            color: AppColors.alpa,
            bgColor: AppColors.alpaBg,
          ),
          _CounterBadge(
            label: 'Belum',
            count: session.belumDiisiCount,
            color: AppColors.belumDiisi,
            bgColor: AppColors.belumDiisiBg,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndActionRow(AppState appState, AttendanceSession session) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      prefixIcon: const Icon(Icons.search, size: 20),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      hintText: 'Cari nama atau NIS siswa...',
                      hintStyle: const TextStyle(fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () => _markAllPresent(appState),
                icon: const Icon(Icons.done_all_rounded, size: 16),
                label: const Text('Semua Hadir'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFECFDF5),
                  foregroundColor: AppColors.hadir,
                  elevation: 0,
                  side: const BorderSide(color: Color(0xFFA7F3D0)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _CounterBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _CounterBadge({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
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

class _StudentAttendanceRow extends StatelessWidget {
  final StudentAttendanceEntry entry;
  final Function(AttendanceStatus) onStatusChanged;
  final VoidCallback onAddNote;

  const _StudentAttendanceRow({
    required this.entry,
    required this.onStatusChanged,
    required this.onAddNote,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: entry.status == AttendanceStatus.belumDiisi
              ? const Color(0xFFE2E8F0)
              : entry.status.color.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top: Name, NIS, Gender, Note button
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  entry.studentName.substring(0, 1),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.studentName,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'NIS: ${entry.nis} • ${entry.gender == "L" ? "Laki-laki" : "Perempuan"}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  entry.notes != null
                      ? Icons.comment_rounded
                      : Icons.add_comment_outlined,
                  size: 18,
                  color: entry.notes != null
                      ? AppColors.primary
                      : AppColors.textMuted,
                ),
                tooltip: 'Catatan Siswa',
                onPressed: onAddNote,
              ),
            ],
          ),

          if (entry.notes != null) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.note_outlined,
                    size: 13,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      entry.notes!,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 10),

          // Status Button Group [H] [T] [S] [I] [A]
          Row(
            children: [
              _StatusOptionButton(
                code: 'H',
                label: 'Hadir',
                color: AppColors.hadir,
                bgColor: AppColors.hadirBg,
                isSelected: entry.status == AttendanceStatus.hadir,
                onTap: () => onStatusChanged(AttendanceStatus.hadir),
              ),
              const SizedBox(width: 6),
              _StatusOptionButton(
                code: 'T',
                label: 'Terlambat',
                color: AppColors.terlambat,
                bgColor: AppColors.terlambatBg,
                isSelected: entry.status == AttendanceStatus.terlambat,
                onTap: () => onStatusChanged(AttendanceStatus.terlambat),
              ),
              const SizedBox(width: 6),
              _StatusOptionButton(
                code: 'S',
                label: 'Sakit',
                color: AppColors.sakit,
                bgColor: AppColors.sakitBg,
                isSelected: entry.status == AttendanceStatus.sakit,
                onTap: () => onStatusChanged(AttendanceStatus.sakit),
              ),
              const SizedBox(width: 6),
              _StatusOptionButton(
                code: 'I',
                label: 'Izin',
                color: AppColors.izin,
                bgColor: AppColors.izinBg,
                isSelected: entry.status == AttendanceStatus.izin,
                onTap: () => onStatusChanged(AttendanceStatus.izin),
              ),
              const SizedBox(width: 6),
              _StatusOptionButton(
                code: 'A',
                label: 'Alpa',
                color: AppColors.alpa,
                bgColor: AppColors.alpaBg,
                isSelected: entry.status == AttendanceStatus.alpa,
                onTap: () => onStatusChanged(AttendanceStatus.alpa),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusOptionButton extends StatelessWidget {
  final String code;
  final String label;
  final Color color;
  final Color bgColor;
  final bool isSelected;
  final VoidCallback onTap;

  const _StatusOptionButton({
    required this.code,
    required this.label,
    required this.color,
    required this.bgColor,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? color : bgColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? color : color.withValues(alpha: 0.3),
              width: isSelected ? 1.5 : 1,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: color.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Text(
            code,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: isSelected ? Colors.white : color,
            ),
          ),
        ),
      ),
    );
  }
}
