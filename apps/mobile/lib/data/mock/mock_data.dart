import '../models/user_model.dart';
import '../models/student_model.dart';
import '../models/schedule_model.dart';
import '../models/attendance_model.dart';
import '../models/permission_model.dart';

class MockData {
  // Demo Users
  static const User teacherUser = User(
    id: 'usr_teacher_01',
    name: 'Siti Rahmawati, S.Pd.',
    identifier: '198403152009032008',
    role: UserRole.guru,
    email: 'siti.rahmawati@smapbngrayun.sch.id',
    avatarUrl: null,
    classId: 'cls_x_mipa_1',
    className: 'X MIPA 1 (Wali Kelas)',
    subjectName: 'Matematika Wajib',
    phone: '0812-3456-7890',
    title: 'Guru Matematika & Wali Kelas X MIPA 1',
  );

  static const User studentUser = User(
    id: 'usr_student_01',
    name: 'Aditya Pratama Putra',
    identifier: '2401', // NIS
    role: UserRole.siswa,
    email: 'aditya.pratama@siswa.smapbngrayun.sch.id',
    avatarUrl: null,
    classId: 'cls_x_mipa_1',
    className: 'X MIPA 1',
    subjectName: null,
    phone: '0857-9876-5432',
    title: 'Siswa Kelas X MIPA 1 • Ketua Kelas',
  );

  // Students of X MIPA 1
  static final List<StudentItem> classStudents = [
    const StudentItem(
      id: 'std_01',
      nis: '2401',
      nisn: '0078912345',
      name: 'Aditya Pratama Putra',
      gender: Gender.l,
      className: 'X MIPA 1',
      isClassLeader: true,
      phone: '0857-9876-5432',
      address: 'Dusun Baosan Lor, Ngrayun',
    ),
    const StudentItem(
      id: 'std_02',
      nis: '2402',
      nisn: '0078912346',
      name: 'Amanda Aurelia Putri',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5433',
      address: 'Dusun Selur, Ngrayun',
    ),
    const StudentItem(
      id: 'std_03',
      nis: '2403',
      nisn: '0078912347',
      name: 'Bagas Kurniawan',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5434',
      address: 'Desa Wonodadi, Ngrayun',
    ),
    const StudentItem(
      id: 'std_04',
      nis: '2404',
      nisn: '0078912348',
      name: 'Cantika Dewi Lestari',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5435',
      address: 'Desa Baosan Kidul, Ngrayun',
    ),
    const StudentItem(
      id: 'std_05',
      nis: '2405',
      nisn: '0078912349',
      name: 'Dimas Arya Nugraha',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5436',
      address: 'Dusun Cepoko, Ngrayun',
    ),
    const StudentItem(
      id: 'std_06',
      nis: '2406',
      nisn: '0078912350',
      name: 'Eka Prasetya Utomo',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5437',
      address: 'Desa Binade, Ngrayun',
    ),
    const StudentItem(
      id: 'std_07',
      nis: '2407',
      nisn: '0078912351',
      name: 'Farhan Maulana',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5438',
      address: 'Dusun Mrayan, Ngrayun',
    ),
    const StudentItem(
      id: 'std_08',
      nis: '2408',
      nisn: '0078912352',
      name: 'Gita Fitriani',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5439',
      address: 'Desa Sendang, Ngrayun',
    ),
    const StudentItem(
      id: 'std_09',
      nis: '2409',
      nisn: '0078912353',
      name: 'Hendra Setiawan',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5440',
      address: 'Desa Ngrayun Tengah',
    ),
    const StudentItem(
      id: 'std_10',
      nis: '2410',
      nisn: '0078912354',
      name: 'Indah Permatasari',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5441',
      address: 'Desa Temon, Ngrayun',
    ),
    const StudentItem(
      id: 'std_11',
      nis: '2411',
      nisn: '0078912355',
      name: 'Joko Widodo',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5442',
      address: 'Desa Baosan Lor, Ngrayun',
    ),
    const StudentItem(
      id: 'std_12',
      nis: '2412',
      nisn: '0078912356',
      name: 'Kharisma Putri',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5443',
      address: 'Dusun Gedangan, Ngrayun',
    ),
    const StudentItem(
      id: 'std_13',
      nis: '2413',
      nisn: '0078912357',
      name: 'Luthfi Hakim',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5444',
      address: 'Desa Selur Kulon, Ngrayun',
    ),
    const StudentItem(
      id: 'std_14',
      nis: '2414',
      nisn: '0078912358',
      name: 'Maya Anggraini',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5445',
      address: 'Desa Wonodadi Lor, Ngrayun',
    ),
    const StudentItem(
      id: 'std_15',
      nis: '2415',
      nisn: '0078912359',
      name: 'Naufal Zaky',
      gender: Gender.l,
      className: 'X MIPA 1',
      phone: '0857-9876-5446',
      address: 'Dusun Sumber, Ngrayun',
    ),
    const StudentItem(
      id: 'std_16',
      nis: '2416',
      nisn: '0078912360',
      name: 'Olivia Safitri',
      gender: Gender.p,
      className: 'X MIPA 1',
      phone: '0857-9876-5447',
      address: 'Desa Ngrayun Krajan',
    ),
  ];

