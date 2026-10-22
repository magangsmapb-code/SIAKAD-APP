import '../models/attendance_model.dart';
import '../mock/mock_data.dart';

abstract class AttendanceRepository {
  Future<List<AttendanceSession>> getSessions({DateTime? date, String? teacherNip});
  Future<AttendanceSession?> getSessionById(String id);
  Future<AttendanceSession> saveDraft(AttendanceSession session);
  Future<AttendanceSession> submitSession(AttendanceSession session);
  Future<List<AttendanceSession>> getPendingSyncSessions();
  Future<int> syncAllPending();
  Future<List<AttendanceRecord>> getStudentAttendanceHistory(String studentId);
}

class MockAttendanceRepository implements AttendanceRepository {
  List<AttendanceSession> _sessions = MockData.generateInitialSessions();

  @override
  Future<List<AttendanceSession>> getSessions({
    DateTime? date,
    String? teacherNip,
  }) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return List.from(_sessions);
  }

  @override
  Future<AttendanceSession?> getSessionById(String id) async {
    await Future.delayed(const Duration(milliseconds: 150));
    try {
      return _sessions.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<AttendanceSession> saveDraft(AttendanceSession session) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final updated = session.copyWith(
      isLocalDraft: true,
      isSynced: false,
      status: SessionStatus.sedangBerlangsung,
      updatedAt: DateTime.now(),
    );

    final idx = _sessions.indexWhere((s) => s.id == session.id);
    if (idx != -1) {
      _sessions[idx] = updated;
    } else {
      _sessions.add(updated);
    }
    return updated;
  }

  @override
  Future<AttendanceSession> submitSession(AttendanceSession session) async {
    await Future.delayed(const Duration(milliseconds: 400));
    // Determine if complete
    final isComplete = session.belumDiisiCount == 0;
    final updated = session.copyWith(
      isLocalDraft: false,
      isSynced: false, // In queue waiting for sync
      status: isComplete
          ? SessionStatus.sudahDisimpan
          : SessionStatus.perluDiperiksa,
      updatedAt: DateTime.now(),
    );

    final idx = _sessions.indexWhere((s) => s.id == session.id);
    if (idx != -1) {
      _sessions[idx] = updated;
    } else {
      _sessions.add(updated);
    }
    return updated;
  }

  @override
  Future<List<AttendanceSession>> getPendingSyncSessions() async {
    await Future.delayed(const Duration(milliseconds: 150));
    return _sessions.where((s) => !s.isSynced).toList();
  }

  @override
  Future<int> syncAllPending() async {
    await Future.delayed(const Duration(milliseconds: 800));
    int syncedCount = 0;
    _sessions = _sessions.map((s) {
      if (!s.isSynced) {
        syncedCount++;
        return s.copyWith(isSynced: true, isLocalDraft: false);
      }
      return s;
    }).toList();
    return syncedCount;
  }

  @override
  Future<List<AttendanceRecord>> getStudentAttendanceHistory(
    String studentId,
  ) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return List.from(MockData.studentHistoryRecords);
  }
}
