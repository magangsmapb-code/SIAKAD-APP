import 'package:flutter/material.dart';
import '../core/network/api_config.dart';
import '../core/network/api_exceptions.dart';
import '../data/models/user_model.dart';
import '../data/models/schedule_model.dart';
import '../data/models/attendance_model.dart';
import '../data/models/permission_model.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/attendance_repository.dart';
import '../data/repositories/schedule_repository.dart';
import '../data/repositories/permission_repository.dart';
import '../data/repositories/dashboard_repository.dart';
import '../data/repositories/api_auth_repository.dart';
import '../data/repositories/offline_first_attendance_repository.dart';
import '../data/repositories/api_schedule_repository.dart';
import '../data/repositories/api_permission_repository.dart';

class AppState extends ChangeNotifier {
  final AuthRepository _authRepo;
  final AttendanceRepository _attendanceRepo;
  final ScheduleRepository _scheduleRepo;
  final PermissionRepository _permissionRepo;
  final DashboardRepository _dashboardRepo;

  AppState({
    AuthRepository? authRepo,
    AttendanceRepository? attendanceRepo,
    ScheduleRepository? scheduleRepo,
    PermissionRepository? permissionRepo,
    DashboardRepository? dashboardRepo,
  })  : _authRepo = authRepo ??
            (ApiConfig.isDemoMode
                ? MockAuthRepository()
                : ApiAuthRepository()),
        _attendanceRepo = attendanceRepo ??
            (ApiConfig.isDemoMode
                ? MockAttendanceRepository()
                : OfflineFirstAttendanceRepository()),
        _scheduleRepo = scheduleRepo ??
            (ApiConfig.isDemoMode
                ? MockScheduleRepository()
                : ApiScheduleRepository()),
        _permissionRepo = permissionRepo ??
            (ApiConfig.isDemoMode
                ? MockPermissionRepository()
                : ApiPermissionRepository()),
        _dashboardRepo = dashboardRepo ??
            (ApiConfig.isDemoMode
                ? MockDashboardRepository()
                : ApiDashboardRepository());

  User? _currentUser;
  bool _isLoading = false;
  bool _isOnline = true;
  ThemeMode _themeMode = ThemeMode.system;
  String? _lastErrorMessage;

  List<AttendanceSession> _sessions = [];
  List<ScheduleItem> _teacherSchedules = [];
  List<ScheduleItem> _studentSchedules = [];
  List<AttendanceRecord> _studentHistory = [];
  List<PermissionItem> _studentPermissions = [];
  Map<String, dynamic> _dashboardSummary = {};

  // Getters
  User? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;
  bool get isLoading => _isLoading;
  bool get isOnline => _isOnline;
  bool get isDemoMode => ApiConfig.isDemoMode;
  ThemeMode get themeMode => _themeMode;
  UserRole get currentRole => _currentUser?.role ?? UserRole.guru;
  String? get lastErrorMessage => _lastErrorMessage;

  List<AttendanceSession> get sessions => _sessions;
  List<AttendanceSession> get pendingSyncSessions =>
      _sessions.where((s) => !s.isSynced || s.isLocalDraft).toList();
  int get pendingSyncCount => pendingSyncSessions.length;

  List<ScheduleItem> get teacherSchedules => _teacherSchedules;
  List<ScheduleItem> get studentSchedules => _studentSchedules;
  List<AttendanceRecord> get studentHistory => _studentHistory;
  List<PermissionItem> get studentPermissions => _studentPermissions;
  Map<String, dynamic> get dashboardSummary => _dashboardSummary;

