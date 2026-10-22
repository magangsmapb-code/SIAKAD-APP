class ScheduleItem {
  final String id;
  final String day; // 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  final String subjectName;
  final String subjectCode;
  final String className;
  final String teacherName;
  final String teacherNip;
  final String startTime; // '07:30'
  final String endTime; // '09:00'
  final String room; // 'R. 101'
  final int totalStudents;
  final bool isToday;
  final bool isAttendanceCompleted;

  const ScheduleItem({
    required this.id,
    required this.day,
    required this.subjectName,
    required this.subjectCode,
    required this.className,
    required this.teacherName,
    required this.teacherNip,
    required this.startTime,
    required this.endTime,
    required this.room,
    this.totalStudents = 32,
    this.isToday = false,
    this.isAttendanceCompleted = false,
  });

  String get timeRange => '$startTime - $endTime WIB';

  Map<String, dynamic> toJson() => {
    'id': id,
    'day': day,
    'subjectName': subjectName,
    'subjectCode': subjectCode,
    'className': className,
    'teacherName': teacherName,
    'teacherNip': teacherNip,
    'startTime': startTime,
    'endTime': endTime,
    'room': room,
    'totalStudents': totalStudents,
    'isToday': isToday,
    'isAttendanceCompleted': isAttendanceCompleted,
  };

  factory ScheduleItem.fromJson(Map<String, dynamic> json) => ScheduleItem(
    id: json['id'] as String,
    day: json['day'] as String,
    subjectName: json['subjectName'] as String,
    subjectCode: json['subjectCode'] as String,
    className: json['className'] as String,
    teacherName: json['teacherName'] as String,
    teacherNip: json['teacherNip'] as String,
    startTime: json['startTime'] as String,
    endTime: json['endTime'] as String,
    room: json['room'] as String,
    totalStudents: json['totalStudents'] as int? ?? 32,
    isToday: json['isToday'] as bool? ?? false,
    isAttendanceCompleted: json['isAttendanceCompleted'] as bool? ?? false,
  );

  factory ScheduleItem.fromApiJson(Map<String, dynamic> json) {
    final subject = json['subject'] as Map<String, dynamic>?;
    final cls = json['class'] as Map<String, dynamic>?;
    final teacher = json['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacher?['user'] as Map<String, dynamic>?;
    final studentsList = cls?['students'] as List<dynamic>? ?? [];

    String parseDay(dynamic raw) {
      if (raw is int) {
        switch (raw) {
          case 1:
            return 'Senin';
          case 2:
            return 'Selasa';
          case 3:
            return 'Rabu';
          case 4:
            return 'Kamis';
          case 5:
            return 'Jumat';
          case 6:
            return 'Sabtu';
          case 7:
            return 'Minggu';
          default:
            return 'Senin';
        }
      }
      final str = raw?.toString().toUpperCase() ?? '';
      if (str.contains('SENIN') || str.contains('MON')) return 'Senin';
      if (str.contains('SELASA') || str.contains('TUE')) return 'Selasa';
      if (str.contains('RABU') || str.contains('WED')) return 'Rabu';
      if (str.contains('KAMIS') || str.contains('THU')) return 'Kamis';
      if (str.contains('JUMAT') || str.contains('FRI')) return 'Jumat';
      if (str.contains('SABTU') || str.contains('SAT')) return 'Sabtu';
      return raw?.toString() ?? 'Senin';
    }

    final dayName = parseDay(json['dayOfWeek'] ?? json['day']);
    final now = DateTime.now();
    final todayDayName = parseDay(now.weekday);
    final isToday = dayName.toLowerCase() == todayDayName.toLowerCase();

    return ScheduleItem(
      id: json['id'] as String,
      day: dayName,
      subjectName: subject?['name'] ?? json['subjectName'] ?? 'Mata Pelajaran',
      subjectCode: subject?['code'] ?? json['subjectCode'] ?? 'MP',
      className: cls?['name'] ?? json['className'] ?? 'Kelas',
      teacherName: teacherUser?['fullName'] ??
          teacher?['fullName'] ??
          json['teacherName'] ??
          'Guru Pengampu',
      teacherNip: teacher?['nip'] ?? json['teacherNip'] ?? '',
      startTime: json['startTime'] ?? '07:30',
      endTime: json['endTime'] ?? '09:00',
      room: json['room'] ?? 'R. Kelas',
      totalStudents: cls?['totalStudents'] ??
          (studentsList.isNotEmpty ? studentsList.length : 32),
      isToday: isToday,
      isAttendanceCompleted: json['isAttendanceCompleted'] ?? false,
    );
  }
}

