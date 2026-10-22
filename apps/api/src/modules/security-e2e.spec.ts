import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role, SessionStatus, AttendanceStatus, PermissionStatus, AttendanceMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit/audit.service';
import { StorageService } from './storage/storage.service';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { AcademicModule } from './academic/academic.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { ConfigModule } from '@nestjs/config';

describe('Tahap 13: E2E API Security & Data Ownership Scope Verification', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const JWT_SECRET = 'ci_test_access_secret_do_not_use_in_prod_min_32_chars';

  const mockAuditService = {
    record: jest.fn().mockResolvedValue({ id: 'audit-mock-id' }),
  };

  const mockStorageService = {
    getSignedUrl: jest.fn().mockResolvedValue('https://supabase.local/signed/url'),
    uploadFile: jest.fn().mockResolvedValue({ path: 'test.png' }),
    deleteFile: jest.fn().mockResolvedValue(true),
  };

  const mockUsersDatabase: Record<string, any> = {
    'user-admin-1': {
      id: 'user-admin-1',
      username: 'admin_sekolah',
      role: Role.ADMIN,
      isActive: true,
      teacher: null,
      student: null,
    },
    'user-admin-biasa': {
      id: 'user-admin-biasa',
      username: 'admin_biasa',
      role: Role.ADMIN,
      isActive: true,
      teacher: null,
      student: null,
    },
    'user-super-1': {
      id: 'user-super-1',
      username: 'super_admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
      teacher: null,
      student: null,
    },
    'user-student-1': {
      id: 'user-student-1',
      username: 'siswa_aditya',
      role: Role.STUDENT,
      isActive: true,
      student: { id: 'student-1', fullName: 'Aditya Pratama', classId: 'class-x-a' },
      teacher: null,
    },
    'user-teacher-1': {
      id: 'user-teacher-1',
      username: 'guru_budi',
      role: Role.TEACHER,
      isActive: true,
      teacher: { id: 'teacher-1', fullName: 'Budi Santoso, S.Pd', nip: '19850101' },
      student: null,
    },
    'target-user-1': {
      id: 'target-user-1',
      username: 'target_teacher',
      role: Role.TEACHER,
      isActive: true,
      teacher: { id: 'teacher-target', fullName: 'Guru Target', nip: '19850102' },
      student: null,
    },
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation((args) => {
        if (args?.where?.id) {
          return Promise.resolve(mockUsersDatabase[args.where.id] || null);
        }
        if (args?.where?.username) {
          return Promise.resolve(
            Object.values(mockUsersDatabase).find((u) => u.username === args.where.username) || null,
          );
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn(),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'new-user-id', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args?.where?.id, ...args.data })),
      count: jest.fn().mockResolvedValue(1),
    },
    student: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    schoolClass: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    schedule: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    attendanceSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    attendanceRecord: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    attendanceConfig: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'cfg-1',
        maintenanceMode: false,
        allowTeacherSelfCheckIn: true,
        allowStudentSelfCheckIn: false,
        checkInStartTime: '06:00',
        checkInEndTime: '08:00',
        lateThresholdTime: '07:15',
        checkOutStartTime: '14:00',
        checkOutEndTime: '17:00',
      }),
    },
    teachingAssignment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    permissionRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    featureRegistry: {
      findUnique: jest.fn().mockResolvedValue({ isEnabled: true, maintenanceStatus: 'ACTIVE' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-1', ...args.data })),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn().mockImplementation((cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return Promise.resolve(cb);
    }),
  };

  // Helper token generator
  function generateToken(payload: { sub: string; username: string; role: Role }) {
    return jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: '1h' });
  }

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = 'ci_test_refresh_secret_min_32_chars_long';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4001';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        AuditModule,
        AuthModule,
        UsersModule,
        StudentsModule,
        TeachersModule,
        AcademicModule,
        AttendanceModule,
        PermissionsModule,
        ReportsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(AuditService)
      .useValue(mockAuditService)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.rolePermission.findMany.mockResolvedValue([]);
    mockPrisma.rolePermission.findUnique.mockResolvedValue(null);
    mockPrisma.featureRegistry.findUnique.mockResolvedValue({ isEnabled: true, maintenanceStatus: 'ACTIVE' });
    mockPrisma.user.findUnique.mockImplementation((args) => {
      if (args?.where?.id) {
        return Promise.resolve(mockUsersDatabase[args.where.id] || null);
      }
      if (args?.where?.username) {
        return Promise.resolve(
          Object.values(mockUsersDatabase).find((u) => u.username === args.where.username) || null,
        );
      }
      return Promise.resolve(null);
    });
  });

  // ===========================================================================
  // Skenario 1: Akses Tanpa Token (401 Unauthorized)
  // ===========================================================================
  describe('1. Unauthenticated Access (401 Unauthorized)', () => {
    it('harus menolak permintaan ke GET /students tanpa token', async () => {
      await request(app.getHttpServer())
        .get('/students')
        .expect(401);
    });

    it('harus menolak permintaan ke GET /attendance/sessions tanpa token', async () => {
      await request(app.getHttpServer())
        .get('/attendance/sessions')
        .expect(401);
    });

    it('harus menolak permintaan ke GET /permissions tanpa token', async () => {
      await request(app.getHttpServer())
        .get('/permissions')
        .expect(401);
    });
  });

  // ===========================================================================
  // Skenario 2: Siswa Mencoba Mengakses Data Siswa Lain (403 Forbidden - Anti-IDOR)
  // ===========================================================================
  describe('2. Student Anti-IDOR (403 Forbidden)', () => {
    const studentUser = {
      id: 'user-student-1',
      username: 'siswa_aditya',
      role: Role.STUDENT,
      isActive: true,
      student: { id: 'student-1', fullName: 'Aditya Pratama', classId: 'class-x-a' },
      teacher: null,
    };

    it('siswa A dilarang membaca profil siswa B (:id menunjuk siswa lain)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(studentUser);

      const token = generateToken({
        sub: studentUser.id,
        username: studentUser.username,
        role: studentUser.role,
      });

      // Mencoba akses profil student-2
      const res = await request(app.getHttpServer())
        .get('/students/student-2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Akses ditolak: Anda hanya dapat melihat data pribadi Anda');
    });

    it('siswa A dilarang mengakses permohonan izin milik siswa B (:id menunjuk izin siswa lain)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(studentUser);
      mockPrisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-student-2',
        studentId: 'student-2',
        classId: 'class-x-b',
      });

      const token = generateToken({
        sub: studentUser.id,
        username: studentUser.username,
        role: studentUser.role,
      });

      const res = await request(app.getHttpServer())
        .get('/permissions/perm-student-2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Akses ditolak: Anda hanya dapat melihat pengajuan izin milik Anda');
    });

    it('siswa A dilarang mengakses jadwal kelas lain yang bukan rombelnya', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(studentUser);

      const token = generateToken({
        sub: studentUser.id,
        username: studentUser.username,
        role: studentUser.role,
      });

      const res = await request(app.getHttpServer())
        .get('/schedules?classId=class-lain-123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Akses ditolak: Siswa hanya dapat mengakses jadwal kelasnya sendiri');
    });
  });

  // ===========================================================================
  // Skenario 3: Guru Mencoba Mengabsen Kelas yang Bukan Tanggung Jawabnya (403 Forbidden)
  // ===========================================================================
  describe('3. Teacher Cross-Class Anti-IDOR (403 Forbidden)', () => {
    const teacherUser = {
      id: 'user-teacher-1',
      username: 'guru_budi',
      role: Role.TEACHER,
      isActive: true,
      teacher: { id: 'teacher-1', fullName: 'Budi Santoso, S.Pd', nip: '19850101' },
      student: null,
    };

    it('guru dilarang membuat sesi absensi untuk kelas/mapel yang tidak diampu', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      // Mock bukan pengampu dan bukan wali kelas
      mockPrisma.teachingAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.class.findFirst.mockResolvedValue(null);

      const token = generateToken({
        sub: teacherUser.id,
        username: teacherUser.username,
        role: teacherUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/attendance/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          classId: 'class-xi-ipa-1',
          subjectId: 'sub-fisika',
          date: '2026-10-22',
          startTime: '07:30',
          endTime: '09:00',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Anda tidak ditugaskan untuk mengajar atau menjadi wali kelas');
    });

    it('guru dilarang menyimpan absensi pada sesi kelas yang bukan miliknya', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-other-teacher',
        classId: 'class-other',
        teacherId: 'teacher-stranger',
        status: SessionStatus.SEDANG_BERLANGSUNG,
        schoolClass: { homeroomTeacherId: 'teacher-wali-other' },
      });

      const token = generateToken({
        sub: teacherUser.id,
        username: teacherUser.username,
        role: teacherUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/attendance/sessions/session-other-teacher/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          records: [{ studentId: 'stu-1', status: AttendanceStatus.HADIR }],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Anda tidak berwenang menyimpan absensi kelas ini');
    });

    it('guru dilarang menyetujui izin siswa di luar kelas perwaliannya', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      mockPrisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-99',
        status: PermissionStatus.MENUNGGU,
        student: { fullName: 'Siswa Luar' },
        schoolClass: { homeroomTeacherId: 'teacher-wali-other' },
      });

      const token = generateToken({
        sub: teacherUser.id,
        username: teacherUser.username,
        role: teacherUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/permissions/perm-99/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ note: 'Persetujuan tidak sah' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Hanya wali kelas siswa bersangkutan yang berwenang');
    });
  });

  // ===========================================================================
  // Skenario 4: Percobaan Mengubah Sesi Absensi yang Sudah Ditutup (400/403)
  // ===========================================================================
  describe('4. Closed Attendance Session Tampering Prevention (400 Bad Request)', () => {
    const adminUser = {
      id: 'user-admin-1',
      username: 'admin_sekolah',
      role: Role.ADMIN,
      isActive: true,
      teacher: null,
      student: null,
    };

    it('dilarang mengirim batch records ke sesi yang statusnya sudah DITUTUP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-closed-123',
        classId: 'class-1',
        teacherId: 'teacher-1',
        status: SessionStatus.DITUTUP,
        schoolClass: { homeroomTeacherId: 'teacher-1' },
      });

      const token = generateToken({
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/attendance/sessions/session-closed-123/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          records: [{ studentId: 'student-1', status: AttendanceStatus.HADIR }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Sesi absensi sudah ditutup dan dikunci. Perubahan harus melalui alur koreksi.');
    });

    it('dilarang mengoreksi langsung record pada sesi yang statusnya sudah DITUTUP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue({
        id: 'rec-1',
        sessionId: 'session-closed-123',
        studentId: 'student-1',
        status: AttendanceStatus.HADIR,
        student: { fullName: 'Budi' },
        session: {
          id: 'session-closed-123',
          status: SessionStatus.DITUTUP,
          schoolClass: { homeroomTeacherId: 'teacher-1' },
        },
      });

      const token = generateToken({
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      });

      const res = await request(app.getHttpServer())
        .patch('/attendance/sessions/session-closed-123/records/rec-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: AttendanceStatus.IZIN,
          reason: 'Koreksi langsung ilegal',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Sesi absensi sudah ditutup. Perubahan harus melalui alur pengajuan koreksi.');
    });
  });

  // ===========================================================================
  // Skenario 5: Admin Mencoba Menaikkan Role Menjadi SUPER_ADMIN (403 Forbidden)
  // ===========================================================================
  describe('5. Privilege Escalation Prevention (403 Forbidden)', () => {
    const adminUser = {
      id: 'user-admin-biasa',
      username: 'admin_biasa',
      role: Role.ADMIN,
      isActive: true,
      teacher: null,
      student: null,
    };

    it('admin biasa dilarang membuat akun dengan role SUPER_ADMIN', async () => {
      const token = generateToken({
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'super_hacker',
          password: 'Password123!',
          role: Role.SUPER_ADMIN,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Hanya SUPER_ADMIN yang berwenang menetapkan peran SUPER_ADMIN atau DEVELOPER');
    });

    it('admin biasa dilarang membuat akun dengan role DEVELOPER', async () => {
      const token = generateToken({
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'dev_hacker',
          password: 'Password123!',
          role: Role.DEVELOPER,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Hanya SUPER_ADMIN yang berwenang menetapkan peran SUPER_ADMIN atau DEVELOPER');
    });

    it('admin biasa dilarang mengubah role akun lain menjadi SUPER_ADMIN', async () => {

      const token = generateToken({
        sub: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      });

      const res = await request(app.getHttpServer())
        .patch('/users/target-user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: Role.SUPER_ADMIN,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Hanya SUPER_ADMIN yang berwenang menetapkan peran SUPER_ADMIN atau DEVELOPER');
    });
  });

  // ===========================================================================
  // Skenario 6: Duplikasi Catatan Absensi (400 Bad Request)
  // ===========================================================================
  describe('6. Duplicate Attendance Record Rejection (400 Bad Request)', () => {
    const teacherUser = {
      id: 'user-teacher-1',
      username: 'guru_budi',
      role: Role.TEACHER,
      isActive: true,
      teacher: { id: 'teacher-1', fullName: 'Budi Santoso' },
      student: null,
    };

    it('menolak pengiriman batch absensi jika terdapat ID siswa duplikat', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      mockPrisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-active-1',
        classId: 'class-1',
        teacherId: 'teacher-1',
        status: SessionStatus.SEDANG_BERLANGSUNG,
        schoolClass: { homeroomTeacherId: 'teacher-1' },
      });

      const token = generateToken({
        sub: teacherUser.id,
        username: teacherUser.username,
        role: teacherUser.role,
      });

      const res = await request(app.getHttpServer())
        .post('/attendance/sessions/session-active-1/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          records: [
            { studentId: 'student-dup-1', status: AttendanceStatus.HADIR },
            { studentId: 'student-dup-1', status: AttendanceStatus.TERLAMBAT },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Terdapat ID siswa duplikat');
    });
  });
});
