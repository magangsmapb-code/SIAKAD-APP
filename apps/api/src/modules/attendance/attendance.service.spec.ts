import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AttendanceStatus, Role, SessionStatus } from '@prisma/client';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      attendanceSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attendanceRecord: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      attendanceCorrection: {
        create: jest.fn(),
      },
      teachingAssignment: {
        findFirst: jest.fn(),
      },
      class: {
        findFirst: jest.fn(),
      },
      student: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      teacher: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      teacherAttendance: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      attendanceConfig: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attendanceAnomaly: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      attendanceDevice: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditService = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('createSession authorization', () => {
    it('harus menolak jika guru membuat sesi di kelas yang tidak dia ampu atau walikan', async () => {
      prisma.teachingAssignment.findFirst.mockResolvedValue(null);
      prisma.class.findFirst.mockResolvedValue(null);

      const teacherUser = {
        id: 'user-guru',
        role: Role.TEACHER,
        teacherId: 'teacher-1',
      };

      await expect(
        service.createSession(
          {
            classId: 'class-unauthorized',
            subjectId: 'sub-1',
            date: '2026-10-15',
            startTime: '07:00',
            endTime: '08:30',
          },
          teacherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitRecords validation', () => {
    it('harus menolak penyimpanan absensi jika sesi absensi telah berstatus DITUTUP', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-1',
        status: SessionStatus.DITUTUP,
        schoolClass: { id: 'c-1', homeroomTeacherId: 'teacher-1' },
      });

      await expect(
        service.submitRecords(
          'session-1',
          {
            records: [{ studentId: 'student-1', status: AttendanceStatus.HADIR }],
          },
          { id: 'u-1', role: Role.TEACHER, teacherId: 'teacher-1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak penyimpanan absensi jika terdapat ID siswa duplikat dalam batch', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-1',
        status: SessionStatus.SEDANG_BERLANGSUNG,
        teacherId: 'teacher-1',
        classId: 'c-1',
        schoolClass: { id: 'c-1', homeroomTeacherId: 'teacher-1' },
      });

      await expect(
        service.submitRecords(
          'session-1',
          {
            records: [
              { studentId: 'student-1', status: AttendanceStatus.HADIR },
              { studentId: 'student-1', status: AttendanceStatus.ALPA },
            ],
          },
          { id: 'u-1', role: Role.TEACHER, teacherId: 'teacher-1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak penyimpanan absensi jika siswa bukan anggota kelas pada sesi tersebut', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-1',
        status: SessionStatus.SEDANG_BERLANGSUNG,
        teacherId: 'teacher-1',
        classId: 'c-1',
        schoolClass: { id: 'c-1', homeroomTeacherId: 'teacher-1' },
      });

      // Student findMany returns empty or mismatch
      prisma.student.findMany.mockResolvedValue([]);

      await expect(
        service.submitRecords(
          'session-1',
          {
            records: [{ studentId: 'student-alien', status: AttendanceStatus.HADIR }],
          },
          { id: 'u-1', role: Role.TEACHER, teacherId: 'teacher-1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus berhasil menyimpan catatan absensi dalam transaksi database jika sesi masih aktif', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 'session-1',
        status: SessionStatus.SEDANG_BERLANGSUNG,
        teacherId: 'teacher-1',
        classId: 'c-1',
        schoolClass: { id: 'c-1', homeroomTeacherId: 'teacher-1' },
      });

      prisma.student.findMany.mockResolvedValue([{ id: 'student-1' }]);

      prisma.attendanceRecord.upsert.mockResolvedValue({
        id: 'rec-1',
        studentId: 'student-1',
        status: AttendanceStatus.HADIR,
      });

      prisma.attendanceSession.update.mockResolvedValue({
        id: 'session-1',
        status: SessionStatus.SUDAH_DISIMPAN,
      });

      const result = await service.submitRecords(
        'session-1',
        {
          records: [{ studentId: 'student-1', status: AttendanceStatus.HADIR }],
        },
        { id: 'u-1', role: Role.TEACHER, teacherId: 'teacher-1' },
      );

      expect(result.session.status).toBe(SessionStatus.SUDAH_DISIMPAN);
      expect(prisma.attendanceRecord.upsert).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ATTENDANCE_BATCH_SUBMITTED' }),
      );
    });
  });

  describe('updateRecord & audit log', () => {
    it('harus mencatat koreksi ke tabel AttendanceCorrection dan audit log saat mengubah absensi', async () => {
      prisma.attendanceRecord.findFirst.mockResolvedValue({
        id: 'rec-1',
        sessionId: 'session-1',
        studentId: 'student-1',
        status: AttendanceStatus.ALPA,
        session: { teacherId: 'teacher-1' },
        student: { fullName: 'Aditya Pratama' },
      });

      prisma.attendanceCorrection.create.mockResolvedValue({
        id: 'corr-1',
        previousStatus: AttendanceStatus.ALPA,
        newStatus: AttendanceStatus.HADIR,
      });

      prisma.attendanceRecord.update.mockResolvedValue({
        id: 'rec-1',
        status: AttendanceStatus.HADIR,
      });

      const result = await service.updateRecord(
        'session-1',
        'rec-1',
        { status: AttendanceStatus.HADIR, reason: 'Siswa hadir terlambat 10 menit' },
        { id: 'u-1', role: Role.TEACHER, teacherId: 'teacher-1' },
      );

      expect(prisma.attendanceCorrection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            previousStatus: AttendanceStatus.ALPA,
            newStatus: AttendanceStatus.HADIR,
            reason: 'Siswa hadir terlambat 10 menit',
          }),
        }),
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_RECORD_CORRECTED',
          newValue: expect.objectContaining({ status: AttendanceStatus.HADIR }),
        }),
      );
    });
  });

  describe('Anti-Cheat & Multi-Layer Attendance Security', () => {
    const mockConfig = {
      id: 'cfg-1',
      checkInStartTime: '00:00',
      checkInEndTime: '23:59',
      lateThresholdTime: '07:00',
      enableGps: true,
      schoolLatitude: -8.0435,
      schoolLongitude: 111.4123,
      maxGpsRadiusMeters: 100,
      maxGpsAccuracyMeters: 50,
      allowedMethods: '["SELF_MOBILE"]',
      allowTeacherSelfCheckIn: true,
      allowStudentSelfCheckIn: true,
      requireDeviceBinding: false,
      maxDevicesPerUser: 1,
      maintenanceMode: false,
      replayWindowSeconds: 60,
    };

    it('harus menolak replay attack jika nonce yang sama digunakan berulang', async () => {
      prisma.attendanceConfig.findFirst.mockResolvedValue(mockConfig);
      prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', fullName: 'Guru Test' });
      prisma.teacherAttendance.findUnique.mockResolvedValue(null);
      prisma.teacherAttendance.create.mockResolvedValue({ id: 'att-1', status: AttendanceStatus.HADIR });
      prisma.attendanceAnomaly.create.mockResolvedValue({ id: 'anom-1' });

      const currentUser = { id: 'u-guru', role: Role.TEACHER, teacherId: 'teacher-1' };
      const checkInDto = {
        latitude: -8.0435,
        longitude: 111.4123,
        gpsAccuracyMeters: 15,
        nonce: 'nonce_unique_123',
      };

      // First check-in succeeds
      await service.teacherCheckIn(checkInDto, currentUser);

      // Replayed request with same nonce must be rejected
      await expect(service.teacherCheckIn(checkInDto, currentUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('harus menolak check-in jika akurasi GPS terlalu rendah dan mencatat anomali', async () => {
      prisma.attendanceConfig.findFirst.mockResolvedValue(mockConfig);
      prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', fullName: 'Guru Test' });
      prisma.attendanceAnomaly.create.mockResolvedValue({ id: 'anom-1' });

      const currentUser = { id: 'u-guru', role: Role.TEACHER, teacherId: 'teacher-1' };
      const checkInDto = {
        latitude: -8.0435,
        longitude: 111.4123,
        gpsAccuracyMeters: 250, // > 2 * maxGpsAccuracyMeters (100m)
        nonce: 'nonce_gps_test',
      };

      await expect(service.teacherCheckIn(checkInDto, currentUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.attendanceAnomaly.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            anomalyType: 'LOW_GPS_ACCURACY',
          }),
        }),
      );
    });

    it('harus menolak check-in jika lokasi berada di luar perimeter sekolah', async () => {
      prisma.attendanceConfig.findFirst.mockResolvedValue(mockConfig);
      prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', fullName: 'Guru Test' });
      prisma.attendanceAnomaly.create.mockResolvedValue({ id: 'anom-1' });

      const currentUser = { id: 'u-guru', role: Role.TEACHER, teacherId: 'teacher-1' };
      // Lokasi berjarak ~5km dari sekolah
      const checkInDto = {
        latitude: -8.1000,
        longitude: 111.4500,
        gpsAccuracyMeters: 10,
        nonce: 'nonce_geofence_breach',
      };

      await expect(service.teacherCheckIn(checkInDto, currentUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.attendanceAnomaly.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            anomalyType: 'GEOFENCE_RADIUS_BREACH',
          }),
        }),
      );
    });

    it('harus menolak check-in jika kebijakan requireDeviceBinding aktif dan perangkat belum terdaftar', async () => {
      prisma.attendanceConfig.findFirst.mockResolvedValue({
        ...mockConfig,
        requireDeviceBinding: true,
      });
      prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', fullName: 'Guru Test' });
      prisma.attendanceDevice.findUnique.mockResolvedValue(null);

      const currentUser = { id: 'u-guru', role: Role.TEACHER, teacherId: 'teacher-1' };
      const checkInDto = {
        latitude: -8.0435,
        longitude: 111.4123,
        deviceId: 'unregistered_device_xyz',
        nonce: 'nonce_device_binding',
      };

      await expect(service.teacherCheckIn(checkInDto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('harus mendeteksi penggunaan satu perangkat untuk multi-akun dalam 15 menit', async () => {
      prisma.attendanceConfig.findFirst.mockResolvedValue(mockConfig);
      prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-2', fullName: 'Guru Dua' });
      prisma.teacherAttendance.findFirst.mockResolvedValue({
        id: 'att-prev',
        teacher: { fullName: 'Guru Satu' },
      });
      prisma.attendanceRecord.findFirst.mockResolvedValue(null);
      prisma.teacherAttendance.findUnique.mockResolvedValue(null);
      prisma.teacherAttendance.create.mockResolvedValue({ id: 'att-2', status: AttendanceStatus.HADIR });
      prisma.attendanceAnomaly.create.mockResolvedValue({ id: 'anom-multi' });

      const currentUser = { id: 'u-guru-2', role: Role.TEACHER, teacherId: 'teacher-2' };
      const checkInDto = {
        latitude: -8.0435,
        longitude: 111.4123,
        gpsAccuracyMeters: 10,
        deviceId: 'shared_device_999',
        nonce: 'nonce_proxy_test',
      };

      await service.teacherCheckIn(checkInDto, currentUser);

      expect(prisma.attendanceAnomaly.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            anomalyType: 'MULTI_ACCOUNT_DEVICE_BREACH',
          }),
        }),
      );
    });
  });
});
