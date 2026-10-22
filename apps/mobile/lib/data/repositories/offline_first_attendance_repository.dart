import 'package:uuid/uuid.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exceptions.dart';
import '../local/offline_storage_service.dart';
import '../models/attendance_model.dart';
import '../models/sync_queue_item.dart';
import 'attendance_repository.dart';

class OfflineFirstAttendanceRepository implements AttendanceRepository {
  final ApiClient _apiClient;
  final OfflineStorageService _storage;
  final Uuid _uuid;

  OfflineFirstAttendanceRepository({
    ApiClient? apiClient,
    OfflineStorageService? storage,
    Uuid? uuid,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? OfflineStorageService(),
        _uuid = uuid ?? const Uuid();

  @override
  Future<List<AttendanceSession>> getSessions({
    DateTime? date,
    String? teacherNip,
  }) async {
    final queryParams = <String, String>{
      'limit': '50',
    };
    if (date != null) {
      final y = date.year.toString().padLeft(4, '0');
      final m = date.month.toString().padLeft(2, '0');
      final d = date.day.toString().padLeft(2, '0');
      queryParams['date'] = '$y-$m-$d';
    }

    try {
      final res = await _apiClient.get(
        '/attendance/sessions',
        queryParams: queryParams,
      );

      final List<dynamic> rawList;
      if (res is Map && res.containsKey('data')) {
        rawList = res['data'] as List<dynamic>? ?? [];
      } else if (res is List) {
        rawList = res;
      } else {
        rawList = [];
      }

      final serverSessions = rawList
          .map((json) => AttendanceSession.fromApiJson(json as Map<String, dynamic>))
          .toList();

      // Merge with local drafts
      final drafts = await _storage.getAllAttendanceDrafts();
      final mergedSessions = <AttendanceSession>[];

      for (final s in serverSessions) {
        final draftIdx = drafts.indexWhere((d) => d.id == s.id);
        if (draftIdx != -1) {
          mergedSessions.add(drafts[draftIdx]);
        } else {
          mergedSessions.add(s);
        }
      }

      // Add any drafts not present in server response
      for (final d in drafts) {
        if (!mergedSessions.any((m) => m.id == d.id)) {
          mergedSessions.add(d);
        }
      }

      // Update cache
      await _storage.cacheSessions(mergedSessions);
      return mergedSessions;
    } catch (_) {
      // Fallback to offline cache and drafts
      final cached = await _storage.getCachedSessions();
      final drafts = await _storage.getAllAttendanceDrafts();
      final merged = <AttendanceSession>[];

      for (final c in cached) {
        final dIdx = drafts.indexWhere((d) => d.id == c.id);
        if (dIdx != -1) {
          merged.add(drafts[dIdx]);
        } else {
          merged.add(c);
        }
      }
      for (final d in drafts) {
        if (!merged.any((m) => m.id == d.id)) {
          merged.add(d);
        }
      }
      return merged;
    }
  }

  @override
  Future<AttendanceSession?> getSessionById(String id) async {
    // Check local draft first
    final draft = await _storage.getAttendanceDraft(id);
    if (draft != null) {
      return draft;
    }

    try {
      final res = await _apiClient.get('/attendance/sessions/$id');
      final data = res is Map && res.containsKey('data') ? res['data'] : res;
      if (data is Map<String, dynamic>) {
        // Construct session with active class students and existing records
        final session = AttendanceSession.fromApiJson(data);

        // If records did not include all class students, merge from schoolClass.students
        final schoolClass = data['schoolClass'] as Map<String, dynamic>?;
        final classStudents = schoolClass?['students'] as List<dynamic>? ?? [];

        if (classStudents.isNotEmpty) {
          final existingEntries = List<StudentAttendanceEntry>.from(session.entries);
          for (final s in classStudents) {
            final studId = s['id'] as String;
            final hasEntry = existingEntries.any((e) => e.studentId == studId);
            if (!hasEntry) {
              existingEntries.add(StudentAttendanceEntry(
                studentId: studId,
                studentName: s['fullName'] ?? 'Siswa',
                nis: s['nis'] ?? '',
                gender: s['gender'] ?? 'L',
                status: AttendanceStatus.belumDiisi,
              ));
            }
          }
          return session.copyWith(entries: existingEntries);
        }

        return session;
      }
      return null;
    } catch (_) {
      // Offline fallback: check cached sessions
      final cachedList = await _storage.getCachedSessions();
      try {
        return cachedList.firstWhere((s) => s.id == id);
      } catch (_) {
        return null;
      }
    }
  }

  @override
  Future<AttendanceSession> saveDraft(AttendanceSession session) async {
    final updated = session.copyWith(
      isLocalDraft: true,
      isSynced: false,
      status: SessionStatus.sedangBerlangsung,
      updatedAt: DateTime.now(),
    );

    // 1. Save draft to local storage
    await _storage.saveAttendanceDraft(updated);

    // 2. Prepare payload for idempotency sync queue
    final recordsPayload = updated.entries
        .where((e) => e.status != AttendanceStatus.belumDiisi)
        .map((e) => {
              'studentId': e.studentId,
              'status': e.status.toBackendString(),
              'notes': e.notes,
              'method': 'MANUAL_TEACHER',
            })
        .toList();

    final queueItem = SyncQueueItem(
      operationId: _uuid.v4(),
      type: 'ATTENDANCE_SESSION_RECORDS',
      sessionId: updated.id,
      payload: {'records': recordsPayload},
      status: SyncStatus.pending,
      createdAt: DateTime.now(),
    );

    // 3. Enqueue operation to persistent sync queue
    await _storage.enqueueOperation(queueItem);

    return updated;
  }

  @override
  Future<AttendanceSession> submitSession(AttendanceSession session) async {
    final recordsPayload = session.entries
        .where((e) => e.status != AttendanceStatus.belumDiisi)
        .map((e) => {
              'studentId': e.studentId,
              'status': e.status.toBackendString(),
              'notes': e.notes,
              'method': 'MANUAL_TEACHER',
            })
        .toList();

    try {
      // Attempt direct online sync
      await _apiClient.post(
        '/attendance/sessions/${session.id}/records',
        body: {'records': recordsPayload},
      );

      // Successfully confirmed by server
      final syncedSession = session.copyWith(
        isLocalDraft: false,
        isSynced: true,
        status: SessionStatus.sudahDisimpan,
        updatedAt: DateTime.now(),
      );

      await _storage.removeAttendanceDraft(session.id);
      return syncedSession;
    } on ApiException catch (e) {
      if (e is NetworkException) {
        // Device is offline: save draft and keep in queue
        return saveDraft(session);
      }

      // Server explicitly rejected (e.g. 400 session closed, 403 forbidden, 409 conflict, 422)
      final failedQueueItem = SyncQueueItem(
        operationId: _uuid.v4(),
        type: 'ATTENDANCE_SESSION_RECORDS',
        sessionId: session.id,
        payload: {'records': recordsPayload},
        status: SyncStatus.failed,
        createdAt: DateTime.now(),
        lastError: e.message,
      );
      await _storage.enqueueOperation(failedQueueItem);
      rethrow;
    } catch (e) {
      // Other network or connection failure
      return saveDraft(session);
    }
  }

  @override
  Future<List<AttendanceSession>> getPendingSyncSessions() async {
    final queue = await _storage.getSyncQueue();
    final pendingSessionIds = queue
        .where((q) => q.status != SyncStatus.synced)
        .map((q) => q.sessionId)
        .toSet();

    final sessions = <AttendanceSession>[];
    for (final id in pendingSessionIds) {
      final s = await getSessionById(id);
      if (s != null) {
        sessions.add(s);
      }
    }
    return sessions;
  }

  @override
  Future<int> syncAllPending() async {
    final queue = await _storage.getSyncQueue();
    int syncedCount = 0;

    for (final item in queue) {
      if (item.status == SyncStatus.synced || !item.canRetry) {
        continue;
      }

      // Mark syncing
      await _storage.updateOperation(
        item.copyWith(
          status: SyncStatus.syncing,
          lastAttemptAt: DateTime.now(),
        ),
      );

      try {
        await _apiClient.post(
          '/attendance/sessions/${item.sessionId}/records',
          body: item.payload,
        );

        // Mark synced
        await _storage.updateOperation(
          item.copyWith(
            status: SyncStatus.synced,
            lastError: null,
          ),
        );

        await _storage.removeAttendanceDraft(item.sessionId);
        syncedCount++;
      } on ApiException catch (e) {
        await _storage.updateOperation(
          item.copyWith(
            status: SyncStatus.failed,
            retryCount: item.retryCount + 1,
            lastError: e.message,
            lastAttemptAt: DateTime.now(),
          ),
        );
      } catch (e) {
        await _storage.updateOperation(
          item.copyWith(
            status: SyncStatus.pending,
            retryCount: item.retryCount + 1,
            lastError: 'Gagal terhubung ke jaringan: ${e.toString()}',
            lastAttemptAt: DateTime.now(),
          ),
        );
      }
    }

    await _storage.clearSyncedOperations();
    return syncedCount;
  }

  @override
  Future<List<AttendanceRecord>> getStudentAttendanceHistory(
    String studentId,
  ) async {
    try {
      final res = await _apiClient.get(
        '/attendance/sessions',
        queryParams: {'limit': '50'},
      );

      final List<dynamic> rawList;
      if (res is Map && res.containsKey('data')) {
        rawList = res['data'] as List<dynamic>? ?? [];
      } else if (res is List) {
        rawList = res;
      } else {
        rawList = [];
      }

      final records = <AttendanceRecord>[];
      for (final sessionJson in rawList) {
        final sessionId = sessionJson['id'] as String;
        try {
          final detailRes = await _apiClient.get('/attendance/sessions/$sessionId');
          final data = detailRes is Map && detailRes.containsKey('data') ? detailRes['data'] : detailRes;
          if (data is Map<String, dynamic>) {
            final recList = data['records'] as List<dynamic>? ?? [];
            for (final r in recList) {
              if (r['studentId'] == studentId || (r['student'] != null && r['student']['id'] == studentId)) {
                records.add(AttendanceRecord.fromApiJson({
                  ...r as Map<String, dynamic>,
                  'session': data,
                }));
              }
            }
          }
        } catch (_) {}
      }

      return records;
    } catch (_) {
      return [];
    }
  }
}