  // Student specific statistics
  int get studentTotalSessions =>
      _dashboardSummary['totalSessions'] ?? _studentHistory.length;
  int get studentHadirCount =>
      _dashboardSummary['hadir'] ??
      _studentHistory.where((r) => r.status == AttendanceStatus.hadir).length;
  int get studentTerlambatCount =>
      _dashboardSummary['terlambat'] ??
      _studentHistory
          .where((r) => r.status == AttendanceStatus.terlambat)
          .length;
  int get studentSakitCount =>
      _dashboardSummary['sakit'] ??
      _studentHistory.where((r) => r.status == AttendanceStatus.sakit).length;
  int get studentIzinCount =>
      _dashboardSummary['izin'] ??
      _studentHistory.where((r) => r.status == AttendanceStatus.izin).length;
  int get studentAlpaCount =>
      _dashboardSummary['alpa'] ??
      _studentHistory.where((r) => r.status == AttendanceStatus.alpa).length;

  double get studentAttendanceRate {
    if (_dashboardSummary.containsKey('attendancePercentage')) {
      final val = _dashboardSummary['attendancePercentage'];
      if (val is num) return val.toDouble();
    }
    if (_studentHistory.isEmpty) return 0.0;
    final valid = studentHadirCount + studentTerlambatCount;
    return (valid / _studentHistory.length) * 100.0;
  }

  // Teacher today attendance summary
  int get todayClassesTotal => _sessions.length;
  int get todayClassesDone =>
      _sessions.where((s) => s.status == SessionStatus.sudahDisimpan).length;
  int get todayClassesPending =>
      _sessions.where((s) => s.status != SessionStatus.sudahDisimpan).length;

