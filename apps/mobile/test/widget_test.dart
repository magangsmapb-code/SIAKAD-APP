import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siakad_mobile/app/app.dart';
import 'package:siakad_mobile/app/constants.dart';
import 'package:siakad_mobile/data/models/attendance_model.dart';
import 'package:siakad_mobile/data/models/user_model.dart';
import 'package:siakad_mobile/data/repositories/attendance_repository.dart';
import 'package:siakad_mobile/data/repositories/auth_repository.dart';
import 'package:siakad_mobile/data/repositories/dashboard_repository.dart';
import 'package:siakad_mobile/data/repositories/permission_repository.dart';
import 'package:siakad_mobile/data/repositories/schedule_repository.dart';
import 'package:siakad_mobile/state/app_state.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('id_ID', null);
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  AppState createTestState() => AppState(
        authRepo: MockAuthRepository(),
        attendanceRepo: MockAttendanceRepository(),
        scheduleRepo: MockScheduleRepository(),
        permissionRepo: MockPermissionRepository(),
        dashboardRepo: MockDashboardRepository(),
      );

  group('SIAKAD Mobile Unit & Widget Tests', () {
    test('AppState initializes with default teacher and loads initial data',
        () async {
      final appState = createTestState();
      await appState.init();

      expect(appState.isLoggedIn, isTrue);
      expect(appState.currentUser?.role, equals(UserRole.guru));
      expect(appState.currentUser?.name, contains('Siti Rahmawati'));
      expect(appState.sessions.isNotEmpty, isTrue);
      expect(appState.teacherSchedules.isNotEmpty, isTrue);
    });

    test('Teacher attendance marking, draft saving, and sync queue workflow',
        () async {
      final appState = createTestState();
      await appState.init();

      final firstSession = appState.sessions.first;
      final studentId = firstSession.entries.first.studentId;

      // Update student status to Sakit with note
      appState.updateStudentStatus(
        firstSession.id,
        studentId,
        AttendanceStatus.sakit,
        notes: 'Surat dokter terlampir',
      );

      final updatedSession = appState.getSessionById(firstSession.id);
      final updatedEntry = updatedSession!.entries
          .firstWhere((e) => e.studentId == studentId);
      expect(updatedEntry.status, equals(AttendanceStatus.sakit));
      expect(updatedEntry.notes, equals('Surat dokter terlampir'));

      // Save draft locally
      await appState.saveDraft(firstSession.id);
      expect(appState.pendingSyncCount, greaterThanOrEqualTo(1));

      // Sync pending
      final syncedCount = await appState.syncPendingSessions();
      expect(syncedCount, greaterThanOrEqualTo(1));
    });

    testWidgets('SiakadApp boots and renders Splash Screen',
        (WidgetTester tester) async {
      final appState = createTestState();

      await tester.pumpWidget(SiakadApp(appState: appState));
      // First frame shows splash
      expect(find.text(AppConstants.appName), findsOneWidget);
      expect(find.text(AppConstants.institutionName), findsOneWidget);

      // Advance through timer and navigation
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();
    });
  });
}
