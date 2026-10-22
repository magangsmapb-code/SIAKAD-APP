import '../models/permission_model.dart';
import '../mock/mock_data.dart';

abstract class PermissionRepository {
  Future<List<PermissionItem>> getStudentPermissions(String studentId);
  Future<PermissionItem> submitPermission(PermissionItem permission);
  Future<List<PermissionItem>> getAllPermissions();
}

class MockPermissionRepository implements PermissionRepository {
  final List<PermissionItem> _permissions = List.from(MockData.studentPermissions);

  @override
  Future<List<PermissionItem>> getStudentPermissions(String studentId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _permissions.where((p) => p.studentId == studentId).toList();
  }

  @override
  Future<PermissionItem> submitPermission(PermissionItem permission) async {
    await Future.delayed(const Duration(milliseconds: 400));
    _permissions.insert(0, permission);
    return permission;
  }

  @override
  Future<List<PermissionItem>> getAllPermissions() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return List.from(_permissions);
  }
}
