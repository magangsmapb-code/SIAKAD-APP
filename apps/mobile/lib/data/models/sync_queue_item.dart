enum SyncStatus {
  pending,
  syncing,
  synced,
  failed;

  String get label {
    switch (this) {
      case SyncStatus.pending:
        return 'Menunggu Sinkronisasi';
      case SyncStatus.syncing:
        return 'Sedang Mengirim...';
      case SyncStatus.synced:
        return 'Tersinkron';
      case SyncStatus.failed:
        return 'Gagal Terkirim';
    }
  }
}

class SyncQueueItem {
  final String operationId;
  final String type;
  final String sessionId;
  final Map<String, dynamic> payload;
  final SyncStatus status;
  final DateTime createdAt;
  final int retryCount;
  final String? lastError;
  final DateTime? lastAttemptAt;

  const SyncQueueItem({
    required this.operationId,
    required this.type,
    required this.sessionId,
    required this.payload,
    this.status = SyncStatus.pending,
    required this.createdAt,
    this.retryCount = 0,
    this.lastError,
    this.lastAttemptAt,
  });

  bool get canRetry => retryCount < 5;

  SyncQueueItem copyWith({
    String? operationId,
    String? type,
    String? sessionId,
    Map<String, dynamic>? payload,
    SyncStatus? status,
    DateTime? createdAt,
    int? retryCount,
    String? lastError,
    DateTime? lastAttemptAt,
  }) {
    return SyncQueueItem(
      operationId: operationId ?? this.operationId,
      type: type ?? this.type,
      sessionId: sessionId ?? this.sessionId,
      payload: payload ?? this.payload,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'operationId': operationId,
      'type': type,
      'sessionId': sessionId,
      'payload': payload,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'retryCount': retryCount,
      'lastError': lastError,
      'lastAttemptAt': lastAttemptAt?.toIso8601String(),
    };
  }

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      operationId: json['operationId'] as String,
      type: json['type'] as String,
      sessionId: json['sessionId'] as String,
      payload: Map<String, dynamic>.from(json['payload'] as Map),
      status: SyncStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => SyncStatus.pending,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
      lastError: json['lastError'] as String?,
      lastAttemptAt: json['lastAttemptAt'] != null
          ? DateTime.tryParse(json['lastAttemptAt'] as String)
          : null,
    );
  }
}
