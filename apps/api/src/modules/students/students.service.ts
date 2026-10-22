import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: QueryStudentDto, currentUser: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Strict role-based scoping: Student can only ever see their own record
    if (currentUser.role === Role.STUDENT) {
      where.id = currentUser.studentId;
    }

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { nis: { contains: query.search } },
        { nisn: { contains: query.search } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy === 'name' || query.sortBy === 'fullName') {
      orderBy.fullName = query.sortOrder || 'asc';
    } else if (query.sortBy === 'nis') {
      orderBy.nis = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = query.sortOrder || 'desc';
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          currentClass: {
            select: {
              id: true,
              name: true,
              level: true,
              major: true,
            },
          },
        },
      }),
    ]);

    return {
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    // Student can only view their own profile
    if (currentUser.role === Role.STUDENT && currentUser.studentId !== id) {
      throw new ForbiddenException('Akses ditolak: Anda hanya dapat melihat data pribadi Anda');
    }

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        currentClass: {
          include: {
            homeroomTeacher: true,
            academicYear: true,
          },
        },
        enrollments: {
          include: {
            schoolClass: true,
            academicYear: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attendanceRecords: {
          take: 20,
          orderBy: { recordedAt: 'desc' },
          include: {
            session: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
        },
        permissionRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Data siswa dengan ID '${id}' tidak ditemukan`);
    }

    return student;
  }

  async create(createDto: CreateStudentDto, currentUser: any, ip?: string, userAgent?: string) {
    const existingNis = await this.prisma.student.findUnique({
      where: { nis: createDto.nis },
    });
    if (existingNis) {
      throw new ConflictException(`Siswa dengan NIS '${createDto.nis}' sudah terdaftar`);
    }

    const existingNisn = await this.prisma.student.findUnique({
      where: { nisn: createDto.nisn },
    });
    if (existingNisn) {
      throw new ConflictException(`Siswa dengan NISN '${createDto.nisn}' sudah terdaftar`);
    }

    const targetClass = await this.prisma.class.findUnique({
      where: { id: createDto.classId },
    });
    if (!targetClass) {
      throw new NotFoundException(`Kelas dengan ID '${createDto.classId}' tidak ditemukan`);
    }

    // Hash default password for student login account
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create User account
      const user = await tx.user.create({
        data: {
          username: createDto.nis,
          email: `${createDto.nis}@siswa.smapemberdayaanbangsa.sch.id`,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      // 2. Create Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          nis: createDto.nis,
          nisn: createDto.nisn,
          fullName: createDto.fullName,
          gender: createDto.gender,
          classId: createDto.classId,
          phone: createDto.phone,
          parentName: createDto.parentName,
          parentPhone: createDto.parentPhone,
          address: createDto.address,
          status: createDto.status || 'AKTIF',
        },
        include: {
          currentClass: true,
        },
      });

      // 3. Create ClassEnrollment
      await tx.classEnrollment.create({
        data: {
          studentId: student.id,
          classId: targetClass.id,
          academicYearId: targetClass.academicYearId,
          status: 'ACTIVE',
        },
      });

      return student;
    });

    // Record audit log
    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'STUDENT_CREATED',
      entity: 'STUDENT',
      entityId: result.id,
      newValue: { nis: result.nis, fullName: result.fullName, classId: result.classId },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async update(id: string, updateDto: UpdateStudentDto, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Data siswa dengan ID '${id}' tidak ditemukan`);
    }

    if (updateDto.nis && updateDto.nis !== existing.nis) {
      const duplicateNis = await this.prisma.student.findUnique({ where: { nis: updateDto.nis } });
      if (duplicateNis) throw new ConflictException(`NIS '${updateDto.nis}' sudah digunakan`);
    }

    if (updateDto.nisn && updateDto.nisn !== existing.nisn) {
      const duplicateNisn = await this.prisma.student.findUnique({ where: { nisn: updateDto.nisn } });
      if (duplicateNisn) throw new ConflictException(`NISN '${updateDto.nisn}' sudah digunakan`);
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: updateDto,
      include: { currentClass: true },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'STUDENT_UPDATED',
      entity: 'STUDENT',
      entityId: id,
      oldValue: { fullName: existing.fullName, status: existing.status, classId: existing.classId },
      newValue: { fullName: updated.fullName, status: updated.status, classId: updated.classId },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async delete(id: string, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Data siswa dengan ID '${id}' tidak ditemukan`);
    }

    const recordCount = await this.prisma.attendanceRecord.count({ where: { studentId: id } });
    if (recordCount > 0) {
      const updated = await this.prisma.student.update({
        where: { id },
        data: { status: 'NON_AKTIF' },
      });
      await this.auditService.record({
        userId: currentUser.id,
        actorName: currentUser.fullName || currentUser.username,
        actorRole: currentUser.role,
        action: 'STUDENT_DEACTIVATED',
        entity: 'STUDENT',
        entityId: id,
        ipAddress: ip,
        userAgent,
      });
      return { message: 'Siswa dinonaktifkan karena telah memiliki riwayat kehadiran', data: updated };
    }

    await this.prisma.student.delete({ where: { id } });
    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'STUDENT_DELETED',
      entity: 'STUDENT',
      entityId: id,
      ipAddress: ip,
      userAgent,
    });
    return { message: 'Data siswa berhasil dihapus' };
  }
}
