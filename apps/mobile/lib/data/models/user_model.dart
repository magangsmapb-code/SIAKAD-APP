enum UserRole {
  guru,
  siswa,
  admin,
  orangTua;

  String get label {
    switch (this) {
      case UserRole.guru:
        return 'Guru / Pendidik';
      case UserRole.siswa:
        return 'Siswa';
      case UserRole.admin:
        return 'Administrator';
      case UserRole.orangTua:
        return 'Orang Tua / Wali';
    }
  }

  String get shortLabel {
    switch (this) {
      case UserRole.guru:
        return 'Guru';
      case UserRole.siswa:
        return 'Siswa';
      case UserRole.admin:
        return 'Admin';
      case UserRole.orangTua:
        return 'Wali';
    }
  }
  static UserRole fromBackendString(String? roleStr) {
    if (roleStr == null) return UserRole.guru;
    final upper = roleStr.toUpperCase();
    if (upper == 'TEACHER' || upper == 'GURU') return UserRole.guru;
    if (upper == 'STUDENT' || upper == 'SISWA') return UserRole.siswa;
    if (upper == 'ADMIN' || upper == 'ADMINISTRATOR') return UserRole.admin;
    if (upper == 'PARENT' || upper == 'ORANG_TUA' || upper == 'ORANGTUA') return UserRole.orangTua;
    return UserRole.values.firstWhere(
      (e) => e.name.toLowerCase() == roleStr.toLowerCase(),
      orElse: () => UserRole.guru,
    );
  }

  String toBackendString() {
    switch (this) {
      case UserRole.guru:
        return 'TEACHER';
      case UserRole.siswa:
        return 'STUDENT';
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.orangTua:
        return 'PARENT';
    }
  }
}

class User {
  final String id;
  final String name;
  final String identifier; // NIP for teacher, NIS for student
  final UserRole role;
  final String? email;
  final String? avatarUrl;
  final String? classId;
  final String? className;
  final String? subjectName;
  final String? phone;
  final String? title; // e.g., 'Guru Matematika Wajib & Wali Kelas X MIPA 1'

  const User({
    required this.id,
    required this.name,
    required this.identifier,
    required this.role,
    this.email,
    this.avatarUrl,
    this.classId,
    this.className,
    this.subjectName,
    this.phone,
    this.title,
  });

  bool get isGuru => role == UserRole.guru;
  bool get isSiswa => role == UserRole.siswa;

  User copyWith({
    String? id,
    String? name,
    String? identifier,
    UserRole? role,
    String? email,
    String? avatarUrl,
    String? classId,
    String? className,
    String? subjectName,
    String? phone,
    String? title,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      identifier: identifier ?? this.identifier,
      role: role ?? this.role,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      subjectName: subjectName ?? this.subjectName,
      phone: phone ?? this.phone,
      title: title ?? this.title,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'identifier': identifier,
      'role': role.name,
      'email': email,
      'avatarUrl': avatarUrl,
      'classId': classId,
      'className': className,
      'subjectName': subjectName,
      'phone': phone,
      'title': title,
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      identifier: json['identifier'] as String,
      role: UserRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => UserRole.guru,
      ),
      email: json['email'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      classId: json['classId'] as String?,
      className: json['className'] as String?,
      subjectName: json['subjectName'] as String?,
      phone: json['phone'] as String?,
      title: json['title'] as String?,
    );
  }

  factory User.fromApiJson(Map<String, dynamic> json) {
    final role = UserRole.fromBackendString(json['role'] as String?);
    final teacherProfile = json['teacherProfile'] as Map<String, dynamic>?;
    final studentProfile = json['studentProfile'] as Map<String, dynamic>?;

    String id = json['id'] as String;
    String name = json['fullName'] ?? json['name'] ?? json['username'] ?? '';
    String identifier = json['username'] ?? '';
    String? classId;
    String? className;
    String? phone = json['phone'];
    String? title;

    if (role == UserRole.guru && teacherProfile != null) {
      identifier = teacherProfile['nip'] ?? identifier;
      phone = teacherProfile['phone'] ?? phone;
      title = teacherProfile['academicTitle'] != null
          ? 'Guru (${teacherProfile['academicTitle']})'
          : 'Guru Pengampu';
    } else if (role == UserRole.siswa && studentProfile != null) {
      identifier = studentProfile['nis'] ?? identifier;
      phone = studentProfile['phone'] ?? phone;
      final classMap = studentProfile['class'] as Map<String, dynamic>?;
      if (classMap != null) {
        classId = classMap['id'];
        className = classMap['name'];
      }
    }

    return User(
      id: id,
      name: name,
      identifier: identifier,
      role: role,
      email: json['email'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      classId: classId,
      className: className,
      phone: phone,
      title: title,
    );
  }
}

