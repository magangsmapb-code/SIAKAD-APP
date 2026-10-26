import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SubmitAttendanceRecordsDto } from './dto/submit-records.dto';
import { UpdateAttendanceRecordDto } from './dto/update-record.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { UpdateAttendanceConfigDto } from './dto/update-attendance-config.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CreateCorrectionRequestDto } from './dto/create-correction.dto';
import { ReviewCorrectionDto } from './dto/review-correction.dto';
import { QueryAnomalyDto } from './dto/query-anomaly.dto';
import { ResolveAnomalyDto } from './dto/resolve-anomaly.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import {
  AttendanceStatus,
  Role,
  SessionStatus,
  AttendanceMethod,
  PermissionStatus,
  AnomalySeverity,
  AnomalyStatus,
} from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private usedNonces = new Map<string, number>();

  private validateNonce(nonce: string | undefined, windowSeconds: number): void {
    if (!nonce) return;
    const now = Date.now();
    const expiry = (windowSeconds || 60) * 1000;
    for (const [key, timestamp] of this.usedNonces.entries()) {
      if (now - timestamp > expiry) {
        this.usedNonces.delete(key);
      }
    }

    if (this.usedNonces.has(nonce)) {
      throw new BadRequestException(
        'Replay attack dicegah: Challenge/nonce ini telah digunakan sebelumnya.',
      );
    }
    this.usedNonces.set(nonce, now);
  }

  async recordAnomaly(params: {
    anomalyType: string;
    severity?: AnomalySeverity;
    userId: string;
    userRole: string;
    actorName: string;
    targetId?: string;
    details: string;
    coords?: any;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const anomaly = await this.prisma.attendanceAnomaly.create({
        data: {
          anomalyType: params.anomalyType,
          severity: params.severity || AnomalySeverity.MEDIUM,
          userId: params.userId,
          userRole: params.userRole,
          actorName: params.actorName,
          targetId: params.targetId,
          details: params.details,
          coords: params.coords || undefined,
          deviceId: params.deviceId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          status: AnomalyStatus.PENDING_REVIEW,
        },
      });

      await this.auditService.record({
        userId: params.userId,
        actorName: params.actorName,
        actorRole: params.userRole,
        action: 'ATTENDANCE_ANOMALY_DETECTED',
        entity: 'ATTENDANCE_ANOMALY',
        entityId: anomaly.id,
        newValue: {
          anomalyType: params.anomalyType,
          severity: params.severity || 'MEDIUM',
          details: params.details,
          coords: params.coords,
          deviceId: params.deviceId,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      return anomaly;
    } catch {
      // Fallback audit log if anomaly table is pending
      return this.auditService.record({
        userId: params.userId,
        actorName: params.actorName,
        actorRole: params.userRole,
        action: 'ATTENDANCE_ANOMALY_DETECTED',
        entity: 'ATTENDANCE_ANOMALY',
        entityId: params.targetId || 'unknown',
        newValue: {
          anomalyType: params.anomalyType,
          severity: params.severity || 'MEDIUM',
          details: params.details,
          coords: params.coords,
          deviceId: params.deviceId,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }
  }

  private async validateDeviceBinding(
    deviceId: string | undefined,
    userId: string,
    config: any,
  ): Promise<void> {
    if (!config.requireDeviceBinding) return;
    if (!deviceId) {
      throw new BadRequestException(
        'Kebijakan sekolah mewajibkan absensi menggunakan perangkat terdaftar (Device ID tidak disertakan).',
      );
    }
    const device = await this.prisma.attendanceDevice.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });
    if (!device || !device.isTrusted) {
      throw new ForbiddenException(
        'Perangkat ini belum terdaftar atau belum disetujui untuk akun Anda. Harap daftarkan perangkat terlebih dahulu.',
      );
    }
    await this.prisma.attendanceDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });
  }

  private async checkMultiAccountDevice(
    deviceId: string | undefined,
    currentUserId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    if (!deviceId) return;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [recentStudent, recentTeacher] = await Promise.all([
      this.prisma.attendanceRecord.findFirst({
        where: {
          deviceId,
          recordedAt: { gte: fifteenMinutesAgo },
          student: { userId: { not: currentUserId } },
        },
        include: { student: { select: { fullName: true } } },
      }),
      this.prisma.teacherAttendance.findFirst({
        where: {
          deviceId,
          createdAt: { gte: fifteenMinutesAgo },
          teacher: { userId: { not: currentUserId } },
        },
        include: { teacher: { select: { fullName: true } } },
      }),
    ]);

    if (recentStudent || recentTeacher) {
      const prevName =
        recentStudent?.student?.fullName ||
        recentTeacher?.teacher?.fullName ||
        'Pengguna Lain';
      await this.recordAnomaly({
        anomalyType: 'MULTI_ACCOUNT_DEVICE_BREACH',
        severity: AnomalySeverity.HIGH,
        userId: currentUserId,
        userRole: 'UNKNOWN',
        actorName: 'Pencegahan Titip Absen',
        deviceId,
        details: `Perangkat ${deviceId} terdeteksi digunakan untuk absensi multi-akun dalam 15 menit (sebelumnya digunakan oleh ${prevName}).`,
        ipAddress: ip,
        userAgent,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Geofencing & Time Utilities
  // ---------------------------------------------------------------------------

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius Bumi dalam meter
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private getCurrentWibTime(): string {
    const now = new Date();
    const wibStr = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    return wibStr.replace('.', ':');
  }

  private validateSelfCheckInMethod(config: { allowedMethods: string }): void {
    let allowedMethods: unknown;
    try {
      allowedMethods = JSON.parse(config.allowedMethods);
    } catch {
      throw new BadRequestException(
        'Konfigurasi metode absensi tidak valid. Hubungi Developer untuk memperbaikinya.',
      );
    }
    if (!Array.isArray(allowedMethods) || !allowedMethods.includes(AttendanceMethod.SELF_MOBILE)) {
      throw new ForbiddenException(
        'Metode absensi mandiri melalui perangkat tidak diizinkan oleh sekolah.',
      );
    }
  }

  private async resolveTeacherId(currentUser: any): Promise<string> {
    if (currentUser.teacherId || currentUser.teacher?.id) {
      return currentUser.teacherId || currentUser.teacher.id;
    }
    const teacher = await this.prisma.teacher.findUnique({
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

  // ---------------------------------------------------------------------------
  // 1. Centralized Attendance Configuration (Developer Governance)
  // ---------------------------------------------------------------------------

  async getAttendanceConfig() {
    let config = await this.prisma.attendanceConfig.findFirst();
    if (!config) {
      config = await this.prisma.attendanceConfig.create({
        data: {
          checkInStartTime: '06:30',
          checkInEndTime: '07:30',
          lateThresholdTime: '07:00',
          lateToleranceMinutes: 15,
          checkOutStartTime: '14:00',
          checkOutEndTime: '16:00',
          enableGps: false,
          schoolLatitude: -8.0435,
          schoolLongitude: 111.4123,
          maxGpsRadiusMeters: 100,
          maxGpsAccuracyMeters: 50,
          requireDeviceBinding: false,
          maxDevicesPerUser: 1,
          preventSimultaneousLogins: true,
          replayWindowSeconds: 60,
          allowedMethods: '["MANUAL_TEACHER","QR_CODE","RFID_CARD","FACE_RECOGNITION","SELF_MOBILE"]',
          allowStudentSelfCheckIn: false,
          allowTeacherSelfCheckIn: true,
          requirePhotoVerification: false,
          requireCorrectionApproval: true,
          correctionApproverRole: 'TEACHER_HOMEROOM',
          maintenanceMode: false,
        },
      });
    }
    return config;
  }

  async updateAttendanceConfig(
    dto: UpdateAttendanceConfigDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    let config = await this.prisma.attendanceConfig.findFirst();
    const oldConfig = config ? { ...config } : null;

    if (!config) {
      config = await this.prisma.attendanceConfig.create({
        data: {
          ...dto,
          updatedById: currentUser.id,
          updatedByName: currentUser.fullName || currentUser.username,
        },
      });
    } else {
      config = await this.prisma.attendanceConfig.update({
        where: { id: config.id },
        data: {
          ...dto,
          updatedById: currentUser.id,
          updatedByName: currentUser.fullName || currentUser.username,
          updatedAt: new Date(),
        },
      });
    }

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_CONFIG_UPDATED',
      entity: 'ATTENDANCE_CONFIG',
      entityId: config.id,
      oldValue: oldConfig,
      newValue: config,
      ipAddress: ip,
      userAgent,
    });

    return config;
  }

  // ---------------------------------------------------------------------------
  // 2. Personal Teacher Attendance (Check-in / Check-out)
  // ---------------------------------------------------------------------------

  async teacherCheckIn(dto: CheckInDto, currentUser: any, ip?: string, userAgent?: string) {
    const config = await this.getAttendanceConfig();

    if (config.maintenanceMode) {
      throw new ForbiddenException(
        `Fitur absensi sedang dalam pemeliharaan (Maintenance Mode): ${config.maintenanceMessage || 'Mohon menunggu beberapa saat.'}`,
      );
    }

    if (!config.allowTeacherSelfCheckIn) {
      throw new ForbiddenException(
        'Absensi mandiri guru sedang dinonaktifkan oleh sekolah melalui Developer Dashboard.',
      );
    }
    this.validateSelfCheckInMethod(config);

    let teacher = currentUser.teacher;
    if (!teacher && currentUser.teacherId) {
      teacher = await this.prisma.teacher.findUnique({ where: { id: currentUser.teacherId } });
    }
    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst({ where: { userId: currentUser.id } });
    }
    if (!teacher) {
      throw new BadRequestException('Data profil guru tidak ditemukan untuk akun ini.');
    }

    // Anti-replay challenge
    this.validateNonce(dto.nonce, config.replayWindowSeconds);

    // Device binding check
    await this.validateDeviceBinding(dto.deviceId, currentUser.id, config);

    // Anti-proxy multi-account detection
    await this.checkMultiAccountDevice(dto.deviceId, currentUser.id, ip, userAgent);

    // Time validation in WIB
    const nowTimeStr = this.getCurrentWibTime();
    if (nowTimeStr < config.checkInStartTime || nowTimeStr > config.checkInEndTime) {
      await this.recordAnomaly({
        anomalyType: 'OFF_SCHEDULE_CHECKIN',
        severity: AnomalySeverity.MEDIUM,
        userId: currentUser.id,
        userRole: currentUser.role,
        actorName: currentUser.fullName || currentUser.username,
        targetId: teacher.id,
        details: `Percobaan check-in guru di luar jadwal (${nowTimeStr} WIB, batas operasional: ${config.checkInStartTime}-${config.checkInEndTime} WIB)`,
        deviceId: dto.deviceId,
        ipAddress: ip,
        userAgent,
      });

      if (nowTimeStr < config.checkInStartTime) {
        throw new BadRequestException(
          `Waktu absensi masuk belum dibuka. Jam masuk dimulai pukul ${config.checkInStartTime} WIB (Waktu server saat ini: ${nowTimeStr} WIB).`,
        );
      } else {
        throw new BadRequestException(
          `Batas waktu absensi masuk telah berakhir pukul ${config.checkInEndTime} WIB. Silakan hubungi tim piket/admin.`,
        );
      }
    }

    // Status: TERLAMBAT if after lateThresholdTime, else HADIR
    const status =
      nowTimeStr > config.lateThresholdTime ? AttendanceStatus.TERLAMBAT : AttendanceStatus.HADIR;

    // GPS validation & accuracy check
    let distanceMeters: number | null = null;
    let isInsideGeofence: boolean | null = null;
    if (config.enableGps) {
      if (dto.latitude === undefined || dto.longitude === undefined) {
        throw new BadRequestException('Koordinat GPS wajib diaktifkan dan dikirimkan saat absensi mandiri.');
      }

      if (dto.gpsAccuracyMeters !== undefined && dto.gpsAccuracyMeters > config.maxGpsAccuracyMeters) {
        await this.recordAnomaly({
          anomalyType: 'LOW_GPS_ACCURACY',
          severity: AnomalySeverity.MEDIUM,
          userId: currentUser.id,
          userRole: currentUser.role,
          actorName: currentUser.fullName || currentUser.username,
          targetId: teacher.id,
          details: `Akurasi sinyal GPS guru rendah (${dto.gpsAccuracyMeters}m, batas kebijakan ${config.maxGpsAccuracyMeters}m)`,
          coords: { lat: dto.latitude, lon: dto.longitude, accuracy: dto.gpsAccuracyMeters },
          deviceId: dto.deviceId,
          ipAddress: ip,
          userAgent,
        });

        if (dto.gpsAccuracyMeters > config.maxGpsAccuracyMeters * 2) {
          throw new BadRequestException(
            `Akurasi sinyal GPS perangkat Anda terlalu rendah (${dto.gpsAccuracyMeters} meter, batas maksimal ${config.maxGpsAccuracyMeters} meter). Harap keluar ke ruang terbuka untuk mendapatkan sinyal GPS akurat.`,
          );
        }
      }

      distanceMeters = this.calculateDistance(
        config.schoolLatitude,
        config.schoolLongitude,
        dto.latitude,
        dto.longitude,
      );
      isInsideGeofence = distanceMeters <= config.maxGpsRadiusMeters;

      if (!isInsideGeofence) {
        await this.recordAnomaly({
          anomalyType: 'GEOFENCE_RADIUS_BREACH',
          severity: AnomalySeverity.HIGH,
          userId: currentUser.id,
          userRole: currentUser.role,
          actorName: currentUser.fullName || currentUser.username,
          targetId: teacher.id,
          details: `Posisi di luar perimeter (${distanceMeters}m dari pusat sekolah, batas ${config.maxGpsRadiusMeters}m)`,
          coords: { lat: dto.latitude, lon: dto.longitude, accuracy: dto.gpsAccuracyMeters },
          deviceId: dto.deviceId,
          ipAddress: ip,
          userAgent,
        });

        throw new BadRequestException(
          `Posisi Anda berada di luar area sekolah SMA PB Ngrayun (${distanceMeters} meter, batas toleransi maksimum ${config.maxGpsRadiusMeters} meter).`,
        );
      }
    }

    // Duplicate check-in check for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
    });

    if (existing) {
      await this.recordAnomaly({
        anomalyType: 'DUPLICATE_CHECKIN_ATTEMPT',
        severity: AnomalySeverity.LOW,
        userId: currentUser.id,
        userRole: currentUser.role,
        actorName: currentUser.fullName || currentUser.username,
        targetId: teacher.id,
        details: 'Percobaan check-in ganda oleh guru pada hari yang sama',
        deviceId: dto.deviceId,
        ipAddress: ip,
        userAgent,
      });

      throw new BadRequestException(
        `Anda sudah melakukan absensi masuk hari ini pada pukul ${existing.checkInTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.`,
      );
    }

    const attendance = await this.prisma.teacherAttendance.create({
      data: {
        teacherId: teacher.id,
        date: today,
        checkInTime: new Date(),
        status,
        method: AttendanceMethod.SELF_MOBILE,
        latitude: dto.latitude,
        longitude: dto.longitude,
        gpsAccuracyMeters: dto.gpsAccuracyMeters,
        distanceMeters,
        isInsideGeofence: isInsideGeofence ?? true,
        deviceId: dto.deviceId,
        deviceModel: dto.deviceModel,
        ipAddress: ip,
        userAgent,
        nonce: dto.nonce,
        notes: dto.notes,
      },
      include: {
        teacher: { select: { fullName: true, nip: true } },
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'TEACHER_CHECKIN',
      entity: 'TEACHER_ATTENDANCE',
      entityId: attendance.id,
      newValue: {
        status: attendance.status,
        time: attendance.checkInTime,
        distanceMeters,
        deviceId: dto.deviceId,
      },
      ipAddress: ip,
      userAgent,
    });

    return attendance;
  }

  async teacherCheckOut(dto: CheckInDto, currentUser: any, ip?: string, userAgent?: string) {
    const config = await this.getAttendanceConfig();

    let teacher = currentUser.teacher;
    if (!teacher && currentUser.teacherId) {
      teacher = await this.prisma.teacher.findUnique({ where: { id: currentUser.teacherId } });
    }
    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst({ where: { userId: currentUser.id } });
    }
    if (!teacher) throw new BadRequestException('Data profil guru tidak ditemukan');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('Anda belum melakukan absensi masuk hari ini. Tidak dapat melakukan check-out.');
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException('Anda sudah melakukan check-out kepulangan hari ini.');
    }

    const nowTimeStr = this.getCurrentWibTime();
    if (nowTimeStr < config.checkOutStartTime) {
      throw new BadRequestException(
        `Waktu check-out pulang belum dibuka. Jam pulang dimulai pukul ${config.checkOutStartTime} WIB (Waktu server saat ini: ${nowTimeStr} WIB).`,
      );
    }

    const updated = await this.prisma.teacherAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'TEACHER_CHECKOUT',
      entity: 'TEACHER_ATTENDANCE',
      entityId: attendance.id,
      newValue: { checkOutTime: updated.checkOutTime },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async getTeacherToday(currentUser: any) {
    let teacher = currentUser.teacher;
    if (!teacher && currentUser.teacherId) {
      teacher = await this.prisma.teacher.findUnique({ where: { id: currentUser.teacherId } });
    }
    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst({ where: { userId: currentUser.id } });
    }
    if (!teacher) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
    });

    const config = await this.getAttendanceConfig();

    return {
      teacher: { id: teacher.id, fullName: teacher.fullName, nip: teacher.nip },
      todayRecord: record,
      config: {
        checkInStartTime: config.checkInStartTime,
        checkInEndTime: config.checkInEndTime,
        lateThresholdTime: config.lateThresholdTime,
        checkOutStartTime: config.checkOutStartTime,
        checkOutEndTime: config.checkOutEndTime,
        enableGps: config.enableGps,
        schoolLatitude: config.schoolLatitude,
        schoolLongitude: config.schoolLongitude,
        maxGpsRadiusMeters: config.maxGpsRadiusMeters,
        maxGpsAccuracyMeters: config.maxGpsAccuracyMeters,
        allowTeacherSelfCheckIn: config.allowTeacherSelfCheckIn,
        requireDeviceBinding: config.requireDeviceBinding,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
      },
      currentWibTime: this.getCurrentWibTime(),
    };
  }

  async getTeacherHistory(currentUser: any, query?: { limit?: number; page?: number }) {
    let teacher = currentUser.teacher;
    if (!teacher && currentUser.teacherId) {
      teacher = await this.prisma.teacher.findUnique({ where: { id: currentUser.teacherId } });
    }
    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst({ where: { userId: currentUser.id } });
    }
    if (!teacher) return { data: [], total: 0 };

    const limit = query?.limit || 15;
    const page = query?.page || 1;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      this.prisma.teacherAttendance.count({ where: { teacherId: teacher.id } }),
      this.prisma.teacherAttendance.findMany({
        where: { teacherId: teacher.id },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Student Self Attendance (Check-in)
  // ---------------------------------------------------------------------------

  async studentCheckIn(dto: CheckInDto, currentUser: any, ip?: string, userAgent?: string) {
    const config = await this.getAttendanceConfig();

    if (config.maintenanceMode) {
      throw new ForbiddenException(
        `Fitur absensi sedang dalam pemeliharaan (Maintenance Mode): ${config.maintenanceMessage || 'Mohon menunggu beberapa saat.'}`,
      );
    }

    if (!config.allowStudentSelfCheckIn) {
      throw new ForbiddenException(
        'Fitur absensi mandiri siswa belum diaktifkan oleh sekolah melalui Developer Dashboard. Silakan absen melalui guru kelas atau gerbang RFID.',
      );
    }
    this.validateSelfCheckInMethod(config);

    let student = currentUser.student;
    if (!student && currentUser.studentId) {
      student = await this.prisma.student.findUnique({ where: { id: currentUser.studentId } });
    }
    if (!student) {
      student = await this.prisma.student.findFirst({ where: { userId: currentUser.id } });
    }
    if (!student) {
      throw new BadRequestException('Data profil siswa tidak ditemukan untuk akun ini.');
    }

    // Anti-replay challenge
    this.validateNonce(dto.nonce, config.replayWindowSeconds);

    // Device binding check
    await this.validateDeviceBinding(dto.deviceId, currentUser.id, config);

    // Anti-proxy multi-account detection
    await this.checkMultiAccountDevice(dto.deviceId, currentUser.id, ip, userAgent);

    // Time validation in WIB
    const nowTimeStr = this.getCurrentWibTime();
    if (nowTimeStr < config.checkInStartTime || nowTimeStr > config.checkInEndTime) {
      await this.recordAnomaly({
        anomalyType: 'OFF_SCHEDULE_CHECKIN',
        severity: AnomalySeverity.MEDIUM,
        userId: currentUser.id,
        userRole: currentUser.role,
        actorName: currentUser.fullName || currentUser.username,
        targetId: student.id,
        details: `Percobaan check-in mandiri murid di luar jadwal (${nowTimeStr} WIB, batas: ${config.checkInStartTime}-${config.checkInEndTime} WIB)`,
        deviceId: dto.deviceId,
        ipAddress: ip,
        userAgent,
      });

      if (nowTimeStr < config.checkInStartTime) {
        throw new BadRequestException(
          `Absensi mandiri belum dibuka. Jam masuk dimulai pukul ${config.checkInStartTime} WIB.`,
        );
      } else {
        throw new BadRequestException(
          `Batas waktu absensi mandiri telah berakhir pukul ${config.checkInEndTime} WIB. Silakan hubungi wali kelas.`,
        );
      }
    }

    const status =
      nowTimeStr > config.lateThresholdTime ? AttendanceStatus.TERLAMBAT : AttendanceStatus.HADIR;

    // GPS validation & accuracy check
    let distanceMeters: number | null = null;
    let isInsideGeofence: boolean | null = null;
    if (config.enableGps) {
      if (dto.latitude === undefined || dto.longitude === undefined) {
        throw new BadRequestException('Koordinat GPS wajib diaktifkan dan dikirimkan saat absensi mandiri.');
      }

      if (dto.gpsAccuracyMeters !== undefined && dto.gpsAccuracyMeters > config.maxGpsAccuracyMeters) {
        await this.recordAnomaly({
          anomalyType: 'LOW_GPS_ACCURACY',
          severity: AnomalySeverity.MEDIUM,
          userId: currentUser.id,
          userRole: currentUser.role,
          actorName: currentUser.fullName || currentUser.username,
          targetId: student.id,
          details: `Akurasi sinyal GPS siswa rendah (${dto.gpsAccuracyMeters}m, batas kebijakan ${config.maxGpsAccuracyMeters}m)`,
          coords: { lat: dto.latitude, lon: dto.longitude, accuracy: dto.gpsAccuracyMeters },
          deviceId: dto.deviceId,
          ipAddress: ip,
          userAgent,
        });

        if (dto.gpsAccuracyMeters > config.maxGpsAccuracyMeters * 2) {
          throw new BadRequestException(
            `Akurasi sinyal GPS perangkat Anda terlalu rendah (${dto.gpsAccuracyMeters} meter, batas toleransi ${config.maxGpsAccuracyMeters} meter). Harap keluar ke ruang terbuka untuk mendapatkan sinyal GPS akurat.`,
          );
        }
      }

      distanceMeters = this.calculateDistance(
        config.schoolLatitude,
        config.schoolLongitude,
        dto.latitude,
        dto.longitude,
      );
      isInsideGeofence = distanceMeters <= config.maxGpsRadiusMeters;

      if (!isInsideGeofence) {
        await this.recordAnomaly({
          anomalyType: 'GEOFENCE_RADIUS_BREACH',
          severity: AnomalySeverity.HIGH,
          userId: currentUser.id,
          userRole: currentUser.role,
          actorName: currentUser.fullName || currentUser.username,
          targetId: student.id,
          details: `Posisi murid di luar perimeter (${distanceMeters}m dari pusat sekolah, batas toleransi ${config.maxGpsRadiusMeters}m)`,
          coords: { lat: dto.latitude, lon: dto.longitude, accuracy: dto.gpsAccuracyMeters },
          deviceId: dto.deviceId,
          ipAddress: ip,
          userAgent,
        });

        throw new BadRequestException(
          `Posisi Anda berada di luar area sekolah (${distanceMeters} meter, batas ${config.maxGpsRadiusMeters} meter).`,
        );
      }
    }

    // Find today's active session for student's class
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let session = await this.prisma.attendanceSession.findFirst({
      where: {
        classId: student.classId,
        date: today,
      },
    });

    if (!session) {
      const schoolClass = await this.prisma.class.findUnique({
        where: { id: student.classId },
      });
      const defaultSubject = await this.prisma.subject.findFirst({
        where: { isActive: true },
      });
      if (!schoolClass?.homeroomTeacherId || !defaultSubject) {
        throw new BadRequestException(
          'Sesi absensi mandiri belum dapat dibuat. Pastikan kelas memiliki wali kelas dan mata pelajaran aktif.',
        );
      }

      session = await this.prisma.attendanceSession.create({
        data: {
          classId: student.classId,
          subjectId: defaultSubject.id,
          teacherId: schoolClass.homeroomTeacherId,
          date: today,
          startTime: config.checkInStartTime,
          endTime: config.checkInEndTime,
          room: schoolClass?.name || 'Ruang Kelas',
          status: SessionStatus.SEDANG_BERLANGSUNG,
          notes: 'Sesi absensi mandiri kelas',
          createdById: currentUser.id,
        },
      });
    }

    // Check existing record
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        session: { classId: student.classId, date: today },
      },
    });

    if (existing && existing.checkInTime) {
      await this.recordAnomaly({
        anomalyType: 'DUPLICATE_CHECKIN_ATTEMPT',
        severity: AnomalySeverity.LOW,
        userId: currentUser.id,
        userRole: currentUser.role,
        actorName: currentUser.fullName || currentUser.username,
        targetId: student.id,
        details: 'Percobaan check-in ganda oleh murid pada hari yang sama',
        deviceId: dto.deviceId,
        ipAddress: ip,
        userAgent,
      });

      throw new BadRequestException(
        `Anda sudah tercatat melakukan absensi hari ini dengan status '${existing.status}' pada pukul ${existing.checkInTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.`,
      );
    }

    const record = existing
      ? await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status,
            checkInTime: new Date(),
            method: dto.method || AttendanceMethod.SELF_MOBILE,
            latitude: dto.latitude,
            longitude: dto.longitude,
            gpsAccuracyMeters: dto.gpsAccuracyMeters,
            distanceMeters,
            isInsideGeofence: isInsideGeofence ?? true,
            deviceId: dto.deviceId,
            deviceModel: dto.deviceModel,
            ipAddress: ip,
            userAgent,
            nonce: dto.nonce,
            notes: dto.notes,
            recordedById: currentUser.id,
            updatedAt: new Date(),
          },
        })
      : await this.prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            status,
            checkInTime: new Date(),
            method: dto.method || AttendanceMethod.SELF_MOBILE,
            latitude: dto.latitude,
            longitude: dto.longitude,
            gpsAccuracyMeters: dto.gpsAccuracyMeters,
            distanceMeters,
            isInsideGeofence: isInsideGeofence ?? true,
            deviceId: dto.deviceId,
            deviceModel: dto.deviceModel,
            ipAddress: ip,
            userAgent,
            nonce: dto.nonce,
            notes: dto.notes,
            recordedById: currentUser.id,
          },
        });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'STUDENT_CHECKIN',
      entity: 'ATTENDANCE_RECORD',
      entityId: record.id,
      newValue: {
        status: record.status,
        checkInTime: record.checkInTime,
        distanceMeters,
        deviceId: dto.deviceId,
      },
      ipAddress: ip,
      userAgent,
    });

    return record;
  }

  async studentCheckOut(dto: CheckInDto, currentUser: any, ip?: string, userAgent?: string) {
    const config = await this.getAttendanceConfig();

    if (config.maintenanceMode) {
      throw new ForbiddenException(
        `Fitur absensi sedang dalam pemeliharaan (Maintenance Mode): ${config.maintenanceMessage || 'Mohon menunggu beberapa saat.'}`,
      );
    }

    let student = currentUser.student;
    if (!student && currentUser.studentId) {
      student = await this.prisma.student.findUnique({ where: { id: currentUser.studentId } });
    }
    if (!student) {
      student = await this.prisma.student.findFirst({ where: { userId: currentUser.id } });
    }
    if (!student) {
      throw new BadRequestException('Data profil siswa tidak ditemukan.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        session: { classId: student.classId, date: today },
      },
    });

    if (!record || !record.checkInTime) {
      throw new BadRequestException('Anda belum melakukan absensi masuk hari ini. Tidak dapat melakukan check-out.');
    }

    if (record.checkOutTime) {
      throw new BadRequestException('Anda sudah melakukan check-out kepulangan hari ini.');
    }

    const nowTimeStr = this.getCurrentWibTime();
    if (nowTimeStr < config.checkOutStartTime) {
      throw new BadRequestException(
        `Waktu check-out pulang belum dibuka. Jam pulang dimulai pukul ${config.checkOutStartTime} WIB (Waktu server saat ini: ${nowTimeStr} WIB).`,
      );
    }

    let distanceMeters: number | null = null;
    let isInsideGeofence: boolean | null = null;
    if (config.enableGps && dto.latitude !== undefined && dto.longitude !== undefined) {
      distanceMeters = this.calculateDistance(
        config.schoolLatitude,
        config.schoolLongitude,
        dto.latitude,
        dto.longitude,
      );
      isInsideGeofence = distanceMeters <= config.maxGpsRadiusMeters;
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutTime: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'STUDENT_CHECKOUT',
      entity: 'ATTENDANCE_RECORD',
      entityId: record.id,
      newValue: { checkOutTime: updated.checkOutTime, distanceMeters },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async getStudentToday(currentUser: any) {
    let student = currentUser.student;
    if (!student && currentUser.studentId) {
      student = await this.prisma.student.findUnique({
        where: { id: currentUser.studentId },
        include: { currentClass: true },
      });
    }
    if (!student) {
      student = await this.prisma.student.findFirst({
        where: { userId: currentUser.id },
        include: { currentClass: true },
      });
    }
    if (!student) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        session: { date: today },
      },
      include: {
        session: {
          include: {
            subject: { select: { name: true } },
            schoolClass: { select: { name: true } },
          },
        },
      },
    });

    const config = await this.getAttendanceConfig();

    return {
      student: { id: student.id, fullName: student.fullName, nis: student.nis, className: student.currentClass?.name },
      todayRecord: record,
      config: {
        checkInStartTime: config.checkInStartTime,
        checkInEndTime: config.checkInEndTime,
        lateThresholdTime: config.lateThresholdTime,
        checkOutStartTime: config.checkOutStartTime,
        checkOutEndTime: config.checkOutEndTime,
        allowStudentSelfCheckIn: config.allowStudentSelfCheckIn,
        enableGps: config.enableGps,
        schoolLatitude: config.schoolLatitude,
        schoolLongitude: config.schoolLongitude,
        maxGpsRadiusMeters: config.maxGpsRadiusMeters,
        maxGpsAccuracyMeters: config.maxGpsAccuracyMeters,
        requireDeviceBinding: config.requireDeviceBinding,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
      },
      currentWibTime: this.getCurrentWibTime(),
    };
  }

  async getStudentHistory(currentUser: any, query?: { limit?: number; page?: number }) {
    let student = currentUser.student;
    if (!student && currentUser.studentId) {
      student = await this.prisma.student.findUnique({ where: { id: currentUser.studentId } });
    }
    if (!student) {
      student = await this.prisma.student.findFirst({ where: { userId: currentUser.id } });
    }
    if (!student) return { data: [], total: 0 };

    const limit = query?.limit || 15;
    const page = query?.page || 1;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      this.prisma.attendanceRecord.count({ where: { studentId: student.id } }),
      this.prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        orderBy: { session: { date: 'desc' } },
        skip,
        take: limit,
        include: {
          session: {
            include: {
              subject: { select: { name: true } },
              teacher: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Classroom Attendance Sessions & Batch Operations
  // ---------------------------------------------------------------------------

  async createSession(createDto: CreateSessionDto, currentUser: any, ip?: string, userAgent?: string) {
    let teacherId = createDto.teacherId || currentUser.teacherId;

    if (!teacherId) {
      teacherId = await this.resolveTeacherId(currentUser).catch(() => null);
    }

    if (currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.DEVELOPER) {
      if (!teacherId) {
        const assignment = await this.prisma.teachingAssignment.findFirst({
          where: {
            classId: createDto.classId,
            subjectId: createDto.subjectId,
          },
        });
        teacherId = assignment?.teacherId;
      }
      if (!teacherId) {
        const schoolClass = await this.prisma.class.findUnique({ where: { id: createDto.classId } });
        teacherId = schoolClass?.homeroomTeacherId;
      }
    }

    if (!teacherId) {
      throw new BadRequestException('Guru pengampu untuk sesi absensi ini tidak dapat ditentukan');
    }

    if (currentUser.role === Role.TEACHER) {
      const isAssigned = await this.prisma.teachingAssignment.findFirst({
        where: {
          teacherId,
          classId: createDto.classId,
          subjectId: createDto.subjectId,
        },
      });

      const isHomeroom = await this.prisma.class.findFirst({
        where: { id: createDto.classId, homeroomTeacherId: teacherId },
      });

      if (!isAssigned && !isHomeroom) {
        throw new ForbiddenException(
          'Akses ditolak: Anda tidak ditugaskan untuk mengajar atau menjadi wali kelas di kelas ini',
        );
      }
    }

    const sessionDate = new Date(createDto.date);
    sessionDate.setHours(0, 0, 0, 0);

    const session = await this.prisma.attendanceSession.create({
      data: {
        classId: createDto.classId,
        subjectId: createDto.subjectId,
        teacherId,
        scheduleId: createDto.scheduleId,
        date: sessionDate,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        room: createDto.room || 'Ruang Kelas',
        notes: createDto.notes,
        status: createDto.status || SessionStatus.SEDANG_BERLANGSUNG,
        createdById: currentUser.id,
      },
      include: {
        schoolClass: true,
        subject: true,
        teacher: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_SESSION_CREATED',
      entity: 'ATTENDANCE_SESSION',
      entityId: session.id,
      newValue: {
        className: session.schoolClass.name,
        subjectName: session.subject.name,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      ipAddress: ip,
      userAgent,
    });

    return session;
  }

  async findAllSessions(query: QuerySessionDto, currentUser: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      where.OR = [
        { teacherId },
        { schoolClass: { homeroomTeacherId: teacherId } },
      ];
    } else if (currentUser.role === Role.STUDENT) {
      const studentId = await this.resolveStudentId(currentUser);
      where.records = { some: { studentId } };
    }

    if (query.classId && currentUser.role !== Role.STUDENT) where.classId = query.classId;
    if (query.teacherId && currentUser.role !== Role.TEACHER && currentUser.role !== Role.STUDENT) {
      where.teacherId = query.teacherId;
    }
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.status) where.status = query.status;

    if (query.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    } else if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const [total, sessions] = await Promise.all([
      this.prisma.attendanceSession.count({ where }),
      this.prisma.attendanceSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        include: {
          schoolClass: { select: { id: true, name: true, level: true, major: true } },
          subject: { select: { id: true, code: true, name: true } },
          teacher: { select: { id: true, nip: true, fullName: true, title: true } },
          _count: { select: { records: true } },
        },
      }),
    ]);

    return {
      data: sessions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSessionById(id: string, currentUser: any) {
    if (currentUser.role === Role.STUDENT) {
      throw new ForbiddenException(
        'Murid hanya dapat melihat status dan riwayat absensi miliknya sendiri.',
      );
    }

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        schoolClass: {
          include: {
            students: {
              where: { status: 'AKTIF' },
              orderBy: { fullName: 'asc' },
              select: {
                id: true,
                nis: true,
                nisn: true,
                fullName: true,
                gender: true,
                rfidCardUid: true,
              },
            },
          },
        },
        subject: true,
        teacher: true,
        records: {
          include: {
            student: {
              select: {
                id: true,
                nis: true,
                fullName: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Sesi absensi '${id}' tidak ditemukan`);
    }

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      const isTeacher = session.teacherId === teacherId;
      const isHomeroom = session.schoolClass.homeroomTeacherId === teacherId;
      if (!isTeacher && !isHomeroom) {
        throw new ForbiddenException('Akses ditolak: Anda bukan pengampu atau wali kelas sesi ini');
      }
    }

    return session;
  }

  async updateSession(id: string, dto: UpdateSessionDto, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: { schoolClass: true },
    });
    if (!existing) throw new NotFoundException('Sesi absensi tidak ditemukan');

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        existing.teacherId !== teacherId &&
        existing.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException('Akses ditolak: Anda tidak berwenang mengubah sesi kelas ini');
      }
    }

    const updateData: any = {};
    if (dto.classId) updateData.classId = dto.classId;
    if (dto.subjectId) updateData.subjectId = dto.subjectId;
    if (dto.teacherId) updateData.teacherId = dto.teacherId;
    if (dto.scheduleId !== undefined) updateData.scheduleId = dto.scheduleId;
    if (dto.date) {
      const d = new Date(dto.date);
      d.setHours(0, 0, 0, 0);
      updateData.date = d;
    }
    if (dto.startTime) updateData.startTime = dto.startTime;
    if (dto.endTime) updateData.endTime = dto.endTime;
    if (dto.room !== undefined) updateData.room = dto.room;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status) updateData.status = dto.status;
    updateData.updatedAt = new Date();

    const updated = await this.prisma.attendanceSession.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_SESSION_UPDATED',
      entity: 'ATTENDANCE_SESSION',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async submitRecords(
    sessionId: string,
    dto: SubmitAttendanceRecordsDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { schoolClass: true },
    });

    if (!session) {
      throw new NotFoundException(`Sesi absensi '${sessionId}' tidak ditemukan`);
    }

    if (session.status === SessionStatus.DITUTUP) {
      throw new BadRequestException('Sesi absensi sudah ditutup dan dikunci. Perubahan harus melalui alur koreksi.');
    }

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      const isTeacher = session.teacherId === teacherId;
      const isHomeroom = session.schoolClass.homeroomTeacherId === teacherId;
      if (!isTeacher && !isHomeroom) {
        throw new ForbiddenException('Akses ditolak: Anda tidak berwenang menyimpan absensi kelas ini');
      }
    }

    const studentIds = dto.records.map((r) => r.studentId);
    const uniqueIds = new Set(studentIds);
    if (uniqueIds.size !== studentIds.length) {
      throw new BadRequestException('Terdapat ID siswa duplikat dalam pengiriman absensi');
    }

    const enrolledStudents = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: session.classId,
      },
      select: { id: true },
    });
    if (enrolledStudents.length !== studentIds.length) {
      throw new BadRequestException(
        'Satu atau lebih siswa tidak terdaftar dalam kelas pada sesi absensi ini',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const upsertedRecords = [];

      for (const record of dto.records) {
        const item = await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
            notes: record.notes,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : new Date(),
            method: record.method || AttendanceMethod.MANUAL_TEACHER,
            recordedById: currentUser.id,
            updatedAt: new Date(),
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
            notes: record.notes,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : new Date(),
            method: record.method || AttendanceMethod.MANUAL_TEACHER,
            recordedById: currentUser.id,
          },
        });
        upsertedRecords.push(item);
      }

      const updatedSession = await tx.attendanceSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.SUDAH_DISIMPAN,
          updatedAt: new Date(),
        },
      });

      return { upsertedRecords, updatedSession, session: updatedSession };
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_BATCH_SUBMITTED',
      entity: 'ATTENDANCE_SESSION',
      entityId: sessionId,
      newValue: {
        totalRecords: dto.records.length,
        statusBreakdown: dto.records.map((r) => r.status),
      },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async updateRecord(
    sessionId: string,
    recordId: string,
    dto: UpdateAttendanceRecordDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { id: recordId },
      include: { student: true, session: { include: { schoolClass: true } } },
    });

    if (!record) {
      throw new NotFoundException(`Catatan absensi '${recordId}' tidak ditemukan`);
    }
    if (record.sessionId !== sessionId) {
      throw new NotFoundException(`Catatan absensi '${recordId}' tidak ditemukan pada sesi ini`);
    }
    if (record.session.status === SessionStatus.DITUTUP) {
      throw new BadRequestException(
        'Sesi absensi sudah ditutup. Perubahan harus melalui alur pengajuan koreksi.',
      );
    }
    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        record.session.teacherId !== teacherId &&
        record.session.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException('Akses ditolak: Anda tidak berwenang mengubah absensi kelas ini');
      }
    }

    const previousStatus = record.status;
    const newStatus = dto.status;

    const result = await this.prisma.$transaction(async (tx) => {
      const correction = await tx.attendanceCorrection.create({
        data: {
          recordId: record.id,
          sessionId,
          studentId: record.studentId,
          previousStatus,
          newStatus,
          reason: dto.reason || 'Koreksi langsung guru pengampu',
          correctedById: currentUser.id,
          status: PermissionStatus.DISETUJUI,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
          reviewNotes: 'Koreksi langsung oleh guru/admin',
        },
      });

      const updatedRecord = await tx.attendanceRecord.update({
        where: { id: record.id },
        data: {
          status: newStatus,
          notes: dto.notes !== undefined ? dto.notes : record.notes,
          updatedAt: new Date(),
        },
      });

      return { updatedRecord, correction };
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_RECORD_CORRECTED',
      entity: 'ATTENDANCE_RECORD',
      entityId: record.id,
      oldValue: { status: previousStatus, student: record.student.fullName },
      newValue: { status: newStatus, reason: dto.reason },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  async closeSession(sessionId: string, currentUser: any, ip?: string, userAgent?: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { records: true, schoolClass: true },
    });

    if (!session) {
      throw new NotFoundException(`Sesi absensi '${sessionId}' tidak ditemukan`);
    }
    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (
        session.teacherId !== teacherId &&
        session.schoolClass.homeroomTeacherId !== teacherId
      ) {
        throw new ForbiddenException('Akses ditolak: Anda tidak berwenang menutup sesi kelas ini');
      }
    }

    if (session.status === SessionStatus.DITUTUP) {
      return { success: true, message: 'Sesi absensi sudah dalam keadaan ditutup', data: session };
    }

    if (session.records.length === 0) {
      throw new BadRequestException('Sesi absensi tidak dapat ditutup karena belum memiliki catatan kehadiran');
    }

    const closed = await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.DITUTUP,
        closedAt: new Date(),
        closedById: currentUser.id,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_SESSION_CLOSED',
      entity: 'ATTENDANCE_SESSION',
      entityId: sessionId,
      ipAddress: ip,
      userAgent,
    });

    return {
      success: true,
      message: 'Sesi absensi berhasil ditutup',
      data: closed,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Corrections Workflow (Request, List, Review)
  // ---------------------------------------------------------------------------

  async createCorrection(dto: CreateCorrectionRequestDto, currentUser: any, ip?: string, userAgent?: string) {
    let record: any = null;
    if (dto.recordId && dto.recordId !== 'record-today') {
      record = await this.prisma.attendanceRecord.findUnique({
        where: { id: dto.recordId },
        include: {
          session: { include: { schoolClass: true } },
          student: true,
        },
      });
    }

    if (!record) {
      let studentId: string | null = null;
      if (currentUser.role === Role.STUDENT) {
        studentId = await this.resolveStudentId(currentUser);
      } else if (dto.studentId && dto.studentId !== 'std-current') {
        studentId = dto.studentId;
      }

      if (studentId) {
        let session: any = null;
        if (dto.sessionId && dto.sessionId !== 'session-active') {
          session = await this.prisma.attendanceSession.findUnique({
            where: { id: dto.sessionId },
            include: { schoolClass: true },
          });
        }

        if (!session) {
          const student = await this.prisma.student.findUnique({ where: { id: studentId } });
          if (student?.classId) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            session = await this.prisma.attendanceSession.findFirst({
              where: { classId: student.classId, date: today },
              include: { schoolClass: true },
              orderBy: { createdAt: 'desc' },
            });
          }
        }

        if (session) {
          record = await this.prisma.attendanceRecord.findUnique({
            where: {
              sessionId_studentId: {
                sessionId: session.id,
                studentId,
              },
            },
            include: {
              session: { include: { schoolClass: true } },
              student: true,
            },
          });

          if (!record) {
            record = await this.prisma.attendanceRecord.create({
              data: {
                sessionId: session.id,
                studentId,
                status: dto.previousStatus || AttendanceStatus.ALPA,
                method: AttendanceMethod.MANUAL_TEACHER,
                notes: 'Dibuat otomatis dari pengajuan koreksi presensi',
              },
              include: {
                session: { include: { schoolClass: true } },
                student: true,
              },
            });
          }
        }
      }
    }

    if (!record) throw new NotFoundException('Catatan absensi tidak ditemukan');

    // Ownership check for student
    if (currentUser.role === Role.STUDENT) {
      const studentId = await this.resolveStudentId(currentUser);
      if (record.studentId !== studentId) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat mengajukan koreksi untuk data presensi Anda sendiri.');
      }
    } else if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      const isAssigned = await this.prisma.teachingAssignment.findFirst({
        where: {
          teacherId,
          classId: record.session.classId,
        },
        select: { id: true },
      });
      const isHomeroom = record.session.schoolClass?.homeroomTeacherId === teacherId;
      if (!isAssigned && !isHomeroom) {
        throw new ForbiddenException('Akses ditolak: Anda tidak berwenang mengajukan koreksi untuk kelas ini.');
      }
    }

    const correction = await this.prisma.attendanceCorrection.create({
      data: {
        recordId: record.id,
        sessionId: record.sessionId,
        studentId: record.studentId,
        previousStatus: record.status,
        newStatus: dto.newStatus,
        reason: dto.reason,
        correctedById: currentUser.id,
        status: PermissionStatus.MENUNGGU,
      },
      include: {
        record: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_CORRECTION_REQUESTED',
      entity: 'ATTENDANCE_CORRECTION',
      entityId: correction.id,
      newValue: {
        previousStatus: correction.previousStatus,
        newStatus: correction.newStatus,
        reason: correction.reason,
      },
      ipAddress: ip,
      userAgent,
    });

    return correction;
  }

  async findAllCorrections(currentUser: any, query?: { status?: PermissionStatus; classId?: string }) {
    const where: any = {};

    if (query?.status) where.status = query.status;

    if (currentUser.role === Role.STUDENT) {
      where.studentId = await this.resolveStudentId(currentUser);
    } else if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      where.session = {
        schoolClass: { homeroomTeacherId: teacherId },
      };
    }

    if (query?.classId) {
      where.session = { ...where.session, classId: query.classId };
    }

    const corrections = await this.prisma.attendanceCorrection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        record: {
          include: {
            student: { select: { fullName: true, nis: true } },
            session: {
              include: {
                schoolClass: { select: { name: true } },
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return corrections;
  }

  async reviewCorrection(id: string, dto: ReviewCorrectionDto, currentUser: any, ip?: string, userAgent?: string) {
    const correction = await this.prisma.attendanceCorrection.findUnique({
      where: { id },
      include: {
        record: true,
        session: { include: { schoolClass: true } },
      },
    });

    if (!correction) throw new NotFoundException('Pengajuan koreksi tidak ditemukan');

    if (correction.status !== PermissionStatus.MENUNGGU) {
      throw new BadRequestException(`Pengajuan koreksi sudah diproses dengan status '${correction.status}'`);
    }

    // Role check: Only homeroom teacher or admin/developer
    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      if (correction.session.schoolClass.homeroomTeacherId !== teacherId) {
        throw new ForbiddenException('Akses ditolak: Hanya wali kelas yang berhak meninjau pengajuan koreksi kelas ini.');
      }
    }

    if (currentUser.role === Role.STUDENT) {
      throw new ForbiddenException('Siswa tidak memiliki wewenang untuk menyetujui koreksi.');
    }

    const isApproved = dto.status === PermissionStatus.DISETUJUI;

    const result = await this.prisma.$transaction(async (tx) => {
      const reviewedCorrection = await tx.attendanceCorrection.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
          reviewNotes: dto.note || (isApproved ? 'Koreksi disetujui' : 'Koreksi ditolak'),
        },
      });

      let updatedRecord = null;
      if (isApproved) {
        updatedRecord = await tx.attendanceRecord.update({
          where: { id: correction.recordId },
          data: {
            status: correction.newStatus,
            updatedAt: new Date(),
          },
        });
      }

      return { reviewedCorrection, updatedRecord };
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: isApproved ? 'ATTENDANCE_CORRECTION_APPROVED' : 'ATTENDANCE_CORRECTION_REJECTED',
      entity: 'ATTENDANCE_CORRECTION',
      entityId: id,
      newValue: {
        status: dto.status,
        note: dto.note,
      },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  // ---------------------------------------------------------------------------
  // 6. Summary & Reports
  // ---------------------------------------------------------------------------

  async getSummary(query: { classId?: string; date?: string }, currentUser: any) {
    const whereSession: any = {};
    if (query.classId) whereSession.classId = query.classId;

    if (query.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      whereSession.date = { gte: d, lt: nextDay };
    }

    if (currentUser.role === Role.TEACHER) {
      const teacherId = await this.resolveTeacherId(currentUser);
      whereSession.OR = [
        { teacherId },
        {
          schoolClass: {
            homeroomTeacherId: teacherId,
          },
        },
      ];
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        session: whereSession,
        ...(currentUser.role === Role.STUDENT
          ? { studentId: await this.resolveStudentId(currentUser) }
          : {}),
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
      total,
      hadir,
      terlambat,
      sakit,
      izin,
      alpa,
      percentage,
    };
  }

  async getDailyReport(query: { date?: string; classId?: string }, currentUser: any) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      date: { gte: targetDate, lt: nextDay },
    };

    if (query.classId) where.classId = query.classId;

    if (currentUser.role === Role.TEACHER && currentUser.teacherId) {
      where.OR = [
        { teacherId: currentUser.teacherId },
        { schoolClass: { homeroomTeacherId: currentUser.teacherId } },
      ];
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        schoolClass: { select: { name: true, level: true, major: true } },
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
        records: {
          include: {
            student: { select: { fullName: true, nis: true, gender: true } },
          },
        },
      },
    });

    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;

    sessions.forEach((s) => {
      s.records.forEach((r) => {
        if (r.status === AttendanceStatus.HADIR) totalHadir++;
        else if (r.status === AttendanceStatus.TERLAMBAT) totalTerlambat++;
        else if (r.status === AttendanceStatus.SAKIT) totalSakit++;
        else if (r.status === AttendanceStatus.IZIN) totalIzin++;
        else if (r.status === AttendanceStatus.ALPA) totalAlpa++;
      });
    });

    const totalStudentsMarked = totalHadir + totalTerlambat + totalSakit + totalIzin + totalAlpa;
    const rate =
      totalStudentsMarked > 0
        ? Number((((totalHadir + totalTerlambat) / totalStudentsMarked) * 100).toFixed(1))
        : 100;

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSessions: sessions.length,
      totalMarked: totalStudentsMarked,
      hadir: totalHadir,
      terlambat: totalTerlambat,
      sakit: totalSakit,
      izin: totalIzin,
      alpa: totalAlpa,
      attendanceRate: rate,
      sessions,
    };
  }

  async getAttendanceAnomalies(query?: QueryAnomalyDto) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.severity) where.severity = query.severity;
    if (query?.status) where.status = query.status;
    if (query?.anomalyType) where.anomalyType = query.anomalyType;
    if (query?.userId) where.userId = query.userId;

    try {
      const [total, data] = await Promise.all([
        this.prisma.attendanceAnomaly.count({ where }),
        this.prisma.attendanceAnomaly.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (total > 0) {
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
    } catch {
      // Fallback to auditLog if table is newly migrating
    }

    // Fallback to auditLog
    const auditWhere = {
      action: { in: ['ATTENDANCE_ANOMALY_DETECTED', 'SECURITY_TOKEN_REUSE_DETECTED'] },
    };

    const [totalAudit, logs] = await Promise.all([
      this.prisma.auditLog.count({ where: auditWhere }),
      this.prisma.auditLog.findMany({
        where: auditWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const anomalies = logs.map((log) => {
      const payload: any = log.newValue || {};
      return {
        id: log.id,
        createdAt: log.createdAt,
        actorName: log.actorName,
        userRole: log.actorRole,
        action: log.action,
        userId: log.userId || 'system',
        anomalyType: payload.anomalyType || 'SECURITY_ALERT',
        severity: payload.severity || 'MEDIUM',
        status: 'PENDING_REVIEW',
        details: payload.details || 'Pola akses absensi tidak wajar terdeteksi',
        coords: payload.coords || null,
        deviceId: payload.deviceId || null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

    return {
      data: anomalies,
      meta: {
        page,
        limit,
        total: totalAudit,
        totalPages: Math.ceil(totalAudit / limit),
      },
    };
  }

  async resolveAnomaly(
    id: string,
    dto: ResolveAnomalyDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    const anomaly = await this.prisma.attendanceAnomaly.findUnique({
      where: { id },
    });
    if (!anomaly) {
      throw new NotFoundException('Data anomali absensi tidak ditemukan.');
    }

    const updated = await this.prisma.attendanceAnomaly.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNotes: dto.reviewNotes,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_ANOMALY_RESOLVED',
      entity: 'ATTENDANCE_ANOMALY',
      entityId: anomaly.id,
      oldValue: { status: anomaly.status, reviewNotes: anomaly.reviewNotes },
      newValue: { status: updated.status, reviewNotes: updated.reviewNotes },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async registerDevice(
    dto: RegisterDeviceDto,
    currentUser: any,
    ip?: string,
    userAgent?: string,
  ) {
    const config = await this.getAttendanceConfig();
    const existingCount = await this.prisma.attendanceDevice.count({
      where: { userId: currentUser.id },
    });

    const alreadyRegistered = await this.prisma.attendanceDevice.findUnique({
      where: {
        userId_deviceId: {
          userId: currentUser.id,
          deviceId: dto.deviceId,
        },
      },
    });

    if (!alreadyRegistered && existingCount >= config.maxDevicesPerUser) {
      throw new BadRequestException(
        `Batas maksimum perangkat terdaftar telah tercapai (${config.maxDevicesPerUser} perangkat). Hubungi administrator untuk mereset perangkat.`,
      );
    }

    const device = await this.prisma.attendanceDevice.upsert({
      where: {
        userId_deviceId: {
          userId: currentUser.id,
          deviceId: dto.deviceId,
        },
      },
      create: {
        userId: currentUser.id,
        deviceId: dto.deviceId,
        deviceModel: dto.deviceModel,
        osVersion: dto.osVersion,
        appVersion: dto.appVersion,
        isTrusted: true,
      },
      update: {
        deviceModel: dto.deviceModel || undefined,
        osVersion: dto.osVersion || undefined,
        appVersion: dto.appVersion || undefined,
        lastUsedAt: new Date(),
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'ATTENDANCE_DEVICE_REGISTERED',
      entity: 'ATTENDANCE_DEVICE',
      entityId: device.id,
      newValue: { deviceId: device.deviceId, model: device.deviceModel },
      ipAddress: ip,
      userAgent,
    });

    return device;
  }

  async getUserDevices(currentUser: any) {
    return this.prisma.attendanceDevice.findMany({
      where: { userId: currentUser.id },
      orderBy: { lastUsedAt: 'desc' },
    });
  }
}
