import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permissions.decorator';
import { AttendanceModuleStatusGuard } from './attendance-module-status.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, PermissionStatus } from '@prisma/client';

@ApiTags('Absensi')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, AttendanceModuleStatusGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ---------------------------------------------------------------------------
  // 1. Centralized Attendance Configuration (Developer Governance)
  // ---------------------------------------------------------------------------

  @Get('config')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @ApiOperation({ summary: 'Ambil konfigurasi global modul absensi (jam, GPS radius, metode)' })
  async getAttendanceConfig() {
    const config = await this.attendanceService.getAttendanceConfig();
    return {
      message: 'Konfigurasi absensi berhasil dimuat',
      data: config,
    };
  }

  @Patch('config')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @Permission('attendance.manage_settings')
  @ApiOperation({ summary: 'Perbarui konfigurasi absensi (khusus Developer & Super Admin)' })
  async updateAttendanceConfig(
    @Body() dto: UpdateAttendanceConfigDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.updateAttendanceConfig(dto, user, ip, userAgent);
    return {
      message: 'Konfigurasi absensi berhasil diperbarui dan dicatat pada audit log',
      data: result,
    };
  }

  @Get('anomalies')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRINCIPAL, Role.DEVELOPER)
  @Permission('attendance.view_audit_log')
  @ApiOperation({ summary: 'Daftar anomali dan indikasi pelanggaran absensi untuk tinjauan manusia' })
  async getAttendanceAnomalies(@Query() query: QueryAnomalyDto) {
    const result = await this.attendanceService.getAttendanceAnomalies(query);
    return {
      message: 'Daftar anomali presensi berhasil dimuat',
      ...result,
    };
  }

  @Patch('anomalies/:id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRINCIPAL, Role.DEVELOPER)
  @Permission('attendance.manage_settings')
  @ApiOperation({ summary: 'Tinjau dan selesaikan anomali absensi (audit investigasi)' })
  async resolveAnomaly(
    @Param('id') id: string,
    @Body() dto: ResolveAnomalyDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.resolveAnomaly(id, dto, user, ip, userAgent);
    return {
      message: 'Status anomali absensi berhasil diperbarui',
      data: result,
    };
  }

  @Post('devices/register')
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Daftarkan perangkat untuk absensi mandiri' })
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.registerDevice(dto, user, ip, userAgent);
    return {
      message: 'Perangkat absensi berhasil didaftarkan',
      data: result,
    };
  }

  @Get('devices/me')
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Daftar perangkat terdaftar milik pengguna saat ini' })
  async getUserDevices(@CurrentUser() user: any) {
    const result = await this.attendanceService.getUserDevices(user);
    return {
      message: 'Daftar perangkat pengguna berhasil dimuat',
      data: result,
    };
  }

  @Get('devices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DEVELOPER)
  @Permission('attendance.manage_settings')
  @ApiOperation({ summary: 'Daftar seluruh perangkat terikat dalam sistem (Audit hardware presensi)' })
  async getAllDevices(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    const result = await this.attendanceService.getAllDevices({ page, limit, search });
    return {
      message: 'Daftar seluruh perangkat terikat berhasil dimuat',
      ...result,
    };
  }

  @Delete('devices/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DEVELOPER)
  @Permission('attendance.manage_settings')
  @ApiOperation({ summary: 'Lepas/Hapus tautan hardware device binding (Reset perangkat)' })
  async deleteDevice(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.deleteDevice(id, user, ip, userAgent);
    return result;
  }

  // ---------------------------------------------------------------------------
  // 2. Personal Teacher Attendance (Check-in / Check-out)
  // ---------------------------------------------------------------------------

  @Post('teacher/check-in')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('attendance.teacher.check_in')
  @ApiOperation({ summary: 'Check-in mandiri guru (dengan verifikasi jam & geofencing GPS)' })
  async teacherCheckIn(
    @Body() dto: CheckInDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.teacherCheckIn(dto, user, ip, userAgent);
    return {
      message: 'Presensi masuk guru berhasil dicatat',
      data: result,
    };
  }

  @Post('teacher/check-out')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('attendance.teacher.check_in')
  @ApiOperation({ summary: 'Check-out kepulangan guru' })
  async teacherCheckOut(
    @Body() dto: CheckInDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.teacherCheckOut(dto, user, ip, userAgent);
    return {
      message: 'Presensi keluar/pulang guru berhasil dicatat',
      data: result,
    };
  }

  @Get('teacher/today')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Status presensi guru hari ini' })
  async getTeacherToday(@CurrentUser() user: any) {
    const result = await this.attendanceService.getTeacherToday(user);
    return {
      message: 'Status presensi guru hari ini berhasil dimuat',
      data: result,
    };
  }

  @Get('teacher/history')
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Riwayat presensi mandiri guru' })
  async getTeacherHistory(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.attendanceService.getTeacherHistory(user, { page, limit });
    return {
      message: 'Riwayat presensi guru berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Student Self Attendance (Check-in)
  // ---------------------------------------------------------------------------

  @Post('student/check-in')
  @Roles(Role.STUDENT)
  @Permission('attendance.student.check_in')
  @ApiOperation({ summary: 'Check-in mandiri siswa (jika diaktifkan di Developer Dashboard)' })
  async studentCheckIn(
    @Body() dto: CheckInDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.studentCheckIn(dto, user, ip, userAgent);
    return {
      message: 'Presensi mandiri siswa berhasil dicatat',
      data: result,
    };
  }

  @Post('student/check-out')
  @Roles(Role.STUDENT)
  @Permission('attendance.student.check_in')
  @ApiOperation({ summary: 'Check-out kepulangan mandiri siswa' })
  async studentCheckOut(
    @Body() dto: CheckInDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.studentCheckOut(dto, user, ip, userAgent);
    return {
      message: 'Presensi keluar/pulang siswa berhasil dicatat',
      data: result,
    };
  }

  @Get('student/today')
  @Roles(Role.STUDENT)
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Status kehadiran siswa hari ini' })
  async getStudentToday(@CurrentUser() user: any) {
    const result = await this.attendanceService.getStudentToday(user);
    return {
      message: 'Status presensi siswa hari ini berhasil dimuat',
      data: result,
    };
  }

  @Get('student/history')
  @Roles(Role.STUDENT)
  @Permission('attendance.view_own')
  @ApiOperation({ summary: 'Riwayat absensi siswa yang login' })
  async getStudentHistory(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.attendanceService.getStudentHistory(user, { page, limit });
    return {
      message: 'Riwayat absensi pribadi berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Classroom Attendance Sessions & Records
  // ---------------------------------------------------------------------------

  @Get('sessions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.view_class')
  @ApiOperation({ summary: 'Daftar sesi absensi dengan pagination dan filter' })
  async findAllSessions(@Query() query: QuerySessionDto, @CurrentUser() user: any) {
    const result = await this.attendanceService.findAllSessions(query, user);
    return {
      message: 'Daftar sesi absensi berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post('sessions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.create')
  @ApiOperation({ summary: 'Buat sesi absensi baru' })
  @ApiResponse({ status: 201, description: 'Sesi absensi berhasil dibuat' })
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.createSession(dto, user, ip, userAgent);
    return {
      message: 'Sesi absensi berhasil dibuat',
      data: result,
    };
  }

  @Get('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.view_class')
  @ApiOperation({ summary: 'Detail sesi absensi beserta daftar siswa dan catatan kehadiran' })
  async findSessionById(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.attendanceService.findSessionById(id, user);
    return {
      message: 'Detail sesi absensi berhasil dimuat',
      data: result,
    };
  }

  @Patch('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.create')
  @ApiOperation({ summary: 'Perbarui informasi sesi absensi' })
  async updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.updateSession(id, dto, user, ip, userAgent);
    return {
      message: 'Sesi absensi berhasil diperbarui',
      data: result,
    };
  }

  @Post('sessions/:id/records')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.record')
  @ApiOperation({ summary: 'Simpan catatan absensi siswa (batch dalam transaksi database)' })
  @ApiResponse({ status: 200, description: 'Catatan absensi berhasil disimpan' })
  async submitRecords(
    @Param('id') sessionId: string,
    @Body() dto: SubmitAttendanceRecordsDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.submitRecords(sessionId, dto, user, ip, userAgent);
    return {
      message: 'Catatan absensi berhasil disimpan',
      data: result,
    };
  }

  @Patch('sessions/:id/records/:recordId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.correct')
  @ApiOperation({ summary: 'Koreksi langsung catatan absensi siswa oleh pengampu' })
  async updateRecord(
    @Param('id') sessionId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.updateRecord(sessionId, recordId, dto, user, ip, userAgent);
    return {
      message: 'Catatan absensi berhasil dikoreksi',
      data: result,
    };
  }

  @Post('sessions/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.close')
  @ApiOperation({ summary: 'Tutup sesi absensi secara permanen' })
  async closeSession(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.closeSession(id, user, ip, userAgent);
    return result;
  }

  // ---------------------------------------------------------------------------
  // 5. Corrections Workflow (Request, List, Review)
  // ---------------------------------------------------------------------------

  @Post('corrections')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @Permission('attendance.request_correction')
  @ApiOperation({ summary: 'Ajukan permohonan koreksi absensi' })
  async createCorrection(
    @Body() dto: CreateCorrectionRequestDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.createCorrection(dto, user, ip, userAgent);
    return {
      message: 'Permohonan koreksi absensi berhasil diajukan',
      data: result,
    };
  }

  @Get('corrections')
  @Permission('attendance.view')
  @ApiOperation({ summary: 'Daftar pengajuan koreksi absensi (terfilter sesuai role)' })
  async findAllCorrections(
    @Query('status') status: PermissionStatus,
    @Query('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.attendanceService.findAllCorrections(user, { status, classId });
    return {
      message: 'Daftar pengajuan koreksi absensi berhasil dimuat',
      data: result,
    };
  }

  @Patch('corrections/:id/review')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER)
  @Permission('attendance.approve_correction')
  @ApiOperation({ summary: 'Tinjau dan setujui/tolak permohonan koreksi absensi' })
  async reviewCorrection(
    @Param('id') id: string,
    @Body() dto: ReviewCorrectionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.attendanceService.reviewCorrection(id, dto, user, ip, userAgent);
    return {
      message: `Permohonan koreksi berhasil ${dto.status === PermissionStatus.DISETUJUI ? 'disetujui' : 'ditolak'}`,
      data: result,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Summary & Reports
  // ---------------------------------------------------------------------------

  @Get('summary')
  @Permission('attendance.view')
  @ApiOperation({ summary: 'Ringkasan agregasi kehadiran' })
  async getSummary(
    @Query('classId') classId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.attendanceService.getSummary({ classId, date }, user);
    return {
      message: 'Ringkasan kehadiran berhasil dimuat',
      data: result,
    };
  }

  @Get('reports/daily')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.DEVELOPER, Role.PRINCIPAL)
  @Permission('attendance.view_all')
  @ApiOperation({ summary: 'Laporan kehadiran harian komprehensif' })
  async getDailyReport(
    @Query('date') date: string,
    @Query('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.attendanceService.getDailyReport({ date, classId }, user);
    return {
      message: 'Laporan kehadiran harian berhasil dimuat',
      data: result,
    };
  }
}
