import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siakad_mobile/core/network/api_exceptions.dart';
import 'package:siakad_mobile/data/models/user_model.dart';
import 'package:siakad_mobile/data/repositories/auth_repository.dart';
import 'package:siakad_mobile/data/repositories/attendance_repository.dart';
import 'package:siakad_mobile/data/repositories/schedule_repository.dart';
import 'package:siakad_mobile/data/repositories/permission_repository.dart';
import 'package:siakad_mobile/data/repositories/dashboard_repository.dart';
import 'package:siakad_mobile/state/app_state.dart';

void main() {
  group('3. Mobile Authentication & Role Authority Tests', () {
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

    test('Login sets authenticated user and role from repository response', () async {
      final appState = createTestAppState();

      expect(appState.isLoggedIn, isFalse);

      final success = await appState.login(
        identifier: '198403152009032008',
        password: 'password123',
        role: UserRole.guru,
      );

      expect(success, isTrue);
      expect(appState.isLoggedIn, isTrue);
      expect(appState.currentUser?.role, equals(UserRole.guru));
      expect(appState.currentUser?.name, contains('Siti Rahmawati'));
    });

    test('Role Switcher is forbidden in production environment without explicit demo mode', () async {
      final appState = createTestAppState();
      if (!appState.isDemoMode) {
        expect(
          () => appState.switchRole(UserRole.siswa),
          throwsA(isA<ForbiddenException>()),
        );
      }
    });

    test('Logout clears current user and resets all role-scoped collections', () async {
      final appState = createTestAppState();

      await appState.login(
        identifier: '198403152009032008',
        password: 'password123',
        role: UserRole.guru,
      );

      expect(appState.isLoggedIn, isTrue);

      await appState.logout();

      expect(appState.isLoggedIn, isFalse);
      expect(appState.currentUser, isNull);
      expect(appState.sessions.isEmpty, isTrue);
      expect(appState.teacherSchedules.isEmpty, isTrue);
      expect(appState.studentSchedules.isEmpty, isTrue);
    });
  });
}
