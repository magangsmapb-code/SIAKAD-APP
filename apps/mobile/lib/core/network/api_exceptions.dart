class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  const ApiException(this.message, {this.statusCode, this.details});

  @override
  String toString() => message;
}

class UnauthorizedException extends ApiException {
  const UnauthorizedException([super.message = 'Sesi telah berakhir atau tidak terautentikasi. Silakan masuk kembali.'])
      : super(statusCode: 401);
}

class ForbiddenException extends ApiException {
  const ForbiddenException([super.message = 'Anda tidak memiliki hak akses untuk tindakan ini.'])
      : super(statusCode: 403);
}

class NotFoundException extends ApiException {
  const NotFoundException([super.message = 'Data atau sumber daya yang diminta tidak ditemukan.'])
      : super(statusCode: 404);
}

class ConflictException extends ApiException {
  const ConflictException([super.message = 'Data bertentangan atau telah diperbarui oleh pihak lain.'])
      : super(statusCode: 409);
}

class ValidationException extends ApiException {
  final Map<String, dynamic>? validationErrors;

  const ValidationException(
    super.message, {
    this.validationErrors,
  }) : super(statusCode: 422, details: validationErrors);
}

class ServerException extends ApiException {
  const ServerException([super.message = 'Terjadi kesalahan pada server sekolah. Silakan coba sesaat lagi.'])
      : super(statusCode: 500);
}

class NetworkException extends ApiException {
  const NetworkException([super.message = 'Gagal terhubung ke jaringan. Pastikan perangkat memiliki koneksi internet.'])
      : super(statusCode: null);
}
