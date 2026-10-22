import '../../core/network/api_client.dart';
import '../local/offline_storage_service.dart';
import '../models/schedule_model.dart';
import 'schedule_repository.dart';

class ApiScheduleRepository implements ScheduleRepository {
  final ApiClient _apiClient;
  final OfflineStorageService _storage;

  ApiScheduleRepository({
    ApiClient? apiClient,
    OfflineStorageService? storage,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? OfflineStorageService();

  @override
  Future<List<ScheduleItem>> getTeacherSchedules(String teacherNip) async {
    try {
      final res = await _apiClient.get('/schedules');
      final List<dynamic> rawList;
      if (res is Map && res.containsKey('data')) {
        rawList = res['data'] as List<dynamic>? ?? [];
      } else if (res is List) {
        rawList = res;
      } else {
        rawList = [];
      }

      final items = rawList
          .map((json) => ScheduleItem.fromApiJson(json as Map<String, dynamic>))
          .where((s) => s.teacherNip.isEmpty || s.teacherNip == teacherNip)
          .toList();

      await _storage.cacheSchedules('teacher_$teacherNip', items);
      return items;
    } catch (_) {
      return await _storage.getCachedSchedules('teacher_$teacherNip');
    }
  }

  @override
  Future<List<ScheduleItem>> getStudentSchedules(
    String studentId,
    String className,
  ) async {
    try {
      final res = await _apiClient.get('/schedules');
      final List<dynamic> rawList;
      if (res is Map && res.containsKey('data')) {
        rawList = res['data'] as List<dynamic>? ?? [];
      } else if (res is List) {
        rawList = res;
      } else {
        rawList = [];
      }

      final items = rawList
          .map((json) => ScheduleItem.fromApiJson(json as Map<String, dynamic>))
          .where((s) => s.className.toLowerCase() == className.toLowerCase())
          .toList();

      await _storage.cacheSchedules('student_$studentId', items);
      return items;
    } catch (_) {
      return await _storage.getCachedSchedules('student_$studentId');
    }
  }

  @override
  Future<ScheduleItem?> getScheduleById(String id) async {
    final cached = await _storage.getCachedSchedules('all');
    try {
      return cached.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }
}