  // Teacher Teaching Schedules
  static final List<ScheduleItem> teacherSchedules = [
    const ScheduleItem(
      id: 'sch_t_01',
      day: 'Senin',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-X-01',
      className: 'X MIPA 1',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '07:30',
      endTime: '09:00',
      room: 'R. 101',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: true,
    ),
    const ScheduleItem(
      id: 'sch_t_02',
      day: 'Senin',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-X-02',
      className: 'X MIPA 2',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '09:15',
      endTime: '10:45',
      room: 'R. 102',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_t_03',
      day: 'Senin',
      subjectName: 'Matematika Peminatan',
      subjectCode: 'MTKP-XI-01',
      className: 'XI MIPA 1',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '11:00',
      endTime: '12:30',
      room: 'R. 201',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_t_04',
      day: 'Selasa',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-X-03',
      className: 'X IPS 1',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '07:30',
      endTime: '09:00',
      room: 'R. 103',
      totalStudents: 16,
      isToday: false,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_t_05',
      day: 'Rabu',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-X-01',
      className: 'X MIPA 1',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '09:15',
      endTime: '10:45',
      room: 'R. 101',
      totalStudents: 16,
      isToday: false,
      isAttendanceCompleted: false,
    ),
  ];

  // Student Learning Schedules (Aditya Pratama Putra - X MIPA 1)
  static final List<ScheduleItem> studentSchedules = [
    const ScheduleItem(
      id: 'sch_s_01',
      day: 'Senin',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-X-01',
      className: 'X MIPA 1',
      teacherName: 'Siti Rahmawati, S.Pd.',
      teacherNip: '198403152009032008',
      startTime: '07:30',
      endTime: '09:00',
      room: 'R. 101',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: true,
    ),
    const ScheduleItem(
      id: 'sch_s_02',
      day: 'Senin',
      subjectName: 'Fisika Peminatan',
      subjectCode: 'FIS-X-01',
      className: 'X MIPA 1',
      teacherName: 'Bambang Susilo, M.Pd.',
      teacherNip: '197906122005011007',
      startTime: '09:15',
      endTime: '10:45',
      room: 'Lab Fisika',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_s_03',
      day: 'Senin',
      subjectName: 'Bahasa Indonesia',
      subjectCode: 'IND-X-01',
      className: 'X MIPA 1',
      teacherName: 'Dra. Sri Wahyuni',
      teacherNip: '197508202002122003',
      startTime: '11:00',
      endTime: '12:30',
      room: 'R. 101',
      totalStudents: 16,
      isToday: true,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_s_04',
      day: 'Selasa',
      subjectName: 'Informatika',
      subjectCode: 'INF-X-01',
      className: 'X MIPA 1',
      teacherName: 'Agus Prayitno, S.Kom.',
      teacherNip: '199002142018021001',
      startTime: '07:30',
      endTime: '09:00',
      room: 'Lab Komputer',
      totalStudents: 16,
      isToday: false,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_s_05',
      day: 'Selasa',
      subjectName: 'Biologi Peminatan',
      subjectCode: 'BIO-X-01',
      className: 'X MIPA 1',
      teacherName: 'Nurul Aini, S.Si.',
      teacherNip: '198711052014032002',
      startTime: '09:15',
      endTime: '10:45',
      room: 'Lab Biologi',
      totalStudents: 16,
      isToday: false,
      isAttendanceCompleted: false,
    ),
    const ScheduleItem(
      id: 'sch_s_06',
      day: 'Rabu',
      subjectName: 'Pendidikan Agama Islam',
      subjectCode: 'PAI-X-01',
      className: 'X MIPA 1',
      teacherName: 'Drs. H. Ahmad Fauzi',
      teacherNip: '197001011998031005',
      startTime: '07:30',
      endTime: '09:00',
      room: 'R. 101',
      totalStudents: 16,
      isToday: false,
      isAttendanceCompleted: false,
    ),
  ];

