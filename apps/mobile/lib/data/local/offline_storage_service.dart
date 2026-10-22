import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/attendance_model.dart';
import '../models/schedule_model.dart';
import '../models/permission_model.dart';
import '../models/sync_queue_item.dart';

class OfflineStorageService {
  static const String _keyAccessToken = 'siakad_auth_access_token';
  static const String _keyRefreshToken = 'siakad_auth_refresh_token';
  static const String _keyCurrentUser = 'siakad_auth_user';
  static const String _keyDraftsPrefix = 'siakad_draft_session_';
  static const String _keyDraftSessionIds = 'siakad_draft_session_ids';
  static const String _keySyncQueue = 'siakad_sync_queue_v1';
  static const String _keyCachedSessions = 'siakad_cache_sessions';
  static const String _keyCachedSchedulesPrefix = 'siakad_cache_schedules_';
  static const String _keyCachedPermissionsPrefix = 'siakad_cache_permissions_';

  final SharedPreferences? _prefs;

  OfflineStorageService([this._prefs]);

  Future<SharedPreferences> _getPrefs() async {
    return _prefs ?? await SharedPreferences.getInstance();
  }

  // ==========================================
  // 1. AUTH & TOKENS
  // ==========================================

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyAccessToken, accessToken);
    await prefs.setString(_keyRefreshToken, refreshToken);
  }

  Future<String?> getAccessToken() async {
    final prefs = await _getPrefs();
    return prefs.getString(_keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    final prefs = await _getPrefs();
    return prefs.getString(_keyRefreshToken);
  }

  Future<void> saveUser(User user) async {
    final prefs = await _getPrefs();
    final jsonStr = jsonEncode(user.toJson());
    await prefs.setString(_keyCurrentUser, jsonStr);
  }

  Future<User?> getUser() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyCurrentUser);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      return User.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearAuth() async {
    final prefs = await _getPrefs();
    await prefs.remove(_keyAccessToken);
    await prefs.remove(_keyRefreshToken);
    await prefs.remove(_keyCurrentUser);
  }

  // ==========================================
  // 2. ATTENDANCE DRAFTS
  // ==========================================

  Future<void> saveAttendanceDraft(AttendanceSession session) async {
    final prefs = await _getPrefs();
    final key = '$_keyDraftsPrefix${session.id}';
    await prefs.setString(key, jsonEncode(session.toJson()));

    // Track list of draft session IDs
    final ids = prefs.getStringList(_keyDraftSessionIds) ?? [];
    if (!ids.contains(session.id)) {
      ids.add(session.id);
      await prefs.setStringList(_keyDraftSessionIds, ids);
    }
  }

  Future<AttendanceSession?> getAttendanceDraft(String sessionId) async {
    final prefs = await _getPrefs();
    final key = '$_keyDraftsPrefix$sessionId';
    final str = prefs.getString(key);
    if (str == null) return null;
    try {
      final map = jsonDecode(str) as Map<String, dynamic>;
      return AttendanceSession.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> removeAttendanceDraft(String sessionId) async {
    final prefs = await _getPrefs();
    final key = '$_keyDraftsPrefix$sessionId';
    await prefs.remove(key);

    final ids = prefs.getStringList(_keyDraftSessionIds) ?? [];
    if (ids.remove(sessionId)) {
      await prefs.setStringList(_keyDraftSessionIds, ids);
    }
  }

  Future<List<AttendanceSession>> getAllAttendanceDrafts() async {
    final prefs = await _getPrefs();
    final ids = prefs.getStringList(_keyDraftSessionIds) ?? [];
    final list = <AttendanceSession>[];
    for (final id in ids) {
      final draft = await getAttendanceDraft(id);
      if (draft != null) {
        list.add(draft);
      }
    }
    return list;
  }

  // ==========================================
  // 3. PERSISTENT SYNC QUEUE
  // ==========================================

  Future<List<SyncQueueItem>> getSyncQueue() async {
    final prefs = await _getPrefs();
    final strList = prefs.getStringList(_keySyncQueue) ?? [];
    final items = <SyncQueueItem>[];
    for (final s in strList) {
      try {
        final map = jsonDecode(s) as Map<String, dynamic>;
        items.add(SyncQueueItem.fromJson(map));
      } catch (_) {}
    }
    return items;
  }

  Future<void> enqueueOperation(SyncQueueItem item) async {
    final prefs = await _getPrefs();
    final queue = await getSyncQueue();

    // Replace if same operationId or same sessionId for attendance records to avoid duplicates
    final existingIdx = queue.indexWhere((q) =>
        q.operationId == item.operationId ||
        (q.type == item.type && q.sessionId == item.sessionId && q.status != SyncStatus.synced));

    if (existingIdx != -1) {
      queue[existingIdx] = item;
    } else {
      queue.add(item);
    }

    final strList = queue.map((e) => jsonEncode(e.toJson())).toList();
    await prefs.setStringList(_keySyncQueue, strList);
  }

  Future<void> updateOperation(SyncQueueItem item) async {
    final prefs = await _getPrefs();
    final queue = await getSyncQueue();
    final idx = queue.indexWhere((q) => q.operationId == item.operationId);
    if (idx != -1) {
      queue[idx] = item;
      final strList = queue.map((e) => jsonEncode(e.toJson())).toList();
      await prefs.setStringList(_keySyncQueue, strList);
    }
  }

  Future<void> removeOperation(String operationId) async {
    final prefs = await _getPrefs();
    final queue = await getSyncQueue();
    queue.removeWhere((q) => q.operationId == operationId);
    final strList = queue.map((e) => jsonEncode(e.toJson())).toList();
    await prefs.setStringList(_keySyncQueue, strList);
  }

  Future<void> clearSyncedOperations() async {
    final prefs = await _getPrefs();
    final queue = await getSyncQueue();
    queue.removeWhere((q) => q.status == SyncStatus.synced);
    final strList = queue.map((e) => jsonEncode(e.toJson())).toList();
    await prefs.setStringList(_keySyncQueue, strList);
  }

  // ==========================================
  // 4. OFFLINE CACHE (SESSIONS, SCHEDULES, PERMISSIONS)
  // ==========================================

  Future<void> cacheSessions(List<AttendanceSession> sessions) async {
    final prefs = await _getPrefs();
    final jsonList = sessions.map((s) => s.toJson()).toList();
    await prefs.setString(_keyCachedSessions, jsonEncode(jsonList));
  }

  Future<List<AttendanceSession>> getCachedSessions() async {
    final prefs = await _getPrefs();
    final str = prefs.getString(_keyCachedSessions);
    if (str == null) return [];
    try {
      final raw = jsonDecode(str) as List<dynamic>;
      return raw.map((e) => AttendanceSession.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> cacheSchedules(String key, List<ScheduleItem> schedules) async {
    final prefs = await _getPrefs();
    final jsonList = schedules.map((s) => s.toJson()).toList();
    await prefs.setString('$_keyCachedSchedulesPrefix$key', jsonEncode(jsonList));
  }

  Future<List<ScheduleItem>> getCachedSchedules(String key) async {
    final prefs = await _getPrefs();
    final str = prefs.getString('$_keyCachedSchedulesPrefix$key');
    if (str == null) return [];
    try {
      final raw = jsonDecode(str) as List<dynamic>;
      return raw.map((e) => ScheduleItem.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> cachePermissions(String studentId, List<PermissionItem> permissions) async {
    final prefs = await _getPrefs();
    final jsonList = permissions.map((p) => p.toJson()).toList();
    await prefs.setString('$_keyCachedPermissionsPrefix$studentId', jsonEncode(jsonList));
  }

  Future<List<PermissionItem>> getCachedPermissions(String studentId) async {
    final prefs = await _getPrefs();
    final str = prefs.getString('$_keyCachedPermissionsPrefix$studentId');
    if (str == null) return [];
    try {
      final raw = jsonDecode(str) as List<dynamic>;
      return raw.map((e) => PermissionItem.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
