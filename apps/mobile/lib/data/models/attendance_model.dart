import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum AttendanceStatus {
  hadir,
  terlambat,
  sakit,
  izin,
  alpa,
  belumDiisi;

  String get label {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'Hadir';
      case AttendanceStatus.terlambat:
        return 'Terlambat';
      case AttendanceStatus.sakit:
        return 'Sakit';
      case AttendanceStatus.izin:
        return 'Izin';
      case AttendanceStatus.alpa:
        return 'Alpa';
      case AttendanceStatus.belumDiisi:
        return 'Belum Diisi';
    }
  }

  String get shortCode {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'H';
      case AttendanceStatus.terlambat:
        return 'T';
      case AttendanceStatus.sakit:
        return 'S';
      case AttendanceStatus.izin:
        return 'I';
      case AttendanceStatus.alpa:
        return 'A';
      case AttendanceStatus.belumDiisi:
        return '-';
    }
  }

  Color get color {
    switch (this) {
      case AttendanceStatus.hadir:
        return AppColors.hadir;
      case AttendanceStatus.terlambat:
        return AppColors.terlambat;
      case AttendanceStatus.sakit:
        return AppColors.sakit;
      case AttendanceStatus.izin:
        return AppColors.izin;
      case AttendanceStatus.alpa:
        return AppColors.alpa;
      case AttendanceStatus.belumDiisi:
        return AppColors.belumDiisi;
    }
  }

  Color get backgroundColor {
    switch (this) {
      case AttendanceStatus.hadir:
        return AppColors.hadirBg;
      case AttendanceStatus.terlambat:
        return AppColors.terlambatBg;
      case AttendanceStatus.sakit:
        return AppColors.sakitBg;
      case AttendanceStatus.izin:
        return AppColors.izinBg;
      case AttendanceStatus.alpa:
        return AppColors.alpaBg;
      case AttendanceStatus.belumDiisi:
        return AppColors.belumDiisiBg;
    }
  }

  IconData get icon {
    switch (this) {
      case AttendanceStatus.hadir:
        return Icons.check_circle_rounded;
      case AttendanceStatus.terlambat:
        return Icons.access_time_rounded;
      case AttendanceStatus.sakit:
        return Icons.medication_rounded;
      case AttendanceStatus.izin:
        return Icons.assignment_turned_in_rounded;
      case AttendanceStatus.alpa:
        return Icons.cancel_rounded;
      case AttendanceStatus.belumDiisi:
        return Icons.radio_button_unchecked_rounded;
    }
  }

  static AttendanceStatus fromBackendString(String? str) {
    if (str == null) return AttendanceStatus.belumDiisi;
    final upper = str.toUpperCase();
    switch (upper) {
      case 'HADIR':
        return AttendanceStatus.hadir;
      case 'TERLAMBAT':
        return AttendanceStatus.terlambat;
      case 'SAKIT':
        return AttendanceStatus.sakit;
      case 'IZIN':
        return AttendanceStatus.izin;
      case 'ALPA':
        return AttendanceStatus.alpa;
      default:
        return AttendanceStatus.values.firstWhere(
          (e) => e.name.toLowerCase() == str.toLowerCase(),
          orElse: () => AttendanceStatus.belumDiisi,
        );
    }
  }

  String toBackendString() {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'HADIR';
      case AttendanceStatus.terlambat:
        return 'TERLAMBAT';
      case AttendanceStatus.sakit:
        return 'SAKIT';
      case AttendanceStatus.izin:
        return 'IZIN';
      case AttendanceStatus.alpa:
        return 'ALPA';
      case AttendanceStatus.belumDiisi:
        return 'HADIR'; // Fallback for explicit submit if needed
    }
  }
}

enum SessionStatus {
  belumDimulai,
  sedangBerlangsung,
  sudahDisimpan,
  selesai,
  perluDiperiksa;

  String get label {
    switch (this) {
      case SessionStatus.belumDimulai:
        return 'Belum Dimulai';
      case SessionStatus.sedangBerlangsung:
        return 'Sedang Berlangsung';
      case SessionStatus.sudahDisimpan:
        return 'Sudah Disimpan';
      case SessionStatus.selesai:
        return 'Selesai';
      case SessionStatus.perluDiperiksa:
        return 'Perlu Diperiksa';
    }
  }

