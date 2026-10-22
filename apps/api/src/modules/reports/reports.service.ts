import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSchoolAttendanceReport(query: {
    startDate?: string;
    endDate?: string;
    academicYearId?: string;
  }) {
    const whereSession: any = {};

    if (query.startDate && query.endDate) {
      whereSession.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        session: whereSession,
      },
      include: {
        session: {
          select: {
            date: true,
            schoolClass: { select: { id: true, name: true, level: true } },
          },
        },
      },
    });

    const hadir = records.filter((r) => r.status === AttendanceStatus.HADIR).length;
    const terlambat = records.filter((r) => r.status === AttendanceStatus.TERLAMBAT).length;
    const sakit = records.filter((r) => r.status === AttendanceStatus.SAKIT).length;
    const izin = records.filter((r) => r.status === AttendanceStatus.IZIN).length;
    const alpa = records.filter((r) => r.status === AttendanceStatus.ALPA).length;
    const total = records.length;

    const percentage = total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100;

    return {
      period: {
        startDate: query.startDate || 'Semua Waktu',
        endDate: query.endDate || 'Semua Waktu',
      },
      totalRecords: total,
      hadir,
      terlambat,
      sakit,
      izin,
      alpa,
      overallPercentage: percentage,
    };
  }

  async getStudentAttendanceReport(
    studentId: string,
    query: { startDate?: string; endDate?: string },
    currentUser: any,
  ) {
    if (currentUser.role === Role.STUDENT) {
      let myStudentId = currentUser.studentId;
      if (!myStudentId) {
        const student = await this.prisma.student.findFirst({
          where: { userId: currentUser.id },
          select: { id: true },
        });
        myStudentId = student?.id;
      }
      if (myStudentId !== studentId) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat mengakses laporan absensi milik Anda');
      }
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { currentClass: true },
    });

    if (!student) throw new NotFoundException('Data siswa tidak ditemukan');

    const whereSession: any = {};
    if (query.startDate && query.endDate) {
      whereSession.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: whereSession,
      },
      include: {
        session: {
          include: {
            subject: true,
            teacher: { select: { fullName: true } },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const hadir = records.filter((r) => r.status === AttendanceStatus.HADIR).length;
    const terlambat = records.filter((r) => r.status === AttendanceStatus.TERLAMBAT).length;
    const sakit = records.filter((r) => r.status === AttendanceStatus.SAKIT).length;
    const izin = records.filter((r) => r.status === AttendanceStatus.IZIN).length;
    const alpa = records.filter((r) => r.status === AttendanceStatus.ALPA).length;
    const total = records.length;

    const percentage = total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100;

    return {
      student: {
        id: student.id,
        nis: student.nis,
        fullName: student.fullName,
        className: student.currentClass.name,
      },
      summary: {
        total,
        hadir,
        terlambat,
        sakit,
        izin,
        alpa,
        percentage,
      },
      records: records.map((r) => ({
        id: r.id,
        date: r.session.date,
        subject: r.session.subject.name,
        teacher: r.session.teacher.fullName,
        status: r.status,
        method: r.method,
        notes: r.notes,
      })),
    };
  }

  async getClassAttendanceReport(
    classId: string,
    query: { startDate?: string; endDate?: string },
    currentUser: any,
  ) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        homeroomTeacher: true,
        students: {
          where: { status: 'AKTIF' },
          orderBy: { nis: 'asc' },
        },
      },
    });

    if (!cls) throw new NotFoundException('Kelas tidak ditemukan');

    if (currentUser.role === Role.TEACHER) {
      let teacherId = currentUser.teacherId;
      if (!teacherId) {
        const teacher = await this.prisma.teacher.findFirst({
          where: { userId: currentUser.id },
          select: { id: true },
        });
        teacherId = teacher?.id;
      }

      if (cls.homeroomTeacherId !== teacherId) {
        const assignment = await this.prisma.teachingAssignment.findFirst({
          where: { classId, teacherId },
        });
        if (!assignment) {
          throw new ForbiddenException('Akses ditolak: Anda tidak memiliki wewenang untuk kelas ini');
        }
      }
    }

    const whereSession: any = { classId };
    if (query.startDate && query.endDate) {
      whereSession.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        session: whereSession,
      },
      include: {
        student: true,
        session: { select: { date: true, subject: true } },
      },
    });

    // Student recap
    const studentStats = cls.students.map((student) => {
      const studentRecords = records.filter((r) => r.studentId === student.id);
      const hadir = studentRecords.filter((r) => r.status === AttendanceStatus.HADIR).length;
      const terlambat = studentRecords.filter((r) => r.status === AttendanceStatus.TERLAMBAT).length;
      const sakit = studentRecords.filter((r) => r.status === AttendanceStatus.SAKIT).length;
      const izin = studentRecords.filter((r) => r.status === AttendanceStatus.IZIN).length;
      const alpa = studentRecords.filter((r) => r.status === AttendanceStatus.ALPA).length;
      const total = studentRecords.length;

      const percentage = total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100;

      return {
        studentId: student.id,
        nis: student.nis,
        fullName: student.fullName,
        hadir,
        terlambat,
        sakit,
        izin,
        alpa,
        total,
        percentage,
      };
    });

    const totalRecords = records.length;
    const totalHadir = records.filter((r) => r.status === AttendanceStatus.HADIR).length;
    const totalTerlambat = records.filter((r) => r.status === AttendanceStatus.TERLAMBAT).length;
    const classPercentage =
      totalRecords > 0
        ? Number((((totalHadir + totalTerlambat) / totalRecords) * 100).toFixed(1))
        : 100;

    return {
      class: {
        id: cls.id,
        name: cls.name,
        homeroomTeacher: cls.homeroomTeacher?.fullName,
      },
      classSummary: {
        totalStudents: cls.students.length,
        totalAttendanceEntries: totalRecords,
        overallPercentage: classPercentage,
      },
      students: studentStats,
    };
  }
}
