import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: QueryTeacherDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isHomeroom !== undefined) {
      where.isHomeroom = query.isHomeroom;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { nip: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { roleTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, teachers] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        include: {
          homeroomClasses: {
            select: {
              id: true,
              name: true,
              level: true,
              major: true,
            },
          },
          teachingAssignments: {
            include: {
              schoolClass: { select: { id: true, name: true } },
              subject: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: teachers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        homeroomClasses: {
          include: {
            academicYear: true,
            students: {
              select: {
                id: true,
                nis: true,
                fullName: true,
                gender: true,
                status: true,
              },
            },
          },
        },
        teachingAssignments: {
          include: {
            schoolClass: true,
            subject: true,
            academicYear: true,
          },
        },
        attendanceSessions: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            schoolClass: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Data guru dengan ID '${id}' tidak ditemukan`);
    }

    return teacher;
  }

  async create(createDto: CreateTeacherDto, currentUser: any, ip?: string, userAgent?: string) {
    const existingNip = await this.prisma.teacher.findUnique({
      where: { nip: createDto.nip },
    });
    if (existingNip) {
      throw new ConflictException(`Guru dengan NIP '${createDto.nip}' sudah terdaftar`);
    }

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: createDto.nip,
          email: createDto.email || `${createDto.nip}@smapemberdayaanbangsa.sch.id`,
          passwordHash,
          role: Role.TEACHER,
          isActive: true,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          nip: createDto.nip,
          nuptk: createDto.nuptk,
          fullName: createDto.fullName,
          title: createDto.title,
          email: createDto.email,
          phone: createDto.phone,
          roleTitle: createDto.roleTitle,
          isHomeroom: createDto.isHomeroom || false,
          status: createDto.status || 'AKTIF',
        },
      });

      return teacher;
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'TEACHER_CREATED',
      entity: 'TEACHER',
      entityId: result.id,
      newValue: { nip: result.nip, fullName: result.fullName },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async update(id: string, updateDto: UpdateTeacherDto, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Data guru dengan ID '${id}' tidak ditemukan`);
    }

    if (updateDto.nip && updateDto.nip !== existing.nip) {
      const duplicateNip = await this.prisma.teacher.findUnique({ where: { nip: updateDto.nip } });
      if (duplicateNip) throw new ConflictException(`NIP '${updateDto.nip}' sudah digunakan`);
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: updateDto,
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'TEACHER_UPDATED',
      entity: 'TEACHER',
      entityId: id,
      oldValue: { fullName: existing.fullName, status: existing.status },
      newValue: { fullName: updated.fullName, status: updated.status },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async remove(id: string, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        homeroomClasses: true,
        teachingAssignments: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Data guru dengan ID '${id}' tidak ditemukan`);
    }

    const attendanceCount = await this.prisma.teacherAttendance.count({
      where: { teacherId: id },
    });

    const sessionCount = await this.prisma.attendanceSession.count({
      where: { teacherId: id },
    });

    if (
      existing.homeroomClasses.length > 0 ||
      existing.teachingAssignments.length > 0 ||
      attendanceCount > 0 ||
      sessionCount > 0
    ) {
      const updated = await this.prisma.teacher.update({
        where: { id },
        data: { status: 'NON_AKTIF' },
      });

      await this.auditService.record({
        userId: currentUser.id,
        actorName: currentUser.fullName || currentUser.username,
        actorRole: currentUser.role,
        action: 'TEACHER_DEACTIVATED',
        entity: 'TEACHER',
        entityId: id,
        ipAddress: ip,
        userAgent,
      });

      return {
        message: 'Guru dinonaktifkan karena telah memiliki riwayat akademik/kehadiran',
        data: updated,
      };
    }

    await this.prisma.teacher.delete({ where: { id } });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'TEACHER_DELETED',
      entity: 'TEACHER',
      entityId: id,
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Data guru berhasil dihapus' };
  }
}