  Color get color {
    switch (this) {
      case SessionStatus.belumDimulai:
        return const Color(0xFF64748B);
      case SessionStatus.sedangBerlangsung:
        return const Color(0xFF0284C7);
      case SessionStatus.sudahDisimpan:
        return const Color(0xFF059669);
      case SessionStatus.selesai:
        return const Color(0xFF475569);
      case SessionStatus.perluDiperiksa:
        return const Color(0xFFD97706);
    }
  }

  Color get backgroundColor {
    switch (this) {
      case SessionStatus.belumDimulai:
        return const Color(0xFFF1F5F9);
      case SessionStatus.sedangBerlangsung:
        return const Color(0xFFF0F9FF);
      case SessionStatus.sudahDisimpan:
        return const Color(0xFFECFDF5);
      case SessionStatus.selesai:
        return const Color(0xFFF8FAFC);
      case SessionStatus.perluDiperiksa:
        return const Color(0xFFFFFBEB);
    }
  }

  static SessionStatus fromBackendString(String? str) {
    if (str == null) return SessionStatus.belumDimulai;
    final upper = str.toUpperCase();
    switch (upper) {
      case 'BELUM_DIMULAI':
        return SessionStatus.belumDimulai;
      case 'SEDANG_BERLANGSUNG':
      case 'OPEN':
        return SessionStatus.sedangBerlangsung;
      case 'SUDAH_DISIMPAN':
        return SessionStatus.sudahDisimpan;
      case 'SELESAI':
      case 'CLOSED':
      case 'DITUTUP':
        return SessionStatus.selesai;
      case 'PERLU_DIPERIKSA':
        return SessionStatus.perluDiperiksa;
      default:
        return SessionStatus.values.firstWhere(
          (e) => e.name.toLowerCase() == str.toLowerCase(),
          orElse: () => SessionStatus.belumDimulai,
        );
    }
  }

  String toBackendString() {
    switch (this) {
      case SessionStatus.belumDimulai:
        return 'BELUM_DIMULAI';
      case SessionStatus.sedangBerlangsung:
        return 'SEDANG_BERLANGSUNG';
      case SessionStatus.sudahDisimpan:
        return 'SUDAH_DISIMPAN';
      case SessionStatus.selesai:
        return 'DITUTUP';
      case SessionStatus.perluDiperiksa:
        return 'PERLU_DIPERIKSA';
    }
  }
}

class StudentAttendanceEntry {
  final String studentId;
  final String studentName;
  final String nis;
  final String gender;
  final AttendanceStatus status;
  final String? notes;

  const StudentAttendanceEntry({
    required this.studentId,
    required this.studentName,
    required this.nis,
    required this.gender,
    required this.status,
    this.notes,
  });

  StudentAttendanceEntry copyWith({
    String? studentId,
    String? studentName,
    String? nis,
    String? gender,
    AttendanceStatus? status,
    String? notes,
  }) {
    return StudentAttendanceEntry(
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      nis: nis ?? this.nis,
      gender: gender ?? this.gender,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() => {
    'studentId': studentId,
    'studentName': studentName,
    'nis': nis,
    'gender': gender,
    'status': status.name,
    'notes': notes,
  };

  factory StudentAttendanceEntry.fromJson(Map<String, dynamic> json) =>
      StudentAttendanceEntry(
        studentId: json['studentId'] as String,
        studentName: json['studentName'] as String,
        nis: json['nis'] as String,
        gender: json['gender'] as String,
        status: AttendanceStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => AttendanceStatus.belumDiisi,
        ),
        notes: json['notes'] as String?,
      );

  factory StudentAttendanceEntry.fromApiJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>? ?? {};
    final user = student['user'] as Map<String, dynamic>? ?? {};
    return StudentAttendanceEntry(
      studentId: json['studentId'] ?? student['id'] ?? '',
      studentName: student['fullName'] ?? json['studentName'] ?? 'Siswa',
      nis: student['nis'] ?? json['nis'] ?? '',
      gender: user['gender'] ?? student['gender'] ?? json['gender'] ?? 'L',
      status: AttendanceStatus.fromBackendString(json['status'] as String?),
      notes: json['notes'] as String?,
    );
  }
}

