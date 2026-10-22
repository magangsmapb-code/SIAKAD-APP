import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/offline_banner.dart';
import '../../data/models/user_model.dart';
import '../../state/app_state.dart';
import 'teacher_dashboard_screen.dart';
import 'student_dashboard_screen.dart';
import '../attendance/session_list_screen.dart';
import '../attendance/sync_queue_screen.dart';
import '../schedules/schedule_list_screen.dart';
import '../permissions/permission_list_screen.dart';
import '../history/attendance_history_screen.dart';
import '../profile/profile_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  void _onTabSelected(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.state;
    final isGuru = appState.currentUser?.role == UserRole.guru;

    final List<Widget> teacherScreens = [
      TeacherDashboardScreen(onNavigateTab: _onTabSelected),
      const SessionListScreen(),
      const ScheduleListScreen(),
      const SyncQueueScreen(),
      const ProfileScreen(),
    ];

    final List<Widget> studentScreens = [
      StudentDashboardScreen(onNavigateTab: _onTabSelected),
      const ScheduleListScreen(),
      const PermissionListScreen(),
      const AttendanceHistoryScreen(),
      const ProfileScreen(),
    ];

    final currentScreens = isGuru ? teacherScreens : studentScreens;
    final safeIndex = _currentIndex.clamp(0, currentScreens.length - 1);

    return Scaffold(
      body: Column(
        children: [
          // Offline Banner at top
          OfflineBanner(
            isOnline: appState.isOnline,
            onToggle: () => appState.toggleOnlineStatus(),
          ),
          // Active Screen
          Expanded(
            child: IndexedStack(
              index: safeIndex,
              children: currentScreens,
            ),
          ),
        ],
      ),
      bottomNavigationBar: isGuru
          ? _buildTeacherNavBar(appState, safeIndex)
          : _buildStudentNavBar(safeIndex),
    );
  }

  Widget _buildTeacherNavBar(AppState appState, int activeIndex) {
    return NavigationBar(
      selectedIndex: activeIndex,
      onDestinationSelected: _onTabSelected,
      backgroundColor: Colors.white,
      indicatorColor: AppColors.primary.withValues(alpha: 0.12),
      destinations: [
        const NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard_rounded, color: AppColors.primary),
          label: 'Beranda',
        ),
        const NavigationDestination(
          icon: Icon(Icons.fact_check_outlined),
          selectedIcon:
              Icon(Icons.fact_check_rounded, color: AppColors.primary),
          label: 'Absensi',
        ),
        const NavigationDestination(
          icon: Icon(Icons.calendar_month_outlined),
          selectedIcon:
              Icon(Icons.calendar_month_rounded, color: AppColors.primary),
          label: 'Jadwal',
        ),
        NavigationDestination(
          icon: Badge(
            isLabelVisible: appState.pendingSyncCount > 0,
            label: Text('${appState.pendingSyncCount}'),
            backgroundColor: AppColors.syncPending,
            child: const Icon(Icons.sync_outlined),
          ),
          selectedIcon: Badge(
            isLabelVisible: appState.pendingSyncCount > 0,
            label: Text('${appState.pendingSyncCount}'),
            backgroundColor: AppColors.syncPending,
            child: const Icon(Icons.sync_rounded, color: AppColors.primary),
          ),
          label: 'Sinkron',
        ),
        const NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon:
              Icon(Icons.person_rounded, color: AppColors.primary),
          label: 'Profil',
        ),
      ],
    );
  }

  Widget _buildStudentNavBar(int activeIndex) {
    return NavigationBar(
      selectedIndex: activeIndex,
      onDestinationSelected: _onTabSelected,
      backgroundColor: Colors.white,
      indicatorColor: AppColors.secondary.withValues(alpha: 0.12),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon:
              Icon(Icons.dashboard_rounded, color: AppColors.secondary),
          label: 'Beranda',
        ),
        NavigationDestination(
          icon: Icon(Icons.calendar_month_outlined),
          selectedIcon:
              Icon(Icons.calendar_month_rounded, color: AppColors.secondary),
          label: 'Jadwal',
        ),
        NavigationDestination(
          icon: Icon(Icons.assignment_outlined),
          selectedIcon:
              Icon(Icons.assignment_rounded, color: AppColors.secondary),
          label: 'Izin',
        ),
        NavigationDestination(
          icon: Icon(Icons.history_edu_outlined),
          selectedIcon:
              Icon(Icons.history_edu_rounded, color: AppColors.secondary),
          label: 'Riwayat',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon:
              Icon(Icons.person_rounded, color: AppColors.secondary),
          label: 'Profil',
        ),
      ],
    );
  }
}
