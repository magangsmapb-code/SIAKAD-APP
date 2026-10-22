import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PermissionStatus, Role } from '@prisma/client';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: any;
  let auditService: any;
  let storageService: any;

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

    storageService = {
      getSignedUrl: jest.fn().mockResolvedValue('https://aymuesprbohoznguuyym.supabase.co/storage/v1/object/sign/siakad-permissions/permissions/test.png?token=mock'),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StorageService, useValue: storageService },
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

    it('harus menghasilkan signed URL Supabase Storage dan mencatat audit log saat melihat detail izin berlampiran', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        studentId: 'student-1',
        attachmentUrl: 'permissions/2025-2026/uuid-test.png',
        schoolClass: { homeroomTeacherId: 't-1' },
      });

      const res = await service.findOne(
        'perm-1',
        { id: 'u-1', role: Role.TEACHER, teacherId: 't-1', fullName: 'Budi' },
        '127.0.0.1',
        'Jest/Test',
      );

      expect(storageService.getSignedUrl).toHaveBeenCalledWith('permissions/2025-2026/uuid-test.png', 900);
      expect(res.signedAttachmentUrl).toBeDefined();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PERMISSION_ATTACHMENT_ACCESSED' }),
      );
    });
  });

  describe('approve workflow', () => {
    it('harus berhasil menyetujui izin yang berstatus MENUNGGU dan mencatat audit log', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.MENUNGGU,
        student: { fullName: 'Aditya' },
        schoolClass: { homeroomTeacherId: 't-1' },
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

    it('harus menolak guru jika mencoba menyetujui izin siswa bukan di kelas perwaliannya (IDOR)', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.MENUNGGU,
        student: { fullName: 'Aditya' },
        schoolClass: { homeroomTeacherId: 't-other' },
      });

      await expect(
        service.approve(
          'perm-1',
          { note: 'Ilegal approval' },
          { id: 'u-1', role: Role.TEACHER, teacherId: 't-intruder' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak persetujuan jika permohonan izin sudah diproses sebelumnya', async () => {
      prisma.permissionRequest.findUnique.mockResolvedValue({
        id: 'perm-1',
        status: PermissionStatus.DISETUJUI,
        schoolClass: { homeroomTeacherId: 't-1' },
      });

      await expect(
        service.approve('perm-1', {}, { id: 'u-1', role: Role.TEACHER, teacherId: 't-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
