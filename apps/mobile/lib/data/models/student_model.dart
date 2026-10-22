enum Gender {
  l('L', 'Laki-laki'),
  p('P', 'Perempuan');

  final String code;
  final String label;
  const Gender(this.code, this.label);
}

class StudentItem {
  final String id;
  final String nis;
  final String nisn;
  final String name;
  final Gender gender;
  final String className;
  final bool isClassLeader;
  final String? email;
  final String? phone;
  final String? address;
  final bool isActive;

  const StudentItem({
    required this.id,
    required this.nis,
    required this.nisn,
    required this.name,
    required this.gender,
    required this.className,
    this.isClassLeader = false,
    this.email,
    this.phone,
    this.address,
    this.isActive = true,
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  }
}
