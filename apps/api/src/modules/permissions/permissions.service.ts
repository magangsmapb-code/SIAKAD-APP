import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ReviewPermissionDto } from './dto/review-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { PermissionStatus, Role } from '@prisma/client';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private storageService: StorageService,
  ) {}

  async create(createDto: CreatePermissionDto, currentUser: any, ip?: string, userAgent?: string) {
    let studentId = createDto.studentId;
    let classId: string;

    if (currentUser.role === Role.STUDENT) {
      studentId = currentUser.studentId;
      classId = currentUser.classId;
    } else {
      if (!studentId) {
        throw new BadRequestException('ID Siswa wajib dicantumkan');
      }
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) throw new NotFoundException('Siswa tidak ditemukan');
      classId = student.classId;
    }

    const start = new Date(createDto.startDate);
    const end = new Date(createDto.endDate);

    const permission = await this.prisma.permissionRequest.create({
      data: {
        studentId,
        classId,
        type: createDto.type,
        startDate: start,
        endDate: end,
        totalDays: createDto.totalDays || 1,
        reason: createDto.reason,
        attachmentName: createDto.attachmentName,
        attachmentUrl: createDto.attachmentUrl,
        status: PermissionStatus.MENUNGGU,
      },
      include: {
        student: { select: { id: true, nis: true, fullName: true } },
        schoolClass: { select: { id: true, name: true } },
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'PERMISSION_REQUEST_CREATED',
      entity: 'PERMISSION_REQUEST',
      entityId: permission.id,
      newValue: {
        studentName: permission.student.fullName,
        type: permission.type,
        totalDays: permission.totalDays,
      },
      ipAddress: ip,
      userAgent,
    });

    return permission;
  }

  async findAll(query: QueryPermissionDto, currentUser: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (currentUser.role === Role.STUDENT && currentUser.studentId) {
      where.studentId = currentUser.studentId;
    } else if (currentUser.role === Role.TEACHER && currentUser.teacherId) {
      // Homeroom teachers can view permissions for their class
      where.schoolClass = {
        homeroomTeacherId: currentUser.teacherId,
      };
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.classId) where.classId = query.classId;
    if (query.studentId) where.studentId = query.studentId;

    const [total, permissions] = await Promise.all([
      this.prisma.permissionRequest.count({ where }),
      this.prisma.permissionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, nis: true, fullName: true, gender: true },
          },
          schoolClass: {
            select: { id: true, name: true, level: true },
          },
          reviewedBy: {
            select: { id: true, fullName: true, nip: true },
          },
        },
      }),
    ]);

    return {
      data: permissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any, ip?: string, userAgent?: string) {
    const permission = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, nis: true, fullName: true, phone: true, parentPhone: true },
        },
        schoolClass: true,
        reviewedBy: {
          select: { id: true, fullName: true, nip: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Pengajuan izin '${id}' tidak ditemukan`);
    }

    if (currentUser.role === Role.STUDENT && permission.studentId !== currentUser.studentId) {
      throw new ForbiddenException('Akses ditolak: Anda hanya dapat melihat pengajuan izin milik Anda');
    }

    if (
      currentUser.role === Role.TEACHER &&
      currentUser.teacherId &&
      permission.schoolClass?.homeroomTeacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException('Akses ditolak: Anda bukan wali kelas dari siswa yang mengajukan izin ini');
    }

    let signedAttachmentUrl: string | null = null;
    if (permission.attachmentUrl) {
      try {
        signedAttachmentUrl = await this.storageService.getSignedUrl(permission.attachmentUrl, 900);
        await this.auditService.record({
          userId: currentUser.id,
          actorName: currentUser.fullName || currentUser.username,
          actorRole: currentUser.role,
          action: 'PERMISSION_ATTACHMENT_ACCESSED',
          entity: 'PERMISSION_REQUEST',
          entityId: id,
          newValue: {
            attachmentPath: permission.attachmentUrl,
            expiresInSeconds: 900,
          },
          ipAddress: ip,
          userAgent,
        });
      } catch (err: any) {
        this.logger.warn(`Could not generate signed URL for permission attachment ${id}: ${err.message}`);
      }
    }

    return {
      ...permission,
      attachmentUrl: signedAttachmentUrl || permission.attachmentUrl,
      signedAttachmentUrl,
    };
  }

  async approve(id: string, dto: ReviewPermissionDto, currentUser: any, ip?: string, userAgent?: string) {
    const permission = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: { student: true, schoolClass: true },
    });

    if (!permission) throw new NotFoundException('Pengajuan izin tidak ditemukan');

    if (permission.status !== PermissionStatus.MENUNGGU) {
      throw new BadRequestException(`Pengajuan izin sudah diproses dengan status '${permission.status}'`);
    }

    if (currentUser.role === Role.STUDENT) {
      throw new ForbiddenException('Siswa tidak memiliki wewenang untuk menyetujui izin');
    }

    if (
      currentUser.role === Role.TEACHER &&
      currentUser.teacherId &&
      permission.schoolClass?.homeroomTeacherId &&
      permission.schoolClass.homeroomTeacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException(
        'Akses ditolak: Hanya wali kelas siswa bersangkutan yang berwenang menyetujui izin ini',
      );
    }

    const approved = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: PermissionStatus.DISETUJUI,
        reviewedById: currentUser.teacherId || null,
        reviewedAt: new Date(),
        reviewNotes: dto.note || 'Pengajuan izin disetujui',
      },
      include: {
        student: true,
        schoolClass: true,
        reviewedBy: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'PERMISSION_REQUEST_APPROVED',
      entity: 'PERMISSION_REQUEST',
      entityId: id,
      oldValue: { status: permission.status },
      newValue: { status: approved.status, notes: approved.reviewNotes },
      ipAddress: ip,
      userAgent,
    });

    return approved;
  }

  async reject(id: string, dto: ReviewPermissionDto, currentUser: any, ip?: string, userAgent?: string) {
    const permission = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: { student: true, schoolClass: true },
    });

    if (!permission) throw new NotFoundException('Pengajuan izin tidak ditemukan');

    if (permission.status !== PermissionStatus.MENUNGGU) {
      throw new BadRequestException(`Pengajuan izin sudah diproses dengan status '${permission.status}'`);
    }

    if (currentUser.role === Role.STUDENT) {
      throw new ForbiddenException('Siswa tidak memiliki wewenang untuk menolak izin');
    }

    if (
      currentUser.role === Role.TEACHER &&
      currentUser.teacherId &&
      permission.schoolClass?.homeroomTeacherId &&
      permission.schoolClass.homeroomTeacherId !== currentUser.teacherId
    ) {
      throw new ForbiddenException(
        'Akses ditolak: Hanya wali kelas siswa bersangkutan yang berwenang menolak izin ini',
      );
    }

    const rejected = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: PermissionStatus.DITOLAK,
        reviewedById: currentUser.teacherId || null,
        reviewedAt: new Date(),
        reviewNotes: dto.note || 'Pengajuan izin ditolak',
      },
      include: {
        student: true,
        schoolClass: true,
        reviewedBy: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'PERMISSION_REQUEST_REJECTED',
      entity: 'PERMISSION_REQUEST',
      entityId: id,
      oldValue: { status: permission.status },
      newValue: { status: rejected.status, notes: rejected.reviewNotes },
      ipAddress: ip,
      userAgent,
    });

    return rejected;
  }
}
