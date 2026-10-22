import 'dart:async';
import 'dart:convert';
import 'dart:io' show SocketException;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'api_exceptions.dart';
import '../../data/local/offline_storage_service.dart';

class ApiClient {
  final http.Client _httpClient;
  final OfflineStorageService _storage;
  final VoidCallback? onSessionExpired;

  bool _isRefreshing = false;

  ApiClient({
    http.Client? httpClient,
    OfflineStorageService? storage,
    this.onSessionExpired,
  })  : _httpClient = httpClient ?? http.Client(),
        _storage = storage ?? OfflineStorageService();

  Future<dynamic> get(
    String path, {
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      'GET',
      path,
      queryParams: queryParams,
      headers: headers,
      requiresAuth: requiresAuth,
    );
  }

  Future<dynamic> post(
    String path, {
    dynamic body,
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      'POST',
      path,
      body: body,
      queryParams: queryParams,
      headers: headers,
      requiresAuth: requiresAuth,
    );
  }

  Future<dynamic> put(
    String path, {
    dynamic body,
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      'PUT',
      path,
      body: body,
      queryParams: queryParams,
      headers: headers,
      requiresAuth: requiresAuth,
    );
  }

  Future<dynamic> delete(
    String path, {
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    return _sendRequest(
      'DELETE',
      path,
      queryParams: queryParams,
      headers: headers,
      requiresAuth: requiresAuth,
    );
  }

  Future<dynamic> _sendRequest(
    String method,
    String path, {
    dynamic body,
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    bool requiresAuth = true,
    bool isRetryAfterRefresh = false,
  }) async {
    final baseUrl = ApiConfig.baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    var uri = Uri.parse('$baseUrl$normalizedPath');

    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };

    if (requiresAuth) {
      final token = await _storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        reqHeaders['Authorization'] = 'Bearer $token';
      }
    }

    // Log request sanitized (NO passwords or tokens logged)
    if (kDebugMode) {
      final safeHeaders = Map<String, String>.from(reqHeaders);
      if (safeHeaders.containsKey('Authorization')) {
        safeHeaders['Authorization'] = 'Bearer ***';
      }
      debugPrint('[HTTP] $method $uri (Headers: $safeHeaders)');
    }

    http.Response response;
    try {
      final bodyStr = body != null ? jsonEncode(body) : null;
      switch (method) {
        case 'GET':
          response = await _httpClient
              .get(uri, headers: reqHeaders)
              .timeout(ApiConfig.timeout);
          break;
        case 'POST':
          response = await _httpClient
              .post(uri, headers: reqHeaders, body: bodyStr)
              .timeout(ApiConfig.timeout);
          break;
        case 'PUT':
          response = await _httpClient
              .put(uri, headers: reqHeaders, body: bodyStr)
              .timeout(ApiConfig.timeout);
          break;
        case 'DELETE':
          response = await _httpClient
              .delete(uri, headers: reqHeaders)
              .timeout(ApiConfig.timeout);
          break;
        default:
          throw ApiException('Metode HTTP $method tidak didukung.');
      }
    } on TimeoutException {
      throw const NetworkException('Permintaan melebihi batas waktu (timeout). Periksa jaringan Anda.');
    } on SocketException {
      throw const NetworkException('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw NetworkException('Koneksi jaringan terputus: ${e.toString()}');
    }

    if (kDebugMode) {
      debugPrint('[HTTP] ${response.statusCode} $uri');
    }

    // 401 Interception & Refresh Token logic
    if (response.statusCode == 401 && requiresAuth && !isRetryAfterRefresh) {
      final refreshSuccess = await _tryRefreshToken();
      if (refreshSuccess) {
        return _sendRequest(
          method,
          path,
          body: body,
          queryParams: queryParams,
          headers: headers,
          requiresAuth: requiresAuth,
          isRetryAfterRefresh: true,
        );
      } else {
        await _storage.clearAuth();
        onSessionExpired?.call();
        throw const UnauthorizedException();
      }
    }

    return _handleResponse(response);
  }

  Future<bool> _tryRefreshToken() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/auth/refresh');
      final res = await _httpClient
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refreshToken': refreshToken}),
          )
          .timeout(ApiConfig.timeout);

      if (res.statusCode == 200 || res.statusCode == 201) {
        final decoded = jsonDecode(res.body);
        final data = decoded['data'] ?? decoded;
        final newAccess = data['accessToken'] as String?;
        final newRefresh = data['refreshToken'] as String? ?? refreshToken;

        if (newAccess != null && newAccess.isNotEmpty) {
          await _storage.saveTokens(
            accessToken: newAccess,
            refreshToken: newRefresh,
          );
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  dynamic _handleResponse(http.Response response) {
    dynamic jsonBody;
    try {
      if (response.body.isNotEmpty) {
        jsonBody = jsonDecode(response.body);
      }
    } catch (_) {
      jsonBody = null;
    }

    final statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      return jsonBody;
    }

    String message = 'Terjadi kesalahan (${response.statusCode})';
    if (jsonBody is Map) {
      if (jsonBody['message'] is String) {
        message = jsonBody['message'];
      } else if (jsonBody['message'] is List) {
        message = (jsonBody['message'] as List).join(', ');
      } else if (jsonBody['error'] is String) {
        message = jsonBody['error'];
      }
    }

    switch (statusCode) {
      case 401:
        throw UnauthorizedException(message);
      case 403:
        throw ForbiddenException(message);
      case 404:
        throw NotFoundException(message);
      case 409:
        throw ConflictException(message);
      case 422:
      case 400:
        throw ValidationException(message);
      case 500:
      case 502:
      case 503:
      case 504:
        throw ServerException(message);
      default:
        throw ApiException(message, statusCode: statusCode, details: jsonBody);
    }
  }
}
