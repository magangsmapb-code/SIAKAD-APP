import 'package:flutter/material.dart';
import '../../features/auth/splash_screen.dart';
import '../../features/auth/role_selection_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/dashboard/main_navigation_shell.dart';
import '../../features/attendance/session_list_screen.dart';
import '../../features/attendance/attendance_form_screen.dart';
import '../../features/attendance/sync_queue_screen.dart';
import '../../features/schedules/schedule_list_screen.dart';
import '../../features/permissions/permission_list_screen.dart';
import '../../features/permissions/permission_form_screen.dart';
import '../../features/history/attendance_history_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/profile/settings_screen.dart';
import '../../features/profile/help_screen.dart';
import '../../features/profile/notifications_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String roleSelection = '/role-selection';
  static const String login = '/login';
  static const String forgotPassword = '/forgot-password';
  static const String main = '/main';
  static const String sessions = '/sessions';
  static const String attendanceForm = '/attendance-form';
  static const String syncQueue = '/sync-queue';
  static const String schedules = '/schedules';
  static const String permissions = '/permissions';
  static const String permissionForm = '/permission-form';
  static const String history = '/history';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String help = '/help';
  static const String notifications = '/notifications';

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case roleSelection:
        return MaterialPageRoute(builder: (_) => const RoleSelectionScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
      case main:
        return MaterialPageRoute(builder: (_) => const MainNavigationShell());
      case sessions:
        return MaterialPageRoute(builder: (_) => const SessionListScreen());
      case attendanceForm:
        final sessionId = routeSettings.arguments as String? ?? '';
        return MaterialPageRoute(
          builder: (_) => AttendanceFormScreen(sessionId: sessionId),
        );
      case syncQueue:
        return MaterialPageRoute(builder: (_) => const SyncQueueScreen());
      case schedules:
        return MaterialPageRoute(builder: (_) => const ScheduleListScreen());
      case permissions:
        return MaterialPageRoute(builder: (_) => const PermissionListScreen());
      case permissionForm:
        return MaterialPageRoute(builder: (_) => const PermissionFormScreen());
      case history:
        return MaterialPageRoute(
          builder: (_) => const AttendanceHistoryScreen(),
        );
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case help:
        return MaterialPageRoute(builder: (_) => const HelpScreen());
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('Rute ${routeSettings.name} tidak ditemukan.'),
            ),
          ),
        );
    }
  }
}
