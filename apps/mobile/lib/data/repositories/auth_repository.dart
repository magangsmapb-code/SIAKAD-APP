import '../models/user_model.dart';
import '../mock/mock_data.dart';

abstract class AuthRepository {
  Future<User?> getCurrentUser();
  Future<User> login({
    required String identifier,
    required String password,
    required UserRole role,
  });
  Future<void> logout();
  Future<bool> requestPasswordReset(String identifier);
}

class MockAuthRepository implements AuthRepository {
  User? _currentUser = MockData.teacherUser;

  @override
  Future<User?> getCurrentUser() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return _currentUser;
  }

  @override
  Future<User> login({
    required String identifier,
    required String password,
    required UserRole role,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    if (role == UserRole.guru) {
      _currentUser = MockData.teacherUser;
      return MockData.teacherUser;
    } else {
      _currentUser = MockData.studentUser;
      return MockData.studentUser;
    }
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _currentUser = null;
  }

  @override
  Future<bool> requestPasswordReset(String identifier) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return true;
  }
}