class AttendanceSession {
  final String id;
  final String scheduleId;
  final String subjectName;
  final String className;
  final String teacherName;
  final String teacherNip;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String room;
  final SessionStatus status;
  final List<StudentAttendanceEntry> entries;
  final bool isLocalDraft;
  final bool isSynced;
  final DateTime updatedAt;

  const AttendanceSession({
    required this.id,
    required this.scheduleId,
    required this.subjectName,
    required this.className,
    required this.teacherName,
    required this.teacherNip,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.room,
    required this.status,
    required this.entries,
    this.isLocalDraft = false,
    this.isSynced = true,
    required this.updatedAt,
  });

  int get totalStudents => entries.length;
  int get hadirCount =>
      entries.where((e) => e.status == AttendanceStatus.hadir).length;
  int get terlambatCount =>
      entries.where((e) => e.status == AttendanceStatus.terlambat).length;
  int get sakitCount =>
      entries.where((e) => e.status == AttendanceStatus.sakit).length;
  int get izinCount =>
      entries.where((e) => e.status == AttendanceStatus.izin).length;
  int get alpaCount =>
      entries.where((e) => e.status == AttendanceStatus.alpa).length;
  int get belumDiisiCount =>
      entries.where((e) => e.status == AttendanceStatus.belumDiisi).length;

  double get attendanceRate {
    if (entries.isEmpty) return 0.0;
    final validAttend = hadirCount + terlambatCount;
    return (validAttend / entries.length) * 100;
  }

  String get timeRange => '$startTime - $endTime WIB';

