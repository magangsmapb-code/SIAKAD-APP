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

  private async resolveTeacherId(currentUser: any): Promise<string> {
    if (currentUser.teacherId || currentUser.teacher?.id) {
      return currentUser.teacherId || currentUser.teacher.id;
    }
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (!teacher) {
      throw new ForbiddenException('Data profil guru tidak ditemukan untuk akun ini.');
    }
    return teacher.id;
  }

  private async resolveStudentId(currentUser: any): Promise<string> {
    if (currentUser.studentId || currentUser.student?.id) {
      return currentUser.studentId || currentUser.student.id;
    }
    const student = await this.prisma.student.findFirst({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (!student) {
      throw new ForbiddenException('Data profil murid tidak ditemukan untuk akun ini.');
    }
    return student.id;
  }

  async create(createDto: CreatePermissionDto, currentUser: any, ip?: string, userAgent?: string) {
    let studentId = createDto.studentId;
    let classId: string;

    if (currentUser.role === Role.STUDENT) {
      const myStudentId = await this.resolveStudentId(currentUser);
      if (createDto.studentId && createDto.studentId !== myStudentId) {
        throw new ForbiddenException('Akses ditolak: Anda tidak dapat mengajukan izin atas nama siswa lain');
      }
      studentId = myStudentId;

      let myClassId = currentUser.classId;
      if (!myClassId) {
        const student = await this.prisma.student.findUnique({
          where: { id: myStudentId },
          select: { classId: true },
        });
        myClassId = student?.classId;
      }
      if (!myClassId) {
        throw new BadRequestException('Siswa belum terdaftar pada rombel kelas aktif.');
      }
      classId = myClassId;
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

    if (currentUser.role === Role.STUDENT) {
      const studentId = await this.resolveStudentId(currentUser);
      if (query.studentId && query.studentId !== studentId) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat melihat data izin milik Anda sendiri');
      }
      where.studentId = studentId;
    } else if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      where.schoolClass = {
        homeroomTeacherId: teacherId,
      };
      if (query.classId) {
        where.classId = query.classId;
      }
      if (query.studentId) {
        where.studentId = query.studentId;
      }
    } else {
      if (query.classId) where.classId = query.classId;
      if (query.studentId) where.studentId = query.studentId;
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

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

    if (currentUser.role === Role.STUDENT) {
      const studentId = await this.resolveStudentId(currentUser);
      if (permission.studentId !== studentId) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat melihat pengajuan izin milik Anda');
      }
    }

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        !permission.schoolClass?.homeroomTeacherId ||
        permission.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException('Akses ditolak: Anda bukan wali kelas dari siswa yang mengajukan izin ini');
      }
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

    let reviewerTeacherId: string | null = null;
    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        !permission.schoolClass?.homeroomTeacherId ||
        permission.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException(
          'Akses ditolak: Hanya wali kelas siswa bersangkutan yang berwenang menyetujui izin ini',
        );
      }
      reviewerTeacherId = teacherId;
    }

    const approved = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: PermissionStatus.DISETUJUI,
        reviewedById: reviewerTeacherId,
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

    let reviewerTeacherId: string | null = null;
    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        !permission.schoolClass?.homeroomTeacherId ||
        permission.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException(
          'Akses ditolak: Hanya wali kelas siswa bersangkutan yang berwenang menolak izin ini',
        );
      }
      reviewerTeacherId = teacherId;
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
