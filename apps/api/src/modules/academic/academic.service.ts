import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { DayOfWeek, Role } from '@prisma/client';

@Injectable()
export class AcademicService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Academic Years
  // ---------------------------------------------------------------------------
  async findAllAcademicYears() {
    return this.prisma.academicYear.findMany({
      orderBy: [{ name: 'desc' }, { semester: 'asc' }],
    });
  }

  async findActiveAcademicYear() {
    const active = await this.prisma.academicYear.findFirst({
      where: { isActive: true },
    });
    if (!active) {
      throw new NotFoundException('Tidak ada tahun ajaran aktif yang dikonfigurasi');
    }
    return active;
  }

  async createAcademicYear(dto: CreateAcademicYearDto, currentUser: any) {
    const existing = await this.prisma.academicYear.findUnique({
      where: {
        name_semester: {
          name: dto.name,
          semester: dto.semester,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Tahun ajaran '${dto.name}' semester ${dto.semester} sudah terdaftar`,
      );
    }

    if (dto.isActive) {
      // Deactivate others
      await this.prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const created = await this.prisma.academicYear.create({
      data: {
        name: dto.name,
        semester: dto.semester,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive || false,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ACADEMIC_YEAR_CREATED',
      entity: 'ACADEMIC_YEAR',
      entityId: created.id,
      newValue: { name: created.name, semester: created.semester, isActive: created.isActive },
    });

    return created;
  }

  async setActiveAcademicYear(id: string, currentUser: any) {
    const target = await this.prisma.academicYear.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Tahun ajaran tidak ditemukan');

    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prisma.academicYear.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ACADEMIC_YEAR_ACTIVATED',
      entity: 'ACADEMIC_YEAR',
      entityId: id,
      newValue: { name: target.name, semester: target.semester },
    });

    return { success: true, message: `Tahun ajaran ${target.name} ${target.semester} berhasil diaktifkan` };
  }

  // ---------------------------------------------------------------------------
  // Classes
  // ---------------------------------------------------------------------------
  async findAllClasses(query: { academicYearId?: string; level?: string; major?: string }) {
    const where: any = {};
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.level) where.level = query.level as any;
    if (query.major) where.major = query.major as any;

    return this.prisma.class.findMany({
      where,
      include: {
        homeroomTeacher: {
          select: { id: true, nip: true, fullName: true, phone: true },
        },
        academicYear: {
          select: { id: true, name: true, semester: true, isActive: true },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findClassById(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        homeroomTeacher: true,
        academicYear: true,
        students: {
          where: { status: 'AKTIF' },
          select: {
            id: true,
            nis: true,
            nisn: true,
            fullName: true,
            gender: true,
            phone: true,
            status: true,
          },
          orderBy: { nis: 'asc' },
        },
        schedules: {
          include: {
            subject: true,
            teacher: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(`Kelas dengan ID '${id}' tidak ditemukan`);
    }

    return cls;
  }

  async createClass(dto: CreateClassDto, currentUser: any) {
    const existing = await this.prisma.class.findUnique({
      where: {
        name_academicYearId: {
          name: dto.name,
          academicYearId: dto.academicYearId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Kelas '${dto.name}' sudah ada pada tahun ajaran tersebut`);
    }

    const created = await this.prisma.class.create({
      data: dto,
      include: { homeroomTeacher: true, academicYear: true },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'CLASS_CREATED',
      entity: 'CLASS',
      entityId: created.id,
      newValue: { name: created.name, level: created.level, major: created.major },
    });

    return created;
  }

  async updateClass(id: string, dto: Partial<CreateClassDto>, currentUser: any) {
    const existing = await this.prisma.class.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kelas tidak ditemukan');

    const updated = await this.prisma.class.update({
      where: { id },
      data: dto,
      include: { homeroomTeacher: true, academicYear: true },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'CLASS_UPDATED',
      entity: 'CLASS',
      entityId: id,
      oldValue: { name: existing.name, homeroomTeacherId: existing.homeroomTeacherId },
      newValue: { name: updated.name, homeroomTeacherId: updated.homeroomTeacherId },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------------
  async findAllSubjects(query: { category?: string; search?: string }) {
    const where: any = {};
    if (query.category) where.category = query.category as any;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async findSubjectById(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachingAssignments: {
          include: {
            teacher: true,
            schoolClass: true,
          },
        },
      },
    });

    if (!subject) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return subject;
  }

  async createSubject(dto: CreateSubjectDto, currentUser: any) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Mata pelajaran dengan kode '${dto.code}' sudah terdaftar`);
    }

    const created = await this.prisma.subject.create({
      data: dto,
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SUBJECT_CREATED',
      entity: 'SUBJECT',
      entityId: created.id,
      newValue: { code: created.code, name: created.name },
    });

    return created;
  }

  async updateSubject(id: string, dto: Partial<CreateSubjectDto>, currentUser: any) {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mata pelajaran tidak ditemukan');

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.subject.findUnique({ where: { code: dto.code } });
      if (duplicate) throw new ConflictException(`Kode mapel '${dto.code}' sudah digunakan`);
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data: dto,
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SUBJECT_UPDATED',
      entity: 'SUBJECT',
      entityId: id,
      oldValue: { code: existing.code, name: existing.name },
      newValue: { code: updated.code, name: updated.name },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Schedules
  // ---------------------------------------------------------------------------
  async findAllSchedules(
    query: { classId?: string; teacherId?: string; dayOfWeek?: DayOfWeek },
    currentUser?: any,
  ) {
    const where: any = { isActive: true };

    if (currentUser?.role === Role.STUDENT) {
      let studentClassId = currentUser.classId;
      if (!studentClassId) {
        const student = await this.prisma.student.findFirst({
          where: { userId: currentUser.id },
          select: { classId: true },
        });
        studentClassId = student?.classId;
      }

      if (query.classId && query.classId !== studentClassId) {
        throw new ForbiddenException('Akses ditolak: Siswa hanya dapat mengakses jadwal kelasnya sendiri');
      }

      where.classId = studentClassId;
    } else {
      if (query.classId) where.classId = query.classId;
    }

    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.dayOfWeek) where.dayOfWeek = query.dayOfWeek;

    return this.prisma.schedule.findMany({
      where,
      include: {
        schoolClass: { select: { id: true, name: true, level: true, roomNumber: true } },
        subject: { select: { id: true, code: true, name: true } },
        teacher: { select: { id: true, nip: true, fullName: true, title: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createSchedule(dto: CreateScheduleDto, currentUser: any) {
    // Check time conflicts for teacher or class on the same day
    const teacherConflict = await this.prisma.schedule.findFirst({
      where: {
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        isActive: true,
        OR: [
          {
            AND: [{ startTime: { lte: dto.startTime } }, { endTime: { gt: dto.startTime } }],
          },
          {
            AND: [{ startTime: { lt: dto.endTime } }, { endTime: { gte: dto.endTime } }],
          },
        ],
      },
      include: { schoolClass: true },
    });

    if (teacherConflict) {
      throw new BadRequestException(
        `Jadwal bentrok: Guru telah mengajar di kelas ${teacherConflict.schoolClass.name} pada jam tersebut`,
      );
    }

    const created = await this.prisma.schedule.create({
      data: dto,
      include: {
        schoolClass: true,
        subject: true,
        teacher: true,
      },
    });

    const schoolClass = created.schoolClass as { name: string } | undefined;
    const subject = created.subject as { name: string } | undefined;
    const teacher = created.teacher as { fullName: string } | undefined;

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SCHEDULE_CREATED',
      entity: 'SCHEDULE',
      entityId: created.id,
      newValue: {
        class: schoolClass?.name || dto.classId,
        subject: subject?.name || dto.subjectId,
        teacher: teacher?.fullName || dto.teacherId,
        day: created.dayOfWeek,
        time: `${created.startTime}-${created.endTime}`,
      },
    });

    return created;
  }

  async updateSchedule(id: string, dto: Partial<CreateScheduleDto>, currentUser: any) {
    const existing = await this.prisma.schedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Jadwal pelajaran tidak ditemukan');

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: {
        schoolClass: { select: { id: true, name: true, level: true, roomNumber: true } },
        subject: { select: { id: true, code: true, name: true } },
        teacher: { select: { id: true, nip: true, fullName: true, title: true } },
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SCHEDULE_UPDATED',
      entity: 'SCHEDULE',
      entityId: id,
      newValue: dto,
    });

    return updated;
  }

  async deleteSchedule(id: string, currentUser: any) {
    const existing = await this.prisma.schedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Jadwal pelajaran tidak ditemukan');

    await this.prisma.schedule.delete({ where: { id } });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SCHEDULE_DELETED',
      entity: 'SCHEDULE',
      entityId: id,
    });

    return { message: 'Jadwal pelajaran berhasil dihapus' };
  }

  async deleteClass(id: string, currentUser: any) {
    const existing = await this.prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
        schedules: true,
        attendanceSessions: true,
      },
    });

    if (!existing) throw new NotFoundException('Kelas tidak ditemukan');

    if (existing.students.length > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus kelas '${existing.name}' karena masih memiliki ${existing.students.length} siswa terdaftar. Pindahkan siswa terlebih dahulu.`,
      );
    }

    if (existing.schedules.length > 0 || existing.attendanceSessions.length > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus kelas '${existing.name}' karena masih memiliki riwayat jadwal atau sesi presensi aktif.`,
      );
    }

    await this.prisma.class.delete({ where: { id } });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'CLASS_DELETED',
      entity: 'CLASS',
      entityId: id,
      oldValue: { name: existing.name },
    });

    return { message: `Kelas '${existing.name}' berhasil dihapus` };
  }

  async deleteSubject(id: string, currentUser: any) {
    const existing = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachingAssignments: true,
        schedules: true,
        attendanceSessions: true,
      },
    });

    if (!existing) throw new NotFoundException('Mata pelajaran tidak ditemukan');

    if (
      existing.teachingAssignments.length > 0 ||
      existing.schedules.length > 0 ||
      existing.attendanceSessions.length > 0
    ) {
      throw new BadRequestException(
        `Tidak dapat menghapus mata pelajaran '${existing.name}' karena masih memiliki penugasan guru, jadwal, atau sesi presensi aktif.`,
      );
    }

    await this.prisma.subject.delete({ where: { id } });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SUBJECT_DELETED',
      entity: 'SUBJECT',
      entityId: id,
      oldValue: { name: existing.name, code: existing.code },
    });

    return { message: `Mata pelajaran '${existing.name}' berhasil dihapus` };
  }
}

