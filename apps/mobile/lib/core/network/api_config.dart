import 'package:flutter/foundation.dart';

class ApiConfig {
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');
  
  /// Explicit demo mode configured during compilation/launch.
  /// Demo mode is NOT an automatic fallback on network errors.
  static const bool isDemoMode = bool.fromEnvironment('DEMO_MODE', defaultValue: false);

  static String? _customBaseUrl;

  /// Allows user or developer to configure a custom API URL at runtime (e.g., physical device testing)
  static void setCustomBaseUrl(String? url) {
    _customBaseUrl = url?.trim();
  }
  static String get baseUrl {
    final url = () {
      if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
        return _customBaseUrl!;
      }
      if (_envBaseUrl.isNotEmpty) {
        return _envBaseUrl;
      }
      if (kIsWeb) {
        return 'http://localhost:4000/api/v1';
      }
      if (defaultTargetPlatform == TargetPlatform.android) {
        // Android emulator maps 10.0.2.2 to host machine's 127.0.0.1
        return 'http://10.0.2.2:4000/api/v1';
      }
      return 'http://localhost:4000/api/v1';
    }();

    if (kReleaseMode && url.startsWith('http://') && !url.contains('localhost') && !url.contains('10.0.2.2')) {
      debugPrint('[SECURITY WARNING] Insecure HTTP connection detected in release mode: $url. Production must use HTTPS.');
    }

    return url;
  }

  /// Request timeout in seconds
  static const Duration timeout = Duration(seconds: 15);
}