  // Initial Attendance Sessions
  static List<AttendanceSession> generateInitialSessions() {
    final now = DateTime.now();

    // Session 1: X MIPA 1 - Matematika Wajib (Already saved and synced)
    final entries1 = classStudents.asMap().entries.map((item) {
      final idx = item.key;
      final student = item.value;
      AttendanceStatus status;
      String? note;

      if (idx == 2) {
        status = AttendanceStatus.terlambat;
        note = 'Hadir 07:45 WIB karena ban bocor';
      } else if (idx == 4) {
        status = AttendanceStatus.sakit;
        note = 'Demam, surat dokter menyusul';
      } else if (idx == 9) {
        status = AttendanceStatus.izin;
        note = 'Izin keluarga ada acara di Trenggalek';
      } else {
        status = AttendanceStatus.hadir;
      }

      return StudentAttendanceEntry(
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        gender: student.gender.code,
        status: status,
        notes: note,
      );
    }).toList();

    // Session 2: X MIPA 2 - Matematika Wajib (In progress / needs check)
    final entries2 = classStudents.map((student) {
      return StudentAttendanceEntry(
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        gender: student.gender.code,
        status: AttendanceStatus.belumDiisi,
      );
    }).toList();

    // Session 3: XI MIPA 1 - Matematika Peminatan (Not started)
    final entries3 = classStudents.map((student) {
      return StudentAttendanceEntry(
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        gender: student.gender.code,
        status: AttendanceStatus.belumDiisi,
      );
    }).toList();

    return [
      AttendanceSession(
        id: 'ses_20261015_01',
        scheduleId: 'sch_t_01',
        subjectName: 'Matematika Wajib',
        className: 'X MIPA 1',
        teacherName: 'Siti Rahmawati, S.Pd.',
        teacherNip: '198403152009032008',
        date: now,
        startTime: '07:30',
        endTime: '09:00',
        room: 'R. 101',
        status: SessionStatus.sudahDisimpan,
        entries: entries1,
        isLocalDraft: false,
        isSynced: true,
        updatedAt: now.subtract(const Duration(minutes: 90)),
      ),
      AttendanceSession(
        id: 'ses_20261015_02',
        scheduleId: 'sch_t_02',
        subjectName: 'Matematika Wajib',
        className: 'X MIPA 2',
        teacherName: 'Siti Rahmawati, S.Pd.',
        teacherNip: '198403152009032008',
        date: now,
        startTime: '09:15',
        endTime: '10:45',
        room: 'R. 102',
        status: SessionStatus.sedangBerlangsung,
        entries: entries2,
        isLocalDraft: true,
        isSynced: false,
        updatedAt: now.subtract(const Duration(minutes: 15)),
      ),
      AttendanceSession(
        id: 'ses_20261015_03',
        scheduleId: 'sch_t_03',
        subjectName: 'Matematika Peminatan',
        className: 'XI MIPA 1',
        teacherName: 'Siti Rahmawati, S.Pd.',
        teacherNip: '198403152009032008',
        date: now,
        startTime: '11:00',
        endTime: '12:30',
        room: 'R. 201',
        status: SessionStatus.belumDimulai,
        entries: entries3,
        isLocalDraft: false,
        isSynced: true,
        updatedAt: now,
      ),
    ];
  }

