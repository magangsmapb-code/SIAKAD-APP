import '../../core/network/api_client.dart';
import '../local/offline_storage_service.dart';
import '../models/permission_model.dart';
import 'permission_repository.dart';

class ApiPermissionRepository implements PermissionRepository {
  final ApiClient _apiClient;
  final OfflineStorageService _storage;

  ApiPermissionRepository({
    ApiClient? apiClient,
    OfflineStorageService? storage,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? OfflineStorageService();

  @override
  Future<List<PermissionItem>> getStudentPermissions(String studentId) async {
    try {
      final res = await _apiClient.get(
        '/permissions',
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

      final items = rawList
          .map((json) => PermissionItem.fromApiJson(json as Map<String, dynamic>))
          .where((p) => p.studentId.isEmpty || p.studentId == studentId)
          .toList();

      await _storage.cachePermissions(studentId, items);
      return items;
    } catch (_) {
      return await _storage.getCachedPermissions(studentId);
    }
  }

  @override
  Future<PermissionItem> submitPermission(PermissionItem permission) async {
    final startStr =
        '${permission.startDate.year}-${permission.startDate.month.toString().padLeft(2, '0')}-${permission.startDate.day.toString().padLeft(2, '0')}';
    final endStr =
        '${permission.endDate.year}-${permission.endDate.month.toString().padLeft(2, '0')}-${permission.endDate.day.toString().padLeft(2, '0')}';

    final body = {
      'type': permission.type.toBackendString(),
      'startDate': startStr,
      'endDate': endStr,
      'reason': permission.reason,
      if (permission.attachmentName != null)
        'attachmentName': permission.attachmentName,
    };

    final res = await _apiClient.post('/permissions', body: body);
    final data = res is Map && res.containsKey('data') ? res['data'] : res;

    if (data is Map<String, dynamic>) {
      return PermissionItem.fromApiJson(data);
    }

    return permission;
  }

  @override
  Future<List<PermissionItem>> getAllPermissions() async {
    try {
      final res = await _apiClient.get('/permissions', queryParams: {'limit': '50'});
      final List<dynamic> rawList;
      if (res is Map && res.containsKey('data')) {
        rawList = res['data'] as List<dynamic>? ?? [];
      } else if (res is List) {
        rawList = res;
      } else {
        rawList = [];
      }

      return rawList
          .map((json) => PermissionItem.fromApiJson(json as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
