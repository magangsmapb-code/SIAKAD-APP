import 'package:flutter/material.dart';

enum PermissionType {
  sakit('Sakit'),
  izin('Izin Pribadi/Keluarga'),
  dispensasi('Dispensasi Kegiatan');

  final String label;
  const PermissionType(this.label);

  static PermissionType fromBackendString(String? str) {
    if (str == null) return PermissionType.izin;
    final upper = str.toUpperCase();
    if (upper == 'SAKIT') return PermissionType.sakit;
    if (upper == 'DISPENSASI') return PermissionType.dispensasi;
    return PermissionType.izin;
  }

  String toBackendString() {
    switch (this) {
      case PermissionType.sakit:
        return 'SAKIT';
      case PermissionType.izin:
        return 'IZIN';
      case PermissionType.dispensasi:
        return 'DISPENSASI';
    }
  }
}

enum PermissionStatus {
  menunggu('Menunggu Persetujuan', Color(0xFFD97706), Color(0xFFFFFBEB)),
  disetujui('Disetujui', Color(0xFF059669), Color(0xFFECFDF5)),
  ditolak('Ditolak', Color(0xFFE11D48), Color(0xFFFFF1F2));

  final String label;
  final Color color;
  final Color backgroundColor;
  const PermissionStatus(this.label, this.color, this.backgroundColor);

  static PermissionStatus fromBackendString(String? str) {
    if (str == null) return PermissionStatus.menunggu;
    final upper = str.toUpperCase();
    if (upper == 'DISETUJUI' || upper == 'APPROVED') return PermissionStatus.disetujui;
    if (upper == 'DITOLAK' || upper == 'REJECTED') return PermissionStatus.ditolak;
    return PermissionStatus.menunggu;
  }

  String toBackendString() {
    switch (this) {
      case PermissionStatus.menunggu:
        return 'MENUNGGU';
      case PermissionStatus.disetujui:
        return 'DISETUJUI';
      case PermissionStatus.ditolak:
        return 'DITOLAK';
    }
  }
}

class PermissionItem {
  final String id;
  final String studentId;
  final String studentName;
  final String nis;
  final String className;
  final PermissionType type;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? attachmentName;
  final PermissionStatus status;
  final DateTime submittedAt;
  final String? reviewedBy;
  final DateTime? reviewedAt;
  final String? reviewNotes;

  const PermissionItem({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.nis,
    required this.className,
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.attachmentName,
    required this.status,
    required this.submittedAt,
    this.reviewedBy,
    this.reviewedAt,
    this.reviewNotes,
  });

  PermissionItem copyWith({
    String? id,
    String? studentId,
    String? studentName,
    String? nis,
    String? className,
    PermissionType? type,
    DateTime? startDate,
    DateTime? endDate,
    String? reason,
    String? attachmentName,
    PermissionStatus? status,
    DateTime? submittedAt,
    String? reviewedBy,
    DateTime? reviewedAt,
    String? reviewNotes,
  }) {
    return PermissionItem(
      id: id ?? this.id,
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      nis: nis ?? this.nis,
      className: className ?? this.className,
      type: type ?? this.type,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      reason: reason ?? this.reason,
      attachmentName: attachmentName ?? this.attachmentName,
      status: status ?? this.status,
      submittedAt: submittedAt ?? this.submittedAt,
      reviewedBy: reviewedBy ?? this.reviewedBy,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      reviewNotes: reviewNotes ?? this.reviewNotes,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'studentId': studentId,
    'studentName': studentName,
    'nis': nis,
    'className': className,
    'type': type.name,
    'startDate': startDate.toIso8601String(),
    'endDate': endDate.toIso8601String(),
    'reason': reason,
    'attachmentName': attachmentName,
    'status': status.name,
    'submittedAt': submittedAt.toIso8601String(),
    'reviewedBy': reviewedBy,
    'reviewedAt': reviewedAt?.toIso8601String(),
    'reviewNotes': reviewNotes,
  };

  factory PermissionItem.fromJson(Map<String, dynamic> json) => PermissionItem(
    id: json['id'] as String,
    studentId: json['studentId'] as String,
    studentName: json['studentName'] as String,
    nis: json['nis'] as String,
    className: json['className'] as String,
    type: PermissionType.values.firstWhere(
      (e) => e.name == json['type'],
      orElse: () => PermissionType.izin,
    ),
    startDate: DateTime.parse(json['startDate'] as String),
    endDate: DateTime.parse(json['endDate'] as String),
    reason: json['reason'] as String,
    attachmentName: json['attachmentName'] as String?,
    status: PermissionStatus.values.firstWhere(
      (e) => e.name == json['status'],
      orElse: () => PermissionStatus.menunggu,
    ),
    submittedAt: DateTime.parse(json['submittedAt'] as String),
    reviewedBy: json['reviewedBy'] as String?,
    reviewedAt: json['reviewedAt'] != null
        ? DateTime.tryParse(json['reviewedAt'] as String)
        : null,
    reviewNotes: json['reviewNotes'] as String?,
  );

  factory PermissionItem.fromApiJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>?;
    final cls = student?['class'] as Map<String, dynamic>?;
    final approver = json['approvedBy'] as Map<String, dynamic>?;
    final approverUser = approver?['user'] as Map<String, dynamic>?;

    return PermissionItem(
      id: json['id'] as String,
      studentId: json['studentId'] ?? student?['id'] ?? '',
      studentName: student?['fullName'] ?? json['studentName'] ?? 'Siswa',
      nis: student?['nis'] ?? json['nis'] ?? '',
      className: cls?['name'] ?? json['className'] ?? 'Kelas',
      type: PermissionType.fromBackendString(json['type'] as String?),
      startDate: json['startDate'] != null
          ? DateTime.parse(json['startDate'] as String)
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : DateTime.now(),
      reason: json['reason'] ?? '',
      attachmentName: json['documentUrl'] ?? json['attachmentName'],
      status: PermissionStatus.fromBackendString(json['status'] as String?),
      submittedAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      reviewedBy: approverUser?['fullName'] ?? approver?['fullName'] ?? json['reviewedBy'],
      reviewedAt: json['approvedAt'] != null
          ? DateTime.tryParse(json['approvedAt'] as String)
          : null,
      reviewNotes: json['approvalNotes'] ?? json['reviewNotes'],
    );
  }
}