  // Initialize data
  Future<void> init() async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _authRepo.getCurrentUser();
      if (_currentUser != null) {
        await _loadRoleData();
      }
    } catch (e) {
      _lastErrorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadRoleData() async {
    if (_currentUser == null) return;

    try {
      if (_currentUser!.isGuru) {
        _sessions = await _attendanceRepo.getSessions(
          teacherNip: _currentUser!.identifier,
        );
        _teacherSchedules = await _scheduleRepo.getTeacherSchedules(
          _currentUser!.identifier,
        );
      } else {
        _studentSchedules = await _scheduleRepo.getStudentSchedules(
          _currentUser!.id,
          _currentUser!.className ?? 'X MIPA 1',
        );
        _studentHistory = await _attendanceRepo.getStudentAttendanceHistory(
          _currentUser!.id,
        );
        _studentPermissions = await _permissionRepo.getStudentPermissions(
          _currentUser!.id,
        );
      }

      // Try loading dashboard summary
      try {
        _dashboardSummary = await _dashboardRepo.getSummary();
      } catch (_) {}
    } catch (e) {
      _lastErrorMessage = e.toString();
    }
  }

  // Demo Role Switching (Restricted to explicit demo mode only)
  Future<void> switchRole(UserRole newRole) async {
    if (!ApiConfig.isDemoMode) {
      throw const ForbiddenException(
        'Ganti peran hanya diizinkan pada lingkungan Demo / Development.',
      );
    }

    _isLoading = true;
    notifyListeners();

    if (newRole == UserRole.guru) {
      _currentUser = await _authRepo.login(
        identifier: '198403152009032008',
        password: 'password123',
        role: UserRole.guru,
      );
    } else {
      _currentUser = await _authRepo.login(
        identifier: '2401',
        password: 'password123',
        role: UserRole.siswa,
      );
    }

    await _loadRoleData();
    _isLoading = false;
    notifyListeners();
  }

  // Authentication
  Future<bool> login({
    required String identifier,
    required String password,
    required UserRole role,
  }) async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _authRepo.login(
        identifier: identifier,
        password: password,
        role: role,
      );
      await _loadRoleData();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _lastErrorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authRepo.logout();
    _currentUser = null;
    _sessions = [];
    _teacherSchedules = [];
    _studentSchedules = [];
    _studentHistory = [];
    _studentPermissions = [];
    _dashboardSummary = {};

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> requestPasswordReset(String identifier) async {
    return await _authRepo.requestPasswordReset(identifier);
  }

  // Theme & Network controls
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void toggleOnlineStatus() {
    _isOnline = !_isOnline;
    notifyListeners();
  }

  // Attendance management (Teacher)
  AttendanceSession? getSessionById(String id) {
    try {
      return _sessions.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  void updateStudentStatus(
    String sessionId,
    String studentId,
    AttendanceStatus status, {
    String? notes,
  }) {
    final sIdx = _sessions.indexWhere((s) => s.id == sessionId);
    if (sIdx == -1) return;

    final session = _sessions[sIdx];
    final updatedEntries = session.entries.map((entry) {
      if (entry.studentId == studentId) {
        return entry.copyWith(status: status, notes: notes ?? entry.notes);
      }
      return entry;
    }).toList();

    _sessions[sIdx] = session.copyWith(
      entries: updatedEntries,
      isLocalDraft: true,
      isSynced: false,
      updatedAt: DateTime.now(),
    );
    notifyListeners();
  }

  void markAllPresent(String sessionId) {
    final sIdx = _sessions.indexWhere((s) => s.id == sessionId);
    if (sIdx == -1) return;

    final session = _sessions[sIdx];
    final updatedEntries = session.entries.map((entry) {
      // Explicit teacher bulk action: only fill students not yet marked
      if (entry.status == AttendanceStatus.belumDiisi) {
        return entry.copyWith(status: AttendanceStatus.hadir);
      }
      return entry;
    }).toList();

    _sessions[sIdx] = session.copyWith(
      entries: updatedEntries,
      isLocalDraft: true,
      isSynced: false,
      updatedAt: DateTime.now(),
    );
    notifyListeners();
  }

  Future<AttendanceSession> saveDraft(String sessionId) async {
    final session = getSessionById(sessionId);
    if (session == null) throw Exception('Sesi tidak ditemukan');

    final updated = await _attendanceRepo.saveDraft(session);
    final idx = _sessions.indexWhere((s) => s.id == sessionId);
    if (idx != -1) {
      _sessions[idx] = updated;
    }
    notifyListeners();
    return updated;
  }

  Future<AttendanceSession> submitAttendance(String sessionId) async {
    final session = getSessionById(sessionId);
    if (session == null) throw Exception('Sesi tidak ditemukan');

    final updated = await _attendanceRepo.submitSession(session);
    final idx = _sessions.indexWhere((s) => s.id == sessionId);
    if (idx != -1) {
      _sessions[idx] = updated;
    }
    notifyListeners();
    return updated;
  }

  Future<int> syncPendingSessions() async {
    if (!_isOnline) return 0;
    _isLoading = true;
    notifyListeners();

    try {
      final count = await _attendanceRepo.syncAllPending();
      _sessions = await _attendanceRepo.getSessions(
        teacherNip: _currentUser?.identifier,
      );
      return count;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Permission submission (Student)
  Future<PermissionItem> submitPermission({
    required PermissionType type,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? attachmentName,
  }) async {
    if (_currentUser == null) throw Exception('User belum login');

    final newPerm = PermissionItem(
      id: 'perm_${DateTime.now().millisecondsSinceEpoch}',
      studentId: _currentUser!.id,
      studentName: _currentUser!.name,
      nis: _currentUser!.identifier,
      className: _currentUser!.className ?? 'X MIPA 1',
      type: type,
      startDate: startDate,
      endDate: endDate,
      reason: reason,
      attachmentName: attachmentName,
      status: PermissionStatus.menunggu,
      submittedAt: DateTime.now(),
    );

    final result = await _permissionRepo.submitPermission(newPerm);
    _studentPermissions = await _permissionRepo.getStudentPermissions(
      _currentUser!.id,
    );
    notifyListeners();
    return result;
  }
}

class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required AppState super.notifier,
    required super.child,
  });

  static AppState of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'No AppStateScope found in context');
    return scope!.notifier!;
  }
}

extension AppStateExtension on BuildContext {
  AppState get state => AppStateScope.of(this);
}