  AttendanceSession copyWith({
    String? id,
    String? scheduleId,
    String? subjectName,
    String? className,
    String? teacherName,
    String? teacherNip,
    DateTime? date,
    String? startTime,
    String? endTime,
    String? room,
    SessionStatus? status,
    List<StudentAttendanceEntry>? entries,
    bool? isLocalDraft,
    bool? isSynced,
    DateTime? updatedAt,
  }) {
    return AttendanceSession(
      id: id ?? this.id,
      scheduleId: scheduleId ?? this.scheduleId,
      subjectName: subjectName ?? this.subjectName,
      className: className ?? this.className,
      teacherName: teacherName ?? this.teacherName,
      teacherNip: teacherNip ?? this.teacherNip,
      date: date ?? this.date,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      room: room ?? this.room,
      status: status ?? this.status,
      entries: entries ?? this.entries,
      isLocalDraft: isLocalDraft ?? this.isLocalDraft,
      isSynced: isSynced ?? this.isSynced,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'scheduleId': scheduleId,
    'subjectName': subjectName,
    'className': className,
    'teacherName': teacherName,
    'teacherNip': teacherNip,
    'date': date.toIso8601String(),
    'startTime': startTime,
    'endTime': endTime,
    'room': room,
    'status': status.name,
    'entries': entries.map((e) => e.toJson()).toList(),
    'isLocalDraft': isLocalDraft,
    'isSynced': isSynced,
    'updatedAt': updatedAt.toIso8601String(),
  };

  factory AttendanceSession.fromJson(Map<String, dynamic> json) =>
      AttendanceSession(
        id: json['id'] as String,
        scheduleId: json['scheduleId'] as String,
        subjectName: json['subjectName'] as String,
        className: json['className'] as String,
        teacherName: json['teacherName'] as String,
        teacherNip: json['teacherNip'] as String,
        date: DateTime.parse(json['date'] as String),
        startTime: json['startTime'] as String,
        endTime: json['endTime'] as String,
        room: json['room'] as String,
        status: SessionStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => SessionStatus.belumDimulai,
        ),
        entries: (json['entries'] as List<dynamic>?)
                ?.map(
                  (e) => StudentAttendanceEntry.fromJson(
                    e as Map<String, dynamic>,
                  ),
                )
                .toList() ??
            [],
        isLocalDraft: json['isLocalDraft'] as bool? ?? false,
        isSynced: json['isSynced'] as bool? ?? true,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  factory AttendanceSession.fromApiJson(Map<String, dynamic> json) {
    final classMap = json['class'] as Map<String, dynamic>?;
    final subjectMap = json['subject'] as Map<String, dynamic>?;
    final teacherMap = json['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacherMap?['user'] as Map<String, dynamic>?;
    final scheduleMap = json['schedule'] as Map<String, dynamic>?;

    final recordsList = json['records'] as List<dynamic>? ?? [];
    final entries = recordsList
        .map(
          (r) => StudentAttendanceEntry.fromApiJson(r as Map<String, dynamic>),
        )
        .toList();

    return AttendanceSession(
      id: json['id'] as String,
      scheduleId: json['scheduleId'] ?? scheduleMap?['id'] ?? '',
      subjectName:
          subjectMap?['name'] ?? json['subjectName'] ?? 'Mata Pelajaran',
      className: classMap?['name'] ?? json['className'] ?? 'Kelas',
      teacherName: teacherUser?['fullName'] ??
          teacherMap?['fullName'] ??
          json['teacherName'] ??
          'Guru Pengampu',
      teacherNip: teacherMap?['nip'] ?? json['teacherNip'] ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : DateTime.now(),
      startTime: scheduleMap?['startTime'] ?? json['startTime'] ?? '07:30',
      endTime: scheduleMap?['endTime'] ?? json['endTime'] ?? '09:00',
      room: scheduleMap?['room'] ?? json['room'] ?? 'Ruang Kelas',
      status: SessionStatus.fromBackendString(json['status'] as String?),
      entries: entries,
      isLocalDraft: false,
      isSynced: true,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }
}

class AttendanceRecord {
  final String id;
  final String subjectName;
  final String className;
  final DateTime date;
  final String time;
  final AttendanceStatus status;
  final String? notes;
  final String teacherName;

  const AttendanceRecord({
    required this.id,
    required this.subjectName,
    required this.className,
    required this.date,
    required this.time,
    required this.status,
    this.notes,
    required this.teacherName,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'subjectName': subjectName,
    'className': className,
    'date': date.toIso8601String(),
    'time': time,
    'status': status.name,
    'notes': notes,
    'teacherName': teacherName,
  };

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: json['id'] as String,
        subjectName: json['subjectName'] as String,
        className: json['className'] as String,
        date: DateTime.parse(json['date'] as String),
        time: json['time'] as String,
        status: AttendanceStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => AttendanceStatus.hadir,
        ),
        notes: json['notes'] as String?,
        teacherName: json['teacherName'] as String,
      );

  factory AttendanceRecord.fromApiJson(Map<String, dynamic> json) {
    final session = json['session'] as Map<String, dynamic>?;
    final subject = session?['subject'] as Map<String, dynamic>?;
    final cls = session?['class'] as Map<String, dynamic>?;
    final teacher = session?['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacher?['user'] as Map<String, dynamic>?;
    final schedule = session?['schedule'] as Map<String, dynamic>?;

    final dateStr = session?['date'] ?? json['date'] ?? json['recordedAt'];
    final startTime = schedule?['startTime'] ?? '07:30';
    final endTime = schedule?['endTime'] ?? '09:00';

    return AttendanceRecord(
      id: json['id'] as String,
      subjectName: subject?['name'] ?? json['subjectName'] ?? 'Mata Pelajaran',
      className: cls?['name'] ?? json['className'] ?? 'Kelas',
      date: dateStr != null
          ? DateTime.parse(dateStr as String)
          : DateTime.now(),
      time: '$startTime - $endTime WIB',
      status: AttendanceStatus.fromBackendString(json['status'] as String?),
      notes: json['notes'] as String?,
      teacherName: teacherUser?['fullName'] ??
          teacher?['fullName'] ??
          json['teacherName'] ??
          'Guru Pengampu',
    );
  }
}

