import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, AttendanceStatus, AttendanceMethod, FeatureImplementationStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AttendanceService } from '../attendance/attendance.service';
import { FeaturesService, ROLE_PERMISSION_MATRIX } from '../features/features.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Tahap 18: Security Hardening & Zero-Trust Automated Tests', () => {
  let usersService: UsersService;
  let attendanceService: AttendanceService;
  let featuresService: FeaturesService;
  let auditService: AuditService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    teacherAttendance: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    attendanceConfig: {
      findFirst: jest.fn(),
    },
    attendanceRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    attendanceSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    featureRegistry: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-1', ...args.data })),
      count: jest.fn().mockResolvedValue(100),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'log-1',
        newValue: { action: 'TEST_ACTION', sanitized: true },
      }),
    },
  };

  const mockAuditService = {
    record: jest.fn().mockResolvedValue({ id: 'audit-mock-id' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        AttendanceService,
        FeaturesService,
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    attendanceService = module.get<AttendanceService>(AttendanceService);
    featuresService = module.get<FeaturesService>(FeaturesService);
    auditService = module.get<AuditService>(AuditService);
  });

  // ---------------------------------------------------------------------------
  // 1. Authorization & Privilege Escalation Prevention
  // ---------------------------------------------------------------------------
  describe('P0: Privilege Escalation & Least Privilege', () => {
    it('harus menolak ADMIN yang mencoba menetapkan peran DEVELOPER', async () => {
      const adminUser = { id: 'admin-1', role: Role.ADMIN };
      const dto = {
        username: 'hacker_dev',
        password: 'Password123!',
        role: Role.DEVELOPER,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.create(dto as any, adminUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('harus menolak ADMIN yang mencoba menetapkan peran SUPER_ADMIN', async () => {
      const adminUser = { id: 'admin-1', role: Role.ADMIN };
      const dto = {
        username: 'hacker_super',
        password: 'Password123!',
        role: Role.SUPER_ADMIN,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.create(dto as any, adminUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('harus mengizinkan SUPER_ADMIN menetapkan peran DEVELOPER secara sah', async () => {
      const superAdminUser = { id: 'super-1', role: Role.SUPER_ADMIN, username: 'super' };
      const dto = {
        username: 'valid_dev',
        password: 'Password123!',
        role: Role.DEVELOPER,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-dev-id',
        username: 'valid_dev',
        role: Role.DEVELOPER,
        isActive: true,
      });

      const result = await usersService.create(dto as any, superAdminUser);
      expect(result.role).toBe(Role.DEVELOPER);
    });

    it('peran DEVELOPER tidak boleh memiliki izin mutasi presensi akademik secara default', () => {
      const devPermissions = ROLE_PERMISSION_MATRIX[Role.DEVELOPER];
      expect(devPermissions).toBeDefined();
      expect(devPermissions).not.toContain('attendance.record');
      expect(devPermissions).not.toContain('attendance.create');
      expect(devPermissions).not.toContain('attendance.correct');
      expect(devPermissions).toContain('developer.manage_features');
      expect(devPermissions).toContain('developer.view_diagnostics');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Session Invalidation & Token Revocation
  // ---------------------------------------------------------------------------
  describe('P0: Session Revocation on Password Change & Deactivation', () => {
    it('harus mencabut refresh token (refreshToken: null) saat kata sandi diperbarui', async () => {
      const currentUser = { id: 'admin-1', role: Role.SUPER_ADMIN };
      const targetUser = { id: 'target-1', role: Role.TEACHER, isActive: true };

      mockPrisma.user.findUnique.mockResolvedValue(targetUser);
      mockPrisma.user.update.mockResolvedValue({
        id: 'target-1',
        username: 'guru_test',
        role: Role.TEACHER,
        isActive: true,
      });

      await usersService.update('target-1', { password: 'NewSecurePassword2026!' }, currentUser);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'target-1' },
          data: expect.objectContaining({
            refreshToken: null,
          }),
        }),
      );
    });

    it('harus mencabut refresh token saat akun pengguna dinonaktifkan (isActive: false)', async () => {
      const currentUser = { id: 'admin-1', role: Role.SUPER_ADMIN };
      const targetUser = { id: 'target-2', role: Role.STUDENT, isActive: true };

      mockPrisma.user.findUnique.mockResolvedValue(targetUser);
      mockPrisma.user.update.mockResolvedValue({
        id: 'target-2',
        username: 'siswa_suspend',
        role: Role.STUDENT,
        isActive: false,
      });

      await usersService.update('target-2', { isActive: false }, currentUser);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'target-2' },
          data: expect.objectContaining({
            isActive: false,
            refreshToken: null,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Anti-Cheating & Attendance Server-Side Verification
  // ---------------------------------------------------------------------------
  describe('P1: Anti-Cheating Attendance Verification', () => {
    it('harus menolak dan mencatat anomali saat guru check-in di luar radius GPS sekolah', async () => {
      const teacherUser = {
        id: 'teacher-user-1',
        role: Role.TEACHER,
        teacherId: 'teacher-1',
      };

      // Configuration: Center at school (-8.0435, 111.4123), Max radius: 100m
      mockPrisma.attendanceConfig.findFirst.mockResolvedValue({
        maintenanceMode: false,
        allowTeacherSelfCheckIn: true,
        allowedMethods: '["SELF_MOBILE"]',
        checkInStartTime: '00:00',
        checkInEndTime: '23:59',
        lateThresholdTime: '07:00',
        enableGps: true,
        schoolLatitude: -8.0435,
        schoolLongitude: 111.4123,
        maxGpsRadiusMeters: 100,
      });

      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        fullName: 'Guru Budi, S.Pd',
      });

      // Coordinates ~5 km away from school
      const farDto = {
        latitude: -8.0900,
        longitude: 111.4500,
      };

      await expect(
        attendanceService.teacherCheckIn(farDto as any, teacherUser, '192.168.1.100', 'Mobile-Agent'),
      ).rejects.toThrow(BadRequestException);

      // Verify audit log recorded anomaly
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_ANOMALY_DETECTED',
          newValue: expect.objectContaining({
            anomalyType: 'GEOFENCE_RADIUS_BREACH',
            severity: 'HIGH',
          }),
        }),
      );
    });

    it('harus menolak check-in ganda oleh guru pada hari yang sama', async () => {
      const teacherUser = {
        id: 'teacher-user-1',
        role: Role.TEACHER,
        teacherId: 'teacher-1',
      };

      mockPrisma.attendanceConfig.findFirst.mockResolvedValue({
        maintenanceMode: false,
        allowTeacherSelfCheckIn: true,
        allowedMethods: '["SELF_MOBILE"]',
        checkInStartTime: '00:00',
        checkInEndTime: '23:59',
        lateThresholdTime: '07:00',
        enableGps: false,
      });

      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        fullName: 'Guru Budi, S.Pd',
      });

      // Mock existing attendance today
      mockPrisma.teacherAttendance.findUnique.mockResolvedValue({
        id: 'att-exist',
        teacherId: 'teacher-1',
        checkInTime: new Date(),
        status: AttendanceStatus.HADIR,
      });

      await expect(
        attendanceService.teacherCheckIn({} as any, teacherUser, '192.168.1.100', 'Mobile-Agent'),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_ANOMALY_DETECTED',
          newValue: expect.objectContaining({
            anomalyType: 'DUPLICATE_CHECKIN_ATTEMPT',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Architectural Lock of Unimplemented Modules
  // ---------------------------------------------------------------------------
  describe('P1: Unimplemented Modules Architectural Lock', () => {
    it('harus menolak keras aktivasi modul ujian (feat_grading_examination) yang berstatus NOT_IMPLEMENTED', async () => {
      const devUser = { id: 'dev-1', role: Role.DEVELOPER };

      mockPrisma.featureRegistry.findUnique.mockResolvedValue({
        key: 'feat_grading_examination',
        name: 'Penilaian Akademik, Rapor, & Ujian CBT',
        implementationStatus: FeatureImplementationStatus.NOT_IMPLEMENTED,
        isEnabled: false,
        dependencies: [],
      });

      await expect(
        featuresService.update('feat_grading_examination', { isEnabled: true }, devUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Non-Destructive Security Diagnostic Suite
  // ---------------------------------------------------------------------------
  describe('P2: Security Diagnostics Execution', () => {
    it('harus menjalankan seluruh 5 pemeriksaan keamanan secara non-destruktif', async () => {
      mockPrisma.user.count.mockResolvedValue(17);
      mockPrisma.attendanceConfig.findFirst.mockResolvedValue({
        schoolLatitude: -8.0435,
        schoolLongitude: 111.4123,
        maxGpsRadiusMeters: 100,
      });
      mockPrisma.featureRegistry.findUnique.mockResolvedValue({
        key: 'feat_grading_examination',
        implementationStatus: FeatureImplementationStatus.NOT_IMPLEMENTED,
        isEnabled: false,
      });

      const report = await featuresService.runSecurityDiagnostics();

      expect(report.totalChecks).toBe(5);
      expect(report.passed).toBe(true);
      expect(report.failedChecks).toBe(0);
      expect(report.checks.map((c) => c.id)).toEqual([
        'SEC-CHK-01',
        'SEC-CHK-02',
        'SEC-CHK-03',
        'SEC-CHK-04',
        'SEC-CHK-05',
      ]);
    });
  });
});
