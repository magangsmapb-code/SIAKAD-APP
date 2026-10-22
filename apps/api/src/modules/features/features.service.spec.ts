import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesService } from './features.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FeatureImplementationStatus, FeatureMaintenanceStatus } from '@prisma/client';

describe('FeaturesService', () => {
  let service: FeaturesService;
  let prisma: any;
  let auditService: any;

  const mockFeatureImplemented = {
    key: 'feat_attendance_session',
    name: 'Sesi Presensi Digital',
    description: 'Pencatatan presensi siswa digital',
    category: 'Attendance',
    route: '/attendance',
    implementationStatus: FeatureImplementationStatus.IMPLEMENTED,
    isEnabled: true,
    maintenanceStatus: FeatureMaintenanceStatus.ACTIVE,
    maintenanceMessage: null,
    requiredPermissions: ['attendance.view'],
    dependencies: ['feat_student_management'],
    updatedById: 'user-admin',
    updatedByName: 'Admin',
    changeNotes: 'Awal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeatureNotImplemented = {
    key: 'feat_grading_examination',
    name: 'Modul Penilaian & Ujian CBT',
    description: 'Ujian berbasis komputer dan penilaian rapor',
    category: 'Academic Evaluation',
    route: '/exams',
    implementationStatus: FeatureImplementationStatus.NOT_IMPLEMENTED,
    isEnabled: false,
    maintenanceStatus: FeatureMaintenanceStatus.ACTIVE,
    maintenanceMessage: null,
    requiredPermissions: ['grades.view'],
    dependencies: ['feat_academic_structure'],
    updatedById: null,
    updatedByName: null,
    changeNotes: 'Belum diimplementasikan',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      featureRegistry: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(13),
        create: jest.fn(),
      },
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeaturesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FeaturesService>(FeaturesService);
  });

  describe('findAll & findOne', () => {
    it('harus mengembalikan seluruh daftar registri fitur sistem', async () => {
      prisma.featureRegistry.findMany.mockResolvedValue([mockFeatureImplemented]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('feat_attendance_session');
    });

    it('harus melempar NotFoundException jika fitur tidak terdaftar', async () => {
      prisma.featureRegistry.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown_key')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Pencegahan Aktivasi Semu (Rule 2 & 9)', () => {
    it('harus menolak aktivasi jika fitur berstatus NOT_IMPLEMENTED', async () => {
      prisma.featureRegistry.findUnique.mockResolvedValue(mockFeatureNotImplemented);

      await expect(
        service.update(
          'feat_grading_examination',
          { isEnabled: true },
          { id: 'dev-1', username: 'developer', role: 'DEVELOPER' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Validasi Dependensi Wajib', () => {
    it('harus menolak pengaktifan jika dependensi induk sedang nonaktif', async () => {
      prisma.featureRegistry.findUnique.mockResolvedValue(mockFeatureImplemented);
      prisma.featureRegistry.findMany.mockResolvedValue([
        {
          key: 'feat_student_management',
          name: 'Manajemen Siswa',
          isEnabled: false, // Dependency is disabled!
        },
      ]);

      await expect(
        service.update(
          'feat_attendance_session',
          { isEnabled: true },
          { id: 'dev-1', username: 'developer', role: 'DEVELOPER' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Aktivasi, Maintenance Mode, & Audit Trail', () => {
    it('harus berhasil mengubah status dan mencatat jejak audit dengan nilai lama dan baru', async () => {
      prisma.featureRegistry.findUnique.mockResolvedValue(mockFeatureImplemented);
      prisma.featureRegistry.findMany.mockResolvedValue([
        { key: 'feat_student_management', name: 'Manajemen Siswa', isEnabled: true },
      ]);
      const updatedMock = {
        ...mockFeatureImplemented,
        isEnabled: false,
        changeNotes: 'Penonaktifan sementara untuk audit keamanan',
      };
      prisma.featureRegistry.update.mockResolvedValue(updatedMock);

      const result = await service.update(
        'feat_attendance_session',
        { isEnabled: false, changeNotes: 'Penonaktifan sementara untuk audit keamanan' },
        { id: 'dev-1', username: 'developer', role: 'DEVELOPER' },
        '127.0.0.1',
        'Mozilla/5.0 Test',
      );

      expect(result.isEnabled).toBe(false);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FEATURE_FLAG_UPDATE',
          entity: 'FeatureRegistry',
          entityId: 'feat_attendance_session',
          oldValue: expect.objectContaining({ isEnabled: true }),
          newValue: expect.objectContaining({ isEnabled: false }),
        }),
      );
    });

    it('harus mencatat FEATURE_MAINTENANCE_TOGGLE saat maintenance mode diaktifkan', async () => {
      prisma.featureRegistry.findUnique.mockResolvedValue(mockFeatureImplemented);
      const updatedMock = {
        ...mockFeatureImplemented,
        maintenanceStatus: FeatureMaintenanceStatus.MAINTENANCE,
        maintenanceMessage: 'Pemeliharaan server data presensi',
      };
      prisma.featureRegistry.update.mockResolvedValue(updatedMock);

      const result = await service.update(
        'feat_attendance_session',
        {
          maintenanceStatus: FeatureMaintenanceStatus.MAINTENANCE,
          maintenanceMessage: 'Pemeliharaan server data presensi',
        },
        { id: 'dev-1', username: 'developer', role: 'DEVELOPER' },
      );

      expect(result.maintenanceStatus).toBe(FeatureMaintenanceStatus.MAINTENANCE);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FEATURE_MAINTENANCE_TOGGLE',
        }),
      );
    });
  });

  describe('getPermissionMatrix', () => {
    it('harus mengembalikan katalog izin granular dan matriks role', async () => {
      const matrix = await service.getPermissionMatrix();
      expect(matrix.permissions.length).toBeGreaterThan(20);
      expect(matrix.roles).toContain('DEVELOPER');
      expect(matrix.roles).toContain('ADMIN');
      expect(matrix.roles).toContain('TEACHER');
      expect(matrix.matrix.DEVELOPER).toEqual(
        expect.arrayContaining(['users.view', 'developer.manage_features']),
      );
      expect(matrix.matrix.DEVELOPER).not.toContain('attendance.create');
      expect(matrix.matrix.TEACHER).toContain('attendance.create');
    });
  });
});
