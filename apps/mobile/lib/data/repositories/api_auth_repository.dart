import '../../core/network/api_client.dart';
import '../../core/network/api_exceptions.dart';
import '../local/offline_storage_service.dart';
import '../models/user_model.dart';
import 'auth_repository.dart';

class ApiAuthRepository implements AuthRepository {
  final ApiClient _apiClient;
  final OfflineStorageService _storage;

  ApiAuthRepository({
    ApiClient? apiClient,
    OfflineStorageService? storage,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? OfflineStorageService();

  @override
  Future<User?> getCurrentUser() async {
    final cachedUser = await _storage.getUser();
    final token = await _storage.getAccessToken();

    if (token == null || token.isEmpty) {
      return null;
    }

    try {
      final res = await _apiClient.get('/auth/me');
      final data = res is Map && res.containsKey('data') ? res['data'] : res;
      if (data != null && data is Map<String, dynamic>) {
        final serverUser = User.fromApiJson(data);
        await _storage.saveUser(serverUser);
        return serverUser;
      }
      return cachedUser;
    } on UnauthorizedException {
      await _storage.clearAuth();
      return null;
    } catch (_) {
      // Return cached user when device is offline to preserve offline-first access
      return cachedUser;
    }
  }

  @override
  Future<User> login({
    required String identifier,
    required String password,
    required UserRole role,
  }) async {
    final res = await _apiClient.post(
      '/auth/login',
      body: {
        'username': identifier.trim(),
        'password': password,
      },
      requiresAuth: false,
    );

    final data = res is Map && res.containsKey('data') ? res['data'] : res;
    if (data == null || data is! Map<String, dynamic>) {
      throw const ApiException('Format respons autentikasi tidak valid.');
    }

    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final userMap = data['user'] as Map<String, dynamic>?;

    if (accessToken == null || userMap == null) {
      throw const ApiException('Kredensial atau token autentikasi tidak lengkap.');
    }

    // Save tokens and user securely without storing raw password
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken ?? '',
    );

    final user = User.fromApiJson(userMap);
    await _storage.saveUser(user);

    return user;
  }

  @override
  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _apiClient.post(
          '/auth/logout',
          body: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      await _storage.clearAuth();
    }
  }

  @override
  Future<bool> requestPasswordReset(String identifier) async {
    // Backend endpoint or admin notification
    await Future.delayed(const Duration(milliseconds: 300));
    return true;
  }
}
