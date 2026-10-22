import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PermissionStatus, Role } from '@prisma/client';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      permissionRequest: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe('findOne data isolation', () => {
    it('harus menolak siswa jika mencoba melihat data permohonan izin milik siswa lain', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        studentId: 'student-other',
      });

      await expect(
        service.findOne('perm-1', {
          role: Role.STUDENT,
          studentId: 'my-student-id',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak guru jika mencoba melihat izin siswa di luar kelas perwaliannya (IDOR prevention)', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        studentId: 'student-1',
        schoolClass: { homeroomTeacherId: 'teacher-wali-asli' },
      });

      await expect(
        service.findOne('perm-1', {
          role: Role.TEACHER,
          teacherId: 'teacher-intruder',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approve workflow', () => {
    it('harus berhasil menyetujui izin yang berstatus MENUNGGU dan mencatat audit log', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.MENUNGGU,
        student: { fullName: 'Aditya' },
      });

      prisma.permissionRequest.update.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.DISETUJUI,
        reviewNotes: 'Surat dokter valid',
      });

      const result = await service.approve(
        'perm-1',
        { note: 'Surat dokter valid' },
        { id: 'u-1', role: Role.TEACHER, teacherId: 't-1' },
      );

      expect(result.status).toBe(PermissionStatus.DISETUJUI);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PERMISSION_REQUEST_APPROVED' }),
      );
    });

    it('harus menolak persetujuan jika permohonan izin sudah diproses sebelumnya', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.DISETUJUI,
      });

      await expect(
        service.approve('perm-1', {}, { id: 'u-1', role: Role.TEACHER }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
