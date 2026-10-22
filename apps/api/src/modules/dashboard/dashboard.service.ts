import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, Role, SessionStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: { id: string; role: Role; teacherId?: string; studentId?: string; classId?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (user.role === Role.STUDENT && user.studentId) {
      // Student-scoped summary
      const studentRecords = await this.prisma.attendanceRecord.findMany({
        where: { studentId: user.studentId },
      });

      const total = studentRecords.length;
      const hadir = studentRecords.filter((r) => r.status === AttendanceStatus.HADIR).length;
      const sakit = studentRecords.filter((r) => r.status === AttendanceStatus.SAKIT).length;
      const izin = studentRecords.filter((r) => r.status === AttendanceStatus.IZIN).length;
      const alpa = studentRecords.filter((r) => r.status === AttendanceStatus.ALPA).length;
      const terlambat = studentRecords.filter((r) => r.status === AttendanceStatus.TERLAMBAT).length;

      const percentage = total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100;

      const pendingPermissions = await this.prisma.permissionRequest.count({
        where: { studentId: user.studentId, status: 'MENUNGGU' },
      });

      return {
        role: user.role,
        totalSessions: total,
        attendancePercentage: percentage,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        pendingPermissions,
      };
    }

    if (user.role === Role.TEACHER && user.teacherId) {
      // Teacher-scoped summary: sessions where this teacher is assigned or homeroom
      const [assignedClasses, mySessionsToday, pendingPermissions] = await Promise.all([
        this.prisma.teachingAssignment.findMany({
          where: { teacherId: user.teacherId },
          select: { classId: true },
        }),
        this.prisma.attendanceSession.findMany({
          where: {
            teacherId: user.teacherId,
            date: { gte: today, lt: tomorrow },
          },
          include: {
            records: true,
          },
        }),
        this.prisma.permissionRequest.count({
          where: {
            schoolClass: {
              homeroomTeacherId: user.teacherId,
            },
            status: 'MENUNGGU',
          },
        }),
      ]);

      const classIds = [...new Set(assignedClasses.map((a) => a.classId))];
      const totalStudents = await this.prisma.student.count({
        where: { classId: { in: classIds } },
      });

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let terlambat = 0;

      for (const session of mySessionsToday) {
        for (const r of session.records) {
          if (r.status === AttendanceStatus.HADIR) hadir++;
          else if (r.status === AttendanceStatus.SAKIT) sakit++;
          else if (r.status === AttendanceStatus.IZIN) izin++;
          else if (r.status === AttendanceStatus.ALPA) alpa++;
          else if (r.status === AttendanceStatus.TERLAMBAT) terlambat++;
        }
      }

      const totalRecorded = hadir + sakit + izin + alpa + terlambat;
      const percentage =
        totalRecorded > 0 ? Number((((hadir + terlambat) / totalRecorded) * 100).toFixed(1)) : 100;

      return {
        role: user.role,
        totalAssignedClasses: classIds.length,
        totalStudents,
        sessionsToday: mySessionsToday.length,
        attendancePercentageToday: percentage,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        pendingPermissions,
      };
    }

    // Admin / Principal school-wide summary
    const [totalStudents, totalTeachers, totalClasses, todayRecords, pendingPermissions] =
      await Promise.all([
        this.prisma.student.count({ where: { status: 'AKTIF' } }),
        this.prisma.teacher.count({ where: { status: 'AKTIF' } }),
        this.prisma.class.count(),
        this.prisma.attendanceRecord.findMany({
          where: {
            session: {
              date: { gte: today, lt: tomorrow },
            },
          },
        }),
        this.prisma.permissionRequest.count({ where: { status: 'MENUNGGU' } }),
      ]);

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;

    for (const r of todayRecords) {
      if (r.status === AttendanceStatus.HADIR) hadir++;
      else if (r.status === AttendanceStatus.SAKIT) sakit++;
      else if (r.status === AttendanceStatus.IZIN) izin++;
      else if (r.status === AttendanceStatus.ALPA) alpa++;
      else if (r.status === AttendanceStatus.TERLAMBAT) terlambat++;
    }

    const totalRecorded = hadir + sakit + izin + alpa + terlambat;
    const todayAttendancePercentage =
      totalRecorded > 0 ? Number((((hadir + terlambat) / totalRecorded) * 100).toFixed(1)) : 95.5;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendancePercentage,
      hadirCount: hadir,
      sakitCount: sakit,
      izinCount: izin,
      alpaCount: alpa,
      terlambatCount: terlambat,
      pendingPermissionsCount: pendingPermissions,
    };
  }

  async getAttendanceTrends(
    user: { id: string; role: Role; teacherId?: string; studentId?: string },
    days: number = 7,
  ) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const whereSession: any = {
      date: { gte: startDate, lte: today },
    };

    if (user.role === Role.TEACHER && user.teacherId) {
      whereSession.teacherId = user.teacherId;
    }

    const whereRecord: any = {
      session: whereSession,
    };

    if (user.role === Role.STUDENT && user.studentId) {
      whereRecord.studentId = user.studentId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: whereRecord,
      include: {
        session: { select: { date: true } },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Group records by formatted date string (YYYY-MM-DD)
    const trendsMap: Record<string, { hadir: number; sakit: number; izin: number; alpa: number; terlambat: number }> =
      {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      trendsMap[key] = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    }

    for (const r of records) {
      const dateKey = r.session.date.toISOString().split('T')[0];
      if (trendsMap[dateKey]) {
        if (r.status === AttendanceStatus.HADIR) trendsMap[dateKey].hadir++;
        else if (r.status === AttendanceStatus.SAKIT) trendsMap[dateKey].sakit++;
        else if (r.status === AttendanceStatus.IZIN) trendsMap[dateKey].izin++;
        else if (r.status === AttendanceStatus.ALPA) trendsMap[dateKey].alpa++;
        else if (r.status === AttendanceStatus.TERLAMBAT) trendsMap[dateKey].terlambat++;
      }
    }

    return Object.keys(trendsMap).map((date) => {
      const stat = trendsMap[date];
      const total = stat.hadir + stat.sakit + stat.izin + stat.alpa + stat.terlambat;
      const percentage =
        total > 0 ? Number((((stat.hadir + stat.terlambat) / total) * 100).toFixed(1)) : 100;
      return {
        date,
        ...stat,
        total,
        percentage,
      };
    });
  }

  async getClassStatistics(user: { id: string; role: Role; teacherId?: string }) {
    let classes = await this.prisma.class.findMany({
      include: {
        students: { select: { id: true } },
        attendanceSessions: {
          include: {
            records: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (user.role === Role.TEACHER && user.teacherId) {
      // Filter classes assigned to or homeroomed by teacher
      classes = classes.filter(
        (c) =>
          c.homeroomTeacherId === user.teacherId ||
          c.attendanceSessions.some((s) => s.teacherId === user.teacherId),
      );
    }

    return classes.map((c) => {
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let terlambat = 0;

      for (const session of c.attendanceSessions) {
        for (const r of session.records) {
          if (r.status === AttendanceStatus.HADIR) hadir++;
          else if (r.status === AttendanceStatus.SAKIT) sakit++;
          else if (r.status === AttendanceStatus.IZIN) izin++;
          else if (r.status === AttendanceStatus.ALPA) alpa++;
          else if (r.status === AttendanceStatus.TERLAMBAT) terlambat++;
        }
      }

      const totalRecorded = hadir + sakit + izin + alpa + terlambat;
      const percentage =
        totalRecorded > 0 ? Number((((hadir + terlambat) / totalRecorded) * 100).toFixed(1)) : 100;

      return {
        classId: c.id,
        className: c.name,
        grade: c.level,
        major: c.major,
        totalStudents: c.students.length,
        attendancePercentage: percentage,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
      };
    });
  }
}
