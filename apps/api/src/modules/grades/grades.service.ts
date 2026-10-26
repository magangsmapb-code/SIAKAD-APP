import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { BatchGradeDto } from './dto/batch-grade.dto';
import { QueryGradeDto } from './dto/query-grade.dto';
import { GradePredicate, Role, Semester } from '@prisma/client';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Hitung Nilai Akhir & Predikat Kurikulum Merdeka
   */
  public calculateFinalScore(
    formatif: number = 0,
    sumatifMateri: number = 0,
    pts: number = 0,
    pas: number = 0,
    kktp: number = 75,
  ): {
    finalScore: number;
    predicate: GradePredicate;
    isPassed: boolean;
  } {
    const rawScore = formatif * 0.3 + sumatifMateri * 0.3 + pts * 0.2 + pas * 0.2;
    const finalScore = Math.round(rawScore * 100) / 100;

    let predicate: GradePredicate = GradePredicate.D;
    if (finalScore >= 88) {
      predicate = GradePredicate.A;
    } else if (finalScore >= 75) {
      predicate = GradePredicate.B;
    } else if (finalScore >= 60) {
      predicate = GradePredicate.C;
    }

    const isPassed = finalScore >= kktp;

    return { finalScore, predicate, isPassed };
  }

  /**
   * Generator otomatis deskripsi Capaian Pembelajaran Rapor Kurikulum Merdeka
   */
  public generateDefaultCompetencySummary(
    predicate: GradePredicate,
    subjectName: string = 'mata pelajaran',
  ): string {
    switch (predicate) {
      case GradePredicate.A:
        return `Menunjukkan penguasaan yang sangat istimewa dan melampaui seluruh indikator capaian tujuan pembelajaran pada ${subjectName}.`;
      case GradePredicate.B:
        return `Menunjukkan penguasaan materi yang baik dan tuntas dalam mencapai seluruh tujuan pembelajaran pada ${subjectName}.`;
      case GradePredicate.C:
        return `Cukup menguasai capaian pembelajaran pokok pada ${subjectName}, perlu bimbingan mandiri pada beberapa aspek submateri.`;
      case GradePredicate.D:
      default:
        return `Perlu pendampingan intensif dan perbaikan remedial dalam memahami capaian tujuan pembelajaran inti pada ${subjectName}.`;
    }
  }

  private async resolveTeacherId(currentUser: any): Promise<string | null> {
    if (currentUser.teacherId || currentUser.teacher?.id) {
      return currentUser.teacherId || currentUser.teacher.id;
    }
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    return teacher ? teacher.id : null;
  }

  /**
   * Input / Pembaruan Entri Nilai Siswa (Upsert)
   */
  async createOrUpdateGrade(
    dto: CreateGradeDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { currentClass: true },
    });
    if (!student) {
      throw new NotFoundException(`Siswa dengan ID '${dto.studentId}' tidak ditemukan.`);
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Mata pelajaran dengan ID '${dto.subjectId}' tidak ditemukan.`);
    }

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) {
      throw new NotFoundException(`Tahun ajaran dengan ID '${dto.academicYearId}' tidak ditemukan.`);
    }

    let teacherId: string | null = null;
    if (currentUser.role === Role.TEACHER) {
      teacherId = await this.resolveTeacherId(currentUser);
    }

    const formatif = dto.formatif ?? 0;
    const sumatifMateri = dto.sumatifMateri ?? 0;
    const pts = dto.pts ?? 0;
    const pas = dto.pas ?? 0;
    const kktp = dto.kktp ?? 75;
    const semester = dto.semester ?? Semester.GANJIL;

    const { finalScore, predicate, isPassed } = this.calculateFinalScore(
      formatif,
      sumatifMateri,
      pts,
      pas,
      kktp,
    );

    const competencySummary =
      dto.competencySummary?.trim() ||
      this.generateDefaultCompetencySummary(predicate, subject.name);

    const grade = await this.prisma.studentGrade.upsert({
      where: {
        studentId_subjectId_academicYearId_semester: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
          semester,
        },
      },
      create: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        classId: dto.classId || student.classId,
        academicYearId: dto.academicYearId,
        semester,
        teacherId,
        formatif,
        sumatifMateri,
        pts,
        pas,
        finalScore,
        predicate,
        kktp,
        isPassed,
        competencySummary,
      },
      update: {
        classId: dto.classId || undefined,
        teacherId: teacherId || undefined,
        formatif,
        sumatifMateri,
        pts,
        pas,
        finalScore,
        predicate,
        kktp,
        isPassed,
        competencySummary,
      },
      include: {
        student: { select: { fullName: true, nis: true } },
        subject: { select: { name: true, code: true } },
        schoolClass: { select: { name: true } },
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'GRADE_RECORDED',
      entity: 'STUDENT_GRADE',
      entityId: grade.id,
      newValue: {
        student: grade.student.fullName,
        subject: grade.subject.name,
        finalScore,
        predicate,
      },
      ipAddress: ip,
      userAgent,
    });

    return grade;
  }

  /**
   * Batch Input Nilai Seluruh Rombel
   */
  async batchUpsertGrades(
    batchDto: BatchGradeDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    let teacherId: string | null = null;
    if (currentUser.role === Role.TEACHER) {
      teacherId = await this.resolveTeacherId(currentUser);
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: batchDto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException('Mata pelajaran tidak ditemukan');
    }

    const semester = batchDto.semester ?? Semester.GANJIL;
    const results = [];

    for (const item of batchDto.grades) {
      const formatif = item.formatif ?? 0;
      const sumatifMateri = item.sumatifMateri ?? 0;
      const pts = item.pts ?? 0;
      const pas = item.pas ?? 0;
      const kktp = item.kktp ?? 75;

      const { finalScore, predicate, isPassed } = this.calculateFinalScore(
        formatif,
        sumatifMateri,
        pts,
        pas,
        kktp,
      );

      const competencySummary =
        item.competencySummary?.trim() ||
        this.generateDefaultCompetencySummary(predicate, subject.name);

      const saved = await this.prisma.studentGrade.upsert({
        where: {
          studentId_subjectId_academicYearId_semester: {
            studentId: item.studentId,
            subjectId: batchDto.subjectId,
            academicYearId: batchDto.academicYearId,
            semester,
          },
        },
        create: {
          studentId: item.studentId,
          subjectId: batchDto.subjectId,
          classId: batchDto.classId,
          academicYearId: batchDto.academicYearId,
          semester,
          teacherId,
          formatif,
          sumatifMateri,
          pts,
          pas,
          finalScore,
          predicate,
          kktp,
          isPassed,
          competencySummary,
        },
        update: {
          formatif,
          sumatifMateri,
          pts,
          pas,
          finalScore,
          predicate,
          kktp,
          isPassed,
          competencySummary,
          teacherId: teacherId || undefined,
        },
      });

      results.push(saved);
    }

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'BATCH_GRADES_RECORDED',
      entity: 'STUDENT_GRADE',
      entityId: batchDto.classId,
      newValue: {
        classId: batchDto.classId,
        subjectId: batchDto.subjectId,
        count: results.length,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: `Berhasil mencatat nilai Kurikulum Merdeka untuk ${results.length} siswa`,
      count: results.length,
    };
  }

  /**
   * Query Rekapitulasi Nilai dengan Filter & Paginasi
   */
  async findAll(query: QueryGradeDto, currentUser: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Enforce student access scope
    if (currentUser.role === Role.STUDENT) {
      const myStudent = await this.prisma.student.findFirst({
        where: { userId: currentUser.id },
      });
      if (!myStudent) {
        throw new ForbiddenException('Profil siswa tidak ditemukan');
      }
      where.studentId = myStudent.id;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.semester) where.semester = query.semester;
    if (query.predicate) where.predicate = query.predicate;

    const [total, data] = await Promise.all([
      this.prisma.studentGrade.count({ where }),
      this.prisma.studentGrade.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ finalScore: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            select: { id: true, fullName: true, nis: true, nisn: true },
          },
          subject: {
            select: { id: true, name: true, code: true, category: true },
          },
          schoolClass: {
            select: { id: true, name: true, level: true },
          },
          academicYear: {
            select: { id: true, name: true, semester: true },
          },
          teacher: {
            select: { id: true, fullName: true, nip: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Rapor / Transkrip Akademik Individual Siswa
   */
  async findByStudent(studentId: string, query: { academicYearId?: string; semester?: Semester }, currentUser: any) {
    if (currentUser.role === Role.STUDENT) {
      const myStudent = await this.prisma.student.findFirst({
        where: { userId: currentUser.id },
      });
      if (myStudent?.id !== studentId) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat mengakses rapor Anda sendiri');
      }
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: {
          include: {
            homeroomTeacher: { select: { fullName: true, nip: true } },
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    const where: any = { studentId };
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.semester) where.semester = query.semester;

    const grades = await this.prisma.studentGrade.findMany({
      where,
      orderBy: [{ subject: { category: 'asc' } }, { subject: { name: 'asc' } }],
      include: {
        subject: true,
        academicYear: true,
        teacher: { select: { fullName: true, nip: true } },
      },
    });

    const totalScore = grades.reduce((acc, curr) => acc + curr.finalScore, 0);
    const averageScore = grades.length > 0 ? Math.round((totalScore / grades.length) * 100) / 100 : 0;
    const passedCount = grades.filter((g) => g.isPassed).length;
    const failedCount = grades.length - passedCount;

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        nis: student.nis,
        nisn: student.nisn,
        className: student.currentClass?.name,
        homeroomTeacher: student.currentClass?.homeroomTeacher?.fullName,
      },
      summary: {
        totalSubjects: grades.length,
        averageScore,
        passedCount,
        failedCount,
        overallPredicate:
          averageScore >= 88 ? 'A' : averageScore >= 75 ? 'B' : averageScore >= 60 ? 'C' : 'D',
      },
      grades,
    };
  }

  /**
   * Distribusi Nilai & Analisis Kelas
   */
  async getClassSummary(classId: string, subjectId: string, academicYearId?: string, semester?: Semester) {
    const where: any = { classId, subjectId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (semester) where.semester = semester;

    const grades = await this.prisma.studentGrade.findMany({
      where,
      include: {
        student: { select: { fullName: true, nis: true } },
        subject: { select: { name: true } },
        schoolClass: { select: { name: true } },
      },
    });

    if (grades.length === 0) {
      return {
        count: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        distribution: { A: 0, B: 0, C: 0, D: 0 },
        passingPercentage: 0,
        grades: [],
      };
    }

    const scores = grades.map((g) => g.finalScore);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = Math.round((sum / scores.length) * 100) / 100;

    const distribution = {
      A: grades.filter((g) => g.predicate === GradePredicate.A).length,
      B: grades.filter((g) => g.predicate === GradePredicate.B).length,
      C: grades.filter((g) => g.predicate === GradePredicate.C).length,
      D: grades.filter((g) => g.predicate === GradePredicate.D).length,
    };

    const passedCount = grades.filter((g) => g.isPassed).length;
    const passingPercentage = Math.round((passedCount / grades.length) * 1000) / 10;

    return {
      count: grades.length,
      average,
      highest,
      lowest,
      distribution,
      passingPercentage,
      className: grades[0]?.schoolClass?.name,
      subjectName: grades[0]?.subject?.name,
      grades,
    };
  }

  /**
   * Hapus Entri Nilai
   */
  async deleteGrade(id: string, currentUser: any, ip?: string, userAgent?: string) {
    const grade = await this.prisma.studentGrade.findUnique({
      where: { id },
      include: {
        student: { select: { fullName: true } },
        subject: { select: { name: true } },
      },
    });
    if (!grade) {
      throw new NotFoundException('Data nilai tidak ditemukan');
    }

    await this.prisma.studentGrade.delete({
      where: { id },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'GRADE_DELETED',
      entity: 'STUDENT_GRADE',
      entityId: id,
      oldValue: {
        student: grade.student.fullName,
        subject: grade.subject.name,
        finalScore: grade.finalScore,
      },
      ipAddress: ip,
      userAgent,
    });

    return { success: true, message: 'Entri nilai berhasil dihapus' };
  }
}
