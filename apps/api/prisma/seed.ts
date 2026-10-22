import {
  PrismaClient,
  Role,
  Gender,
  StudentStatus,
  TeacherStatus,
  ClassLevel,
  Major,
  SubjectCategory,
  DayOfWeek,
  SessionStatus,
  AttendanceStatus,
  AttendanceMethod,
  PermissionType,
  PermissionStatus,
  Semester,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SIAKAD database seeding...');

  // 1. School Setting
  const existingSetting = await prisma.schoolSetting.findFirst();
  let schoolSetting;
  if (!existingSetting) {
    schoolSetting = await prisma.schoolSetting.create({
      data: {
        schoolName: 'SMA Pemberdayaan Bangsa Ngrayun',
        npsn: '20512345',
        address: 'Jl. Raya Ngrayun No. 45, Ngrayun, Ponorogo, Jawa Timur 63464',
        phone: '(0352) 876543',
        email: 'info@smapemberdayaanbangsa.sch.id',
        minAttendancePercentage: 75.0,
        timezone: 'Asia/Jakarta',
        allowSelfPermission: true,
      },
    });
  } else {
    schoolSetting = existingSetting;
  }
  console.log('✅ SchoolSetting created/verified:', schoolSetting.schoolName);

  // 2. Academic Years
  const ayActive = await prisma.academicYear.upsert({
    where: {
      name_semester: {
        name: '2025/2026',
        semester: Semester.GANJIL,
      },
    },
    update: { isActive: true },
    create: {
      name: '2025/2026',
      semester: Semester.GANJIL,
      startDate: new Date('2025-07-15T00:00:00.000Z'),
      endDate: new Date('2025-12-20T23:59:59.000Z'),
      isActive: true,
    },
  });

  await prisma.academicYear.upsert({
    where: {
      name_semester: {
        name: '2025/2026',
        semester: Semester.GENAP,
      },
    },
    update: { isActive: false },
    create: {
      name: '2025/2026',
      semester: Semester.GENAP,
      startDate: new Date('2026-01-05T00:00:00.000Z'),
      endDate: new Date('2026-06-20T23:59:59.000Z'),
      isActive: false,
    },
  });
  console.log('✅ AcademicYear 2025/2026 Ganjil & Genap seeded.');

  // Password hashes
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 3. User Accounts
  // 3a. Super Admin
  const superAdminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'superadmin',
      email: 'superadmin@smapemberdayaanbangsa.sch.id',
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 3b. Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      email: 'admin@smapemberdayaanbangsa.sch.id',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 3c. Principal
  const principalUser = await prisma.user.upsert({
    where: { username: 'kepala.sekolah' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      username: 'kepala.sekolah',
      email: 'kepala@smapemberdayaanbangsa.sch.id',
      passwordHash: defaultPasswordHash,
      role: Role.PRINCIPAL,
      isActive: true,
    },
  });
  console.log('✅ Super Admin, Admin, and Principal users seeded.');

  // 4. Teachers
  const teacherUsersData = [
    {
      username: '198403152009032008',
      email: 'siti.rahmawati@smapemberdayaanbangsa.sch.id',
      fullName: 'Siti Rahmawati, S.Pd.',
      nip: '198403152009032008',
      gender: Gender.P,
      title: 'S.Pd.',
      phone: '081234567890',
      roleTitle: 'Guru Fisika / Wali Kelas X MIPA 1',
      isHomeroom: true,
    },
    {
      username: '197906122005011004',
      email: 'bambang.supriyanto@smapemberdayaanbangsa.sch.id',
      fullName: 'Bambang Supriyanto, M.Pd.',
      nip: '197906122005011004',
      gender: Gender.L,
      title: 'M.Pd.',
      phone: '081234567891',
      roleTitle: 'Guru Matematika / Wali Kelas X MIPA 2',
      isHomeroom: true,
    },
    {
      username: '198811202014022003',
      email: 'dewi.anggraini@smapemberdayaanbangsa.sch.id',
      fullName: 'Dewi Anggraini, S.Si.',
      nip: '198811202014022003',
      gender: Gender.P,
      title: 'S.Si.',
      phone: '081234567892',
      roleTitle: 'Guru Biologi',
      isHomeroom: false,
    },
    {
      username: '198205042008011012',
      email: 'ahmad.fauzi@smapemberdayaanbangsa.sch.id',
      fullName: 'Ahmad Fauzi, S.Pd.',
      nip: '198205042008011012',
      gender: Gender.L,
      title: 'S.Pd.',
      phone: '081234567893',
      roleTitle: 'Guru Bahasa Indonesia',
      isHomeroom: false,
    },
  ];

  const teachersMap: Record<string, any> = {};

  for (const t of teacherUsersData) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: { passwordHash: defaultPasswordHash },
      create: {
        username: t.username,
        email: t.email,
        passwordHash: defaultPasswordHash,
        role: Role.TEACHER,
        isActive: true,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { nip: t.nip },
      update: { fullName: t.fullName, phone: t.phone, isHomeroom: t.isHomeroom },
      create: {
        userId: user.id,
        nip: t.nip,
        fullName: t.fullName,
        title: t.title,
        phone: t.phone,
        email: t.email,
        roleTitle: t.roleTitle,
        isHomeroom: t.isHomeroom,
        status: TeacherStatus.AKTIF,
      },
    });

    teachersMap[t.nip] = teacher;
  }
  console.log(`✅ ${teacherUsersData.length} Teachers seeded.`);

  // 5. Classes
  const classesData = [
    { name: 'X MIPA 1', level: ClassLevel.X, major: Major.MIPA, homeroomNip: '198403152009032008', room: 'R. 101' },
    { name: 'X MIPA 2', level: ClassLevel.X, major: Major.MIPA, homeroomNip: '197906122005011004', room: 'R. 102' },
    { name: 'X IPS 1', level: ClassLevel.X, major: Major.IPS, homeroomNip: '198205042008011012', room: 'R. 103' },
    { name: 'XI MIPA 1', level: ClassLevel.XI, major: Major.MIPA, homeroomNip: '198811202014022003', room: 'R. 201' },
    { name: 'XII MIPA 1', level: ClassLevel.XII, major: Major.MIPA, homeroomNip: '198403152009032008', room: 'R. 301' },
  ];

  const classesMap: Record<string, any> = {};

  for (const c of classesData) {
    const homeroomTeacher = teachersMap[c.homeroomNip];
    const cls = await prisma.class.upsert({
      where: {
        name_academicYearId: {
          name: c.name,
          academicYearId: ayActive.id,
        },
      },
      update: {
        homeroomTeacherId: homeroomTeacher ? homeroomTeacher.id : null,
      },
      create: {
        name: c.name,
        level: c.level,
        major: c.major,
        academicYearId: ayActive.id,
        homeroomTeacherId: homeroomTeacher ? homeroomTeacher.id : null,
        roomNumber: c.room,
      },
    });
    classesMap[c.name] = cls;
  }
  console.log(`✅ ${classesData.length} Classes seeded.`);

  // 6. Students
  const defaultClass = classesMap['X MIPA 1'];

  const studentsData = [
    { nis: '2401', nisn: '0071234561', name: 'Aditya Pratama Putra', gender: Gender.L },
    { nis: '2402', nisn: '0071234562', name: 'Bella Safitri', gender: Gender.P },
    { nis: '2403', nisn: '0071234563', name: 'Candra Wijaya', gender: Gender.L },
    { nis: '2404', nisn: '0071234564', name: 'Dinda Permata Sari', gender: Gender.P },
    { nis: '2405', nisn: '0071234565', name: 'Eko Prasetyo', gender: Gender.L },
    { nis: '2406', nisn: '0071234566', name: 'Fani Indah Lestari', gender: Gender.P },
    { nis: '2407', nisn: '0071234567', name: 'Gilang Ramadhan', gender: Gender.L },
    { nis: '2408', nisn: '0071234568', name: 'Hesti Novitasari', gender: Gender.P },
    { nis: '2409', nisn: '0071234569', name: 'Irfan Maulana', gender: Gender.L },
    { nis: '2410', nisn: '0071234570', name: 'Jasmine Putri', gender: Gender.P },
  ];

  const studentsList: any[] = [];

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { username: s.nis },
      update: { passwordHash: defaultPasswordHash },
      create: {
        username: s.nis,
        email: `${s.nis}@siswa.smapemberdayaanbangsa.sch.id`,
        passwordHash: defaultPasswordHash,
        role: Role.STUDENT,
        isActive: true,
      },
    });

    const student = await prisma.student.upsert({
      where: { nis: s.nis },
      update: { fullName: s.name, gender: s.gender, classId: defaultClass.id },
      create: {
        userId: user.id,
        nis: s.nis,
        nisn: s.nisn,
        fullName: s.name,
        gender: s.gender,
        classId: defaultClass.id,
        phone: '081398765432',
        parentName: `Wali dari ${s.name}`,
        parentPhone: '081234000000',
        address: 'Ngrayun, Ponorogo, Jawa Timur',
        status: StudentStatus.AKTIF,
      },
    });

    studentsList.push(student);

    // Enroll into Class
    await prisma.classEnrollment.upsert({
      where: {
        studentId_classId_academicYearId: {
          studentId: student.id,
          classId: defaultClass.id,
          academicYearId: ayActive.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        classId: defaultClass.id,
        academicYearId: ayActive.id,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✅ ${studentsData.length} Students seeded and enrolled in X MIPA 1.`);

  // 7. Subjects
  const subjectsData = [
    { code: 'FIS-10', name: 'Fisika', category: SubjectCategory.PEMINATAN, hours: 3 },
    { code: 'MAT-10', name: 'Matematika Wajib', category: SubjectCategory.WAJIB, hours: 4 },
    { code: 'BIO-10', name: 'Biologi', category: SubjectCategory.PEMINATAN, hours: 3 },
    { code: 'BIN-10', name: 'Bahasa Indonesia', category: SubjectCategory.WAJIB, hours: 4 },
    { code: 'BIG-10', name: 'Bahasa Inggris', category: SubjectCategory.WAJIB, hours: 3 },
  ];

  const subjectsMap: Record<string, any> = {};

  for (const sub of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: sub.code },
      update: { name: sub.name, creditHours: sub.hours },
      create: {
        code: sub.code,
        name: sub.name,
        category: sub.category,
        creditHours: sub.hours,
        isActive: true,
      },
    });
    subjectsMap[sub.code] = subject;
  }
  console.log(`✅ ${subjectsData.length} Subjects seeded.`);

  // 8. Teaching Assignments & Schedules
  const teacherSiti = teachersMap['198403152009032008'];
  const teacherBambang = teachersMap['197906122005011004'];

  // Siti Rahmawati teaches Fisika in X MIPA 1
  await prisma.teachingAssignment.upsert({
    where: {
      teacherId_classId_subjectId_academicYearId: {
        teacherId: teacherSiti.id,
        classId: defaultClass.id,
        subjectId: subjectsMap['FIS-10'].id,
        academicYearId: ayActive.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherSiti.id,
      classId: defaultClass.id,
      subjectId: subjectsMap['FIS-10'].id,
      academicYearId: ayActive.id,
    },
  });

  // Bambang Supriyanto teaches Matematika in X MIPA 1
  await prisma.teachingAssignment.upsert({
    where: {
      teacherId_classId_subjectId_academicYearId: {
        teacherId: teacherBambang.id,
        classId: defaultClass.id,
        subjectId: subjectsMap['MAT-10'].id,
        academicYearId: ayActive.id,
      },
    },
    update: {},
    create: {
      teacherId: teacherBambang.id,
      classId: defaultClass.id,
      subjectId: subjectsMap['MAT-10'].id,
      academicYearId: ayActive.id,
    },
  });

  // Schedule Monday 07:00-08:30 Fisika in X MIPA 1
  const existingSchedule = await prisma.schedule.findFirst({
    where: {
      classId: defaultClass.id,
      subjectId: subjectsMap['FIS-10'].id,
      dayOfWeek: DayOfWeek.SENIN,
    },
  });

  let scheduleFisika;
  if (!existingSchedule) {
    scheduleFisika = await prisma.schedule.create({
      data: {
        classId: defaultClass.id,
        subjectId: subjectsMap['FIS-10'].id,
        teacherId: teacherSiti.id,
        dayOfWeek: DayOfWeek.SENIN,
        startTime: '07:00',
        endTime: '08:30',
        room: 'R. 101',
        isActive: true,
      },
    });
  } else {
    scheduleFisika = existingSchedule;
  }
  console.log('✅ Teaching assignments & schedule seeded.');

  // 9. Attendance Session & Records
  const today = new Date();
  today.setHours(7, 0, 0, 0);

  const existingSession = await prisma.attendanceSession.findFirst({
    where: {
      classId: defaultClass.id,
      subjectId: subjectsMap['FIS-10'].id,
      teacherId: teacherSiti.id,
      date: today,
    },
  });

  let sessionToday;
  if (!existingSession) {
    sessionToday = await prisma.attendanceSession.create({
      data: {
        classId: defaultClass.id,
        subjectId: subjectsMap['FIS-10'].id,
        teacherId: teacherSiti.id,
        scheduleId: scheduleFisika.id,
        createdById: teacherSiti.userId,
        date: today,
        startTime: '07:00',
        endTime: '08:30',
        room: 'R. 101',
        status: SessionStatus.SUDAH_DISIMPAN,
        notes: 'Pertemuan Ke-8: Hukum Newton pada Bidang Miring',
      },
    });

    const recordsPlan = [
      { studentIndex: 0, status: AttendanceStatus.SAKIT, notes: 'Surat dokter terlampir' },
      { studentIndex: 1, status: AttendanceStatus.IZIN, notes: 'Izin urusan keluarga' },
      { studentIndex: 2, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 3, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 4, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 5, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 6, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 7, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 8, status: AttendanceStatus.HADIR, notes: null },
      { studentIndex: 9, status: AttendanceStatus.HADIR, notes: null },
    ];

    for (const item of recordsPlan) {
      const student = studentsList[item.studentIndex];
      await prisma.attendanceRecord.create({
        data: {
          sessionId: sessionToday.id,
          studentId: student.id,
          status: item.status,
          method: AttendanceMethod.MANUAL_TEACHER,
          notes: item.notes,
          recordedById: teacherSiti.userId,
        },
      });
    }
    console.log('✅ Attendance session and 10 records seeded.');
  }

  // 10. Permission Requests
  const studentAditya = studentsList[0];
  const studentBella = studentsList[1];

  const existingPerm1 = await prisma.permissionRequest.findFirst({
    where: { studentId: studentAditya.id },
  });

  if (!existingPerm1) {
    await prisma.permissionRequest.create({
      data: {
        studentId: studentAditya.id,
        classId: defaultClass.id,
        type: PermissionType.SAKIT,
        startDate: today,
        endDate: today,
        totalDays: 1,
        reason: 'Demam tinggi dan istirahat dokter 1 hari',
        attachmentName: 'surat-dokter-aditya.jpg',
        attachmentUrl: 'https://storage.smapemberdayaanbangsa.sch.id/surat-dokter-2401.jpg',
        status: PermissionStatus.DISETUJUI,
        reviewedById: teacherSiti.id,
        reviewedAt: new Date(),
        reviewNotes: 'Surat dokter terverifikasi.',
      },
    });

    await prisma.permissionRequest.create({
      data: {
        studentId: studentBella.id,
        classId: defaultClass.id,
        type: PermissionType.IZIN,
        startDate: today,
        endDate: today,
        totalDays: 1,
        reason: 'Menghadiri pernikahan saudara kandung',
        attachmentName: null,
        attachmentUrl: null,
        status: PermissionStatus.MENUNGGU,
      },
    });
    console.log('✅ Permission requests seeded.');
  }

  // 11. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      actorName: 'Administrator SIAKAD',
      actorRole: 'ADMIN',
      action: 'SYSTEM_SEED',
      entity: 'DATABASE',
      entityId: schoolSetting.id,
      newValue: {
        version: '1.0.0',
        academicYear: ayActive.name,
        semester: ayActive.semester,
        totalStudents: studentsData.length,
        totalTeachers: teacherUsersData.length,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'PrismaSeed/1.0',
    },
  });
  console.log('✅ Initial AuditLog recorded.');

  console.log('\n🎉 SIAKAD database seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo Credentials:');
  console.log('• Super Admin  : superadmin / admin123');
  console.log('• Tata Usaha   : admin / admin123');
  console.log('• Kepala Sek.  : kepala.sekolah / password123');
  console.log('• Guru Fisika  : 198403152009032008 / password123 (Siti Rahmawati, S.Pd.)');
  console.log('• Siswa Demo   : 2401 / password123 (Aditya Pratama Putra)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
