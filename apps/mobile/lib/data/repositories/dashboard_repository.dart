import '../../core/network/api_client.dart';

abstract class DashboardRepository {
  Future<Map<String, dynamic>> getSummary();
  Future<List<dynamic>> getAttendanceTrends({int days = 7});
  Future<List<dynamic>> getClassStatistics();
}

class ApiDashboardRepository implements DashboardRepository {
  final ApiClient _apiClient;

  ApiDashboardRepository({
    ApiClient? apiClient,
  })  : _apiClient = apiClient ?? ApiClient();

  @override
  Future<Map<String, dynamic>> getSummary() async {
    try {
      final res = await _apiClient.get('/dashboard/summary');
      final data = res is Map && res.containsKey('data') ? res['data'] : res;
      if (data is Map<String, dynamic>) {
        return data;
      }
      return {};
    } catch (_) {
      return {};
    }
  }

  @override
  Future<List<dynamic>> getAttendanceTrends({int days = 7}) async {
    try {
      final res = await _apiClient.get('/dashboard/attendance-trends', queryParams: {'days': '$days'});
      final data = res is Map && res.containsKey('data') ? res['data'] : res;
      if (data is List) return data;
      return [];
    } catch (_) {
      return [];
    }
  }

  @override
  Future<List<dynamic>> getClassStatistics() async {
    try {
      final res = await _apiClient.get('/dashboard/class-statistics');
      final data = res is Map && res.containsKey('data') ? res['data'] : res;
      if (data is List) return data;
      return [];
    } catch (_) {
      return [];
    }
  }
}

class MockDashboardRepository implements DashboardRepository {
  @override
  Future<Map<String, dynamic>> getSummary() async {
    await Future.delayed(const Duration(milliseconds: 150));
    return {
      'totalSessions': 18,
      'attendancePercentage': 94.4,
      'hadir': 17,
      'sakit': 1,
      'izin': 0,
      'alpa': 0,
      'terlambat': 0,
      'pendingPermissions': 1,
    };
  }

  @override
  Future<List<dynamic>> getAttendanceTrends({int days = 7}) async {
    return [];
  }

  @override
  Future<List<dynamic>> getClassStatistics() async {
    return [];
  }
}
