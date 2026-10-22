import 'package:flutter_test/flutter_test.dart';
import 'package:siakad_mobile/data/models/user_model.dart';
import 'package:siakad_mobile/data/models/attendance_model.dart';
import 'package:siakad_mobile/data/models/schedule_model.dart';
import 'package:siakad_mobile/data/models/permission_model.dart';
import 'package:siakad_mobile/core/network/api_exceptions.dart';

void main() {
  group('1. API Response & DTO Parsing Tests', () {
    test('User.fromApiJson correctly maps Teacher and Student backend payloads', () {
      final teacherPayload = {
        'id': 'usr-teacher-01',
        'username': '198403152009032008',
        'fullName': 'Siti Rahmawati, S.Pd.',
        'role': 'TEACHER',
        'email': 'siti.rahmawati@sekolah.sch.id',
        'teacherProfile': {
          'nip': '198403152009032008',
          'academicTitle': 'S.Pd.',
          'phone': '081234567890',
        },
      };

      final teacher = User.fromApiJson(teacherPayload);
      expect(teacher.id, equals('usr-teacher-01'));
      expect(teacher.role, equals(UserRole.guru));
      expect(teacher.identifier, equals('198403152009032008'));
      expect(teacher.name, equals('Siti Rahmawati, S.Pd.'));
      expect(teacher.isGuru, isTrue);
      expect(teacher.isSiswa, isFalse);

      final studentPayload = {
        'id': 'usr-student-01',
        'username': '2401',
        'fullName': 'Aditya Pratama Putra',
        'role': 'STUDENT',
        'studentProfile': {
          'nis': '2401',
          'phone': '08987654321',
          'class': {
            'id': 'cls-10-mipa-1',
            'name': 'X MIPA 1',
          },
        },
      };

      final student = User.fromApiJson(studentPayload);
      expect(student.id, equals('usr-student-01'));
      expect(student.role, equals(UserRole.siswa));
      expect(student.identifier, equals('2401'));
      expect(student.className, equals('X MIPA 1'));
      expect(student.classId, equals('cls-10-mipa-1'));
      expect(student.isSiswa, isTrue);
      expect(student.isGuru, isFalse);
    });

    test('AttendanceSession.fromApiJson parses session, subject, class, and attendance records', () {
      final sessionJson = {
        'id': 'sess-math-101',
        'date': '2026-10-16T00:00:00.000Z',
        'status': 'SEDANG_BERLANGSUNG',
        'class': {'id': 'cls-01', 'name': 'X MIPA 1'},
        'subject': {'id': 'sbj-01', 'name': 'Matematika Wajib'},
        'teacher': {
          'nip': '198403152009032008',
          'user': {'fullName': 'Siti Rahmawati, S.Pd.'},
        },
        'schedule': {
          'id': 'sch-01',
          'startTime': '07:30',
          'endTime': '09:00',
          'room': 'R. 101',
        },
        'records': [
          {
            'id': 'rec-01',
            'studentId': 'std-01',
            'status': 'HADIR',
            'notes': null,
            'student': {
              'id': 'std-01',
              'fullName': 'Aditya Pratama Putra',
              'nis': '2401',
              'user': {'gender': 'L'},
            },
          },
          {
            'id': 'rec-02',
            'studentId': 'std-02',
            'status': 'SAKIT',
            'notes': 'Flu demam',
            'student': {
              'id': 'std-02',
              'fullName': 'Budi Santoso',
              'nis': '2402',
              'user': {'gender': 'L'},
            },
          },
        ],
      };

      final session = AttendanceSession.fromApiJson(sessionJson);
      expect(session.id, equals('sess-math-101'));
      expect(session.subjectName, equals('Matematika Wajib'));
      expect(session.className, equals('X MIPA 1'));
      expect(session.teacherName, equals('Siti Rahmawati, S.Pd.'));
      expect(session.status, equals(SessionStatus.sedangBerlangsung));
      expect(session.entries.length, equals(2));
      expect(session.hadirCount, equals(1));
      expect(session.sakitCount, equals(1));
      expect(session.attendanceRate, equals(50.0));
      expect(session.timeRange, equals('07:30 - 09:00 WIB'));
    });

    test('ScheduleItem.fromApiJson maps schedule with dayOfWeek and details', () {
      final scheduleJson = {
        'id': 'sch-101',
        'dayOfWeek': 1,
        'startTime': '07:30',
        'endTime': '09:00',
        'room': 'R. 101',
        'subject': {'name': 'Matematika Wajib', 'code': 'MTK-X'},
        'class': {'name': 'X MIPA 1', 'totalStudents': 32},
        'teacher': {
          'nip': '198403152009032008',
          'user': {'fullName': 'Siti Rahmawati, S.Pd.'},
        },
      };

      final schedule = ScheduleItem.fromApiJson(scheduleJson);
      expect(schedule.id, equals('sch-101'));
      expect(schedule.day, equals('Senin'));
      expect(schedule.subjectName, equals('Matematika Wajib'));
      expect(schedule.className, equals('X MIPA 1'));
      expect(schedule.teacherNip, equals('198403152009032008'));
    });

    test('PermissionItem.fromApiJson maps permission request DTO', () {
      final permJson = {
        'id': 'perm-01',
        'studentId': 'std-01',
        'type': 'SAKIT',
        'startDate': '2026-10-16T00:00:00.000Z',
        'endDate': '2026-10-17T00:00:00.000Z',
        'reason': 'Sakit demam',
        'status': 'MENUNGGU',
        'student': {
          'fullName': 'Aditya Pratama Putra',
          'nis': '2401',
          'class': {'name': 'X MIPA 1'},
        },
      };

      final perm = PermissionItem.fromApiJson(permJson);
      expect(perm.id, equals('perm-01'));
      expect(perm.studentName, equals('Aditya Pratama Putra'));
      expect(perm.type, equals(PermissionType.sakit));
      expect(perm.status, equals(PermissionStatus.menunggu));
      expect(perm.className, equals('X MIPA 1'));
    });

    test('ApiExceptions properly map HTTP status codes and error messages', () {
      expect(const UnauthorizedException().statusCode, equals(401));
      expect(const ForbiddenException().statusCode, equals(403));
      expect(const NotFoundException().statusCode, equals(404));
      expect(const ConflictException().statusCode, equals(409));
      expect(const ValidationException('Invalid data').statusCode, equals(422));
      expect(const ServerException().statusCode, equals(500));
      expect(const NetworkException().statusCode, isNull);
    });
  });
}
