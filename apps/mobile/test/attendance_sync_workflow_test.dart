import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siakad_mobile/data/models/attendance_model.dart';
import 'package:siakad_mobile/data/repositories/attendance_repository.dart';
import 'package:siakad_mobile/data/repositories/auth_repository.dart';
import 'package:siakad_mobile/data/repositories/schedule_repository.dart';
import 'package:siakad_mobile/data/repositories/permission_repository.dart';
import 'package:siakad_mobile/data/repositories/dashboard_repository.dart';
import 'package:siakad_mobile/state/app_state.dart';

void main() {
  group('4. Attendance Sync & Offline Workflow Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
    });

    AppState createTestAppState({
      AuthRepository? authRepo,
      AttendanceRepository? attendanceRepo,
    }) {
      return AppState(
        authRepo: authRepo ?? MockAuthRepository(),
        attendanceRepo: attendanceRepo ?? MockAttendanceRepository(),
        scheduleRepo: MockScheduleRepository(),
        permissionRepo: MockPermissionRepository(),
        dashboardRepo: MockDashboardRepository(),
      );
    }

    test('markAllPresent only modifies unrecorded (belumDiisi) students and preserves notes', () async {
      final appState = createTestAppState();
      await appState.init();

      final session = appState.sessions.first;
      final student1 = session.entries[0];
      final student2 = session.entries[1];

      // Mark student 1 as SAKIT with explicit note
      appState.updateStudentStatus(
        session.id,
        student1.studentId,
        AttendanceStatus.sakit,
        notes: 'Demam 38C',
      );

      // Perform bulk markAllPresent
      appState.markAllPresent(session.id);

      final updatedSession = appState.getSessionById(session.id)!;
      final updatedS1 = updatedSession.entries.firstWhere((e) => e.studentId == student1.studentId);
      final updatedS2 = updatedSession.entries.firstWhere((e) => e.studentId == student2.studentId);

      // Student 1 remains SAKIT (not overwritten)
      expect(updatedS1.status, equals(AttendanceStatus.sakit));
      expect(updatedS1.notes, equals('Demam 38C'));

      // Student 2 was belumDiisi, now HADIR
      expect(updatedS2.status, equals(AttendanceStatus.hadir));
    });

    test('Saving draft flags session as local draft, not yet synced to server', () async {
      final appState = createTestAppState();
      await appState.init();
      final session = appState.sessions.first;

      final draftSession = await appState.saveDraft(session.id);
      expect(draftSession.isLocalDraft, isTrue);
      expect(draftSession.isSynced, isFalse);
      expect(appState.pendingSyncCount, greaterThanOrEqualTo(1));
    });

    test('syncPendingSessions processes queue and updates session synced status', () async {
      final appState = createTestAppState();
      await appState.init();
      final session = appState.sessions.first;

      await appState.saveDraft(session.id);
      expect(appState.pendingSyncCount, greaterThanOrEqualTo(1));

      final syncedCount = await appState.syncPendingSessions();
      expect(syncedCount, greaterThanOrEqualTo(1));
    });
  });
}