  // Student Attendance Records for Aditya Pratama Putra
  static final List<AttendanceRecord> studentHistoryRecords = [
    AttendanceRecord(
      id: 'rec_01',
      subjectName: 'Matematika Wajib',
      className: 'X MIPA 1',
      date: DateTime.now(),
      time: '07:30 WIB',
      status: AttendanceStatus.hadir,
      teacherName: 'Siti Rahmawati, S.Pd.',
      notes: null,
    ),
    AttendanceRecord(
      id: 'rec_02',
      subjectName: 'Bahasa Indonesia',
      className: 'X MIPA 1',
      date: DateTime.now().subtract(const Duration(days: 1)),
      time: '08:00 WIB',
      status: AttendanceStatus.hadir,
      teacherName: 'Dra. Sri Wahyuni',
      notes: null,
    ),
    AttendanceRecord(
      id: 'rec_03',
      subjectName: 'Informatika',
      className: 'X MIPA 1',
      date: DateTime.now().subtract(const Duration(days: 2)),
      time: '10:00 WIB',
      status: AttendanceStatus.terlambat,
      teacherName: 'Agus Prayitno, S.Kom.',
      notes: 'Terlambat 10 menit karena antre di bengkel',
    ),
    AttendanceRecord(
      id: 'rec_04',
      subjectName: 'Fisika Peminatan',
      className: 'X MIPA 1',
      date: DateTime.now().subtract(const Duration(days: 3)),
      time: '07:30 WIB',
      status: AttendanceStatus.sakit,
      teacherName: 'Bambang Susilo, M.Pd.',
      notes: 'Demam flu, surat dokter diserahkan wali kelas',
    ),
    AttendanceRecord(
      id: 'rec_05',
      subjectName: 'Biologi Peminatan',
      className: 'X MIPA 1',
      date: DateTime.now().subtract(const Duration(days: 7)),
      time: '09:15 WIB',
      status: AttendanceStatus.izin,
      teacherName: 'Nurul Aini, S.Si.',
      notes: 'Izin menghadiri pernikahan kerabat',
    ),
    AttendanceRecord(
      id: 'rec_06',
      subjectName: 'Pendidikan Agama Islam',
      className: 'X MIPA 1',
      date: DateTime.now().subtract(const Duration(days: 8)),
      time: '07:30 WIB',
      status: AttendanceStatus.hadir,
      teacherName: 'Drs. H. Ahmad Fauzi',
      notes: null,
    ),
  ];

  // Student Permissions (Aditya Pratama Putra)
  static final List<PermissionItem> studentPermissions = [
    PermissionItem(
      id: 'perm_01',
      studentId: 'usr_student_01',
      studentName: 'Aditya Pratama Putra',
      nis: '2401',
      className: 'X MIPA 1',
      type: PermissionType.sakit,
      startDate: DateTime.now().subtract(const Duration(days: 3)),
      endDate: DateTime.now().subtract(const Duration(days: 2)),
      reason: 'Demam tinggi dan flu, istirahat dokter 2 hari.',
      attachmentName: 'surat_dokter_aditya.pdf',
      status: PermissionStatus.disetujui,
      submittedAt: DateTime.now().subtract(const Duration(days: 4)),
      reviewedBy: 'Siti Rahmawati, S.Pd.',
      reviewedAt: DateTime.now().subtract(const Duration(days: 3)),
      reviewNotes: 'Semoga lekas sembuh Aditya.',
    ),
    PermissionItem(
      id: 'perm_02',
      studentId: 'usr_student_01',
      studentName: 'Aditya Pratama Putra',
      nis: '2401',
      className: 'X MIPA 1',
      type: PermissionType.dispensasi,
      startDate: DateTime.now().add(const Duration(days: 5)),
      endDate: DateTime.now().add(const Duration(days: 5)),
      reason: 'Mewakili sekolah dalam Olimpiade Sains Tingkat Kabupaten Ponorogo.',
      attachmentName: 'surat_tugas_osn.pdf',
      status: PermissionStatus.menunggu,
      submittedAt: DateTime.now().subtract(const Duration(hours: 6)),
    ),
  ];
}
