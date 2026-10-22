import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/permission_model.dart';
import '../../state/app_state.dart';

class PermissionFormScreen extends StatefulWidget {
  const PermissionFormScreen({super.key});

  @override
  State<PermissionFormScreen> createState() => _PermissionFormScreenState();
}

class _PermissionFormScreenState extends State<PermissionFormScreen> {
  PermissionType _selectedType = PermissionType.sakit;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  final _reasonController = TextEditingController();
  String? _simulatedAttachment;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 7)),
      lastDate: DateTime.now().add(const Duration(days: 60)),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  void _simulatePickFile() {
    setState(() {
      _simulatedAttachment = _selectedType == PermissionType.sakit
          ? 'surat_keterangan_dokter.pdf'
          : 'surat_izin_orang_tua.pdf';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Berkas "$_simulatedAttachment" berhasil dilampirkan.'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _submitForm() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Keterangan atau alasan izin wajib diisi.'),
          backgroundColor: AppColors.alpa,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final appState = context.state;

    try {
      await appState.submitPermission(
        type: _selectedType,
        startDate: _startDate,
        endDate: _endDate,
        reason: reason,
        attachmentName: _simulatedAttachment,
      );

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permohonan izin berhasil diajukan ke wali kelas.'),
          backgroundColor: AppColors.secondary,
        ),
      );

      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Terjadi kesalahan: $e'),
          backgroundColor: AppColors.alpa,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('d MMMM yyyy', 'id_ID');

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Pengajuan Izin / Sakit'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Pengajuan izin akan ditinjau dan divalidasi langsung oleh Wali Kelas X MIPA 1 (Siti Rahmawati, S.Pd.).',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textPrimary,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Permission Type Selector
              const Text(
                'Jenis Ketidakhadiran',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: PermissionType.values.map((type) {
                  final isSelected = _selectedType == type;
                  return ChoiceChip(
                    label: Text(type.label),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 12,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedType = type);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Date Range Picker Card
              const Text(
                'Rentang Tanggal',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDateRange,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.date_range_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Tanggal Izin',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _startDate.day == _endDate.day
                                  ? dateFormat.format(_startDate)
                                  : '${dateFormat.format(_startDate)} - ${dateFormat.format(_endDate)}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.edit_calendar_rounded,
                        color: AppColors.textMuted,
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Reason field
              const Text(
                'Alasan / Keterangan',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _reasonController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText:
                      'Jelaskan alasan izin secara jelas dan sopan (misal: "Demam dan flu sejak semalam, istirahat atas petunjuk dokter")...',
                ),
              ),
              const SizedBox(height: 20),

              // Attachment simulator
              const Text(
                'Lampiran Pendukung (Opsional)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _simulatedAttachment != null
                          ? Icons.attach_file_rounded
                          : Icons.upload_file_rounded,
                      color: _simulatedAttachment != null
                          ? AppColors.secondary
                          : AppColors.textMuted,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _simulatedAttachment ??
                            'Lampirkan surat dokter atau surat izin (PDF/JPG)',
                        style: TextStyle(
                          fontSize: 12,
                          color: _simulatedAttachment != null
                              ? AppColors.textPrimary
                              : AppColors.textMuted,
                          fontWeight: _simulatedAttachment != null
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: _simulatePickFile,
                      child: Text(
                        _simulatedAttachment != null ? 'Ganti' : 'Pilih Berkas',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Kirim Pengajuan Izin',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
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
