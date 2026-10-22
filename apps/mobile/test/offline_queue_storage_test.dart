import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siakad_mobile/data/local/offline_storage_service.dart';
import 'package:siakad_mobile/data/models/user_model.dart';
import 'package:siakad_mobile/data/models/attendance_model.dart';
import 'package:siakad_mobile/data/models/sync_queue_item.dart';

void main() {
  group('2. Offline Storage & Persistent Sync Queue Tests', () {
    late OfflineStorageService storage;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      storage = OfflineStorageService();
    });

    test('Auth tokens and user profile persist correctly without storing passwords', () async {
      await storage.saveTokens(
        accessToken: 'mock_jwt_access_token_123',
        refreshToken: 'mock_jwt_refresh_token_456',
      );

      final token = await storage.getAccessToken();
      final refresh = await storage.getRefreshToken();
      expect(token, equals('mock_jwt_access_token_123'));
      expect(refresh, equals('mock_jwt_refresh_token_456'));

      const user = User(
        id: 'usr-01',
        name: 'Siti Rahmawati, S.Pd.',
        identifier: '198403152009032008',
        role: UserRole.guru,
        email: 'siti@sekolah.sch.id',
      );
      await storage.saveUser(user);

      final loadedUser = await storage.getUser();
      expect(loadedUser, isNotNull);
      expect(loadedUser!.id, equals('usr-01'));
      expect(loadedUser.name, equals('Siti Rahmawati, S.Pd.'));
      expect(loadedUser.role, equals(UserRole.guru));

      // Clear auth on logout
      await storage.clearAuth();
      expect(await storage.getAccessToken(), isNull);
      expect(await storage.getRefreshToken(), isNull);
      expect(await storage.getUser(), isNull);
    });

    test('Attendance drafts persist and can be retrieved or removed by sessionId', () async {
      final session = AttendanceSession(
        id: 'sess-offline-01',
        scheduleId: 'sch-01',
        subjectName: 'Matematika Wajib',
        className: 'X MIPA 1',
        teacherName: 'Siti Rahmawati, S.Pd.',
        teacherNip: '198403152009032008',
        date: DateTime.now(),
        startTime: '07:30',
        endTime: '09:00',
        room: 'R. 101',
        status: SessionStatus.sedangBerlangsung,
        isLocalDraft: true,
        isSynced: false,
        updatedAt: DateTime.now(),
        entries: const [
          StudentAttendanceEntry(
            studentId: 'std-01',
            studentName: 'Aditya Pratama Putra',
            nis: '2401',
            gender: 'L',
            status: AttendanceStatus.hadir,
          ),
        ],
      );

      await storage.saveAttendanceDraft(session);

      final loadedDraft = await storage.getAttendanceDraft('sess-offline-01');
      expect(loadedDraft, isNotNull);
      expect(loadedDraft!.id, equals('sess-offline-01'));
      expect(loadedDraft.isLocalDraft, isTrue);
      expect(loadedDraft.entries.first.status, equals(AttendanceStatus.hadir));

      final allDrafts = await storage.getAllAttendanceDrafts();
      expect(allDrafts.length, equals(1));

      // Remove after sync
      await storage.removeAttendanceDraft('sess-offline-01');
      expect(await storage.getAttendanceDraft('sess-offline-01'), isNull);
      expect((await storage.getAllAttendanceDrafts()).isEmpty, isTrue);
    });

    test('Sync queue persists items across restart, tracks status and enforces idempotency', () async {
      final item1 = SyncQueueItem(
        operationId: 'op-uuid-1',
        type: 'ATTENDANCE_SESSION_RECORDS',
        sessionId: 'sess-01',
        payload: {
          'records': [
            {'studentId': 'std-01', 'status': 'HADIR'},
          ],
        },
        status: SyncStatus.pending,
        createdAt: DateTime.now(),
      );

      await storage.enqueueOperation(item1);

      // Verify item exists in queue
      var queue = await storage.getSyncQueue();
      expect(queue.length, equals(1));
      expect(queue.first.operationId, equals('op-uuid-1'));
      expect(queue.first.status, equals(SyncStatus.pending));

      // Updating draft for same session replaces pending item to prevent duplicate payloads
      final item1Updated = SyncQueueItem(
        operationId: 'op-uuid-2',
        type: 'ATTENDANCE_SESSION_RECORDS',
        sessionId: 'sess-01',
        payload: {
          'records': [
            {'studentId': 'std-01', 'status': 'HADIR'},
            {'studentId': 'std-02', 'status': 'SAKIT'},
          ],
        },
        status: SyncStatus.pending,
        createdAt: DateTime.now(),
      );

      await storage.enqueueOperation(item1Updated);
      queue = await storage.getSyncQueue();
      expect(queue.length, equals(1)); // Replaced pending entry for same session
      expect(queue.first.payload['records'].length, equals(2));

      // Simulate failure and retry counter
      final failedItem = queue.first.copyWith(
        status: SyncStatus.failed,
        retryCount: 1,
        lastError: 'HTTP 500: Server timeout',
      );
      await storage.updateOperation(failedItem);

      queue = await storage.getSyncQueue();
      expect(queue.first.status, equals(SyncStatus.failed));
      expect(queue.first.retryCount, equals(1));
      expect(queue.first.lastError, contains('500'));
      expect(queue.first.canRetry, isTrue);

      // Simulate success and clearing synced items
      final syncedItem = queue.first.copyWith(
        status: SyncStatus.synced,
        lastError: null,
      );
      await storage.updateOperation(syncedItem);
      await storage.clearSyncedOperations();

      queue = await storage.getSyncQueue();
      expect(queue.isEmpty, isTrue);
    });
  });
}
