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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DayOfWeek, Role } from '@prisma/client';

@ApiTags('Struktur Akademik')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ---------------------------------------------------------------------------
  // Academic Years
  // ---------------------------------------------------------------------------
  @Get('academic-years')
  @Permission('academic.classes.view')
  @ApiOperation({ summary: 'Daftar semua tahun ajaran' })
  async findAllAcademicYears() {
    const data = await this.academicService.findAllAcademicYears();
    return { message: 'Tahun ajaran berhasil dimuat', data };
  }

  @Get('academic-years/active')
  @Permission('academic.classes.view')
  @ApiOperation({ summary: 'Dapatkan tahun ajaran yang sedang aktif' })
  async findActiveAcademicYear() {
    const data = await this.academicService.findActiveAcademicYear();
    return { message: 'Tahun ajaran aktif berhasil dimuat', data };
  }

  @Post('academic-years')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.classes.manage')
  @ApiOperation({ summary: 'Tambah tahun ajaran baru (Admin)' })
  async createAcademicYear(@Body() dto: CreateAcademicYearDto, @CurrentUser() user: any) {
    const data = await this.academicService.createAcademicYear(dto, user);
    return { message: 'Tahun ajaran berhasil ditambahkan', data };
  }

  @Post('academic-years/:id/activate')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.classes.manage')
  @ApiOperation({ summary: 'Aktifkan tahun ajaran (Admin)' })
  async setActiveAcademicYear(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.academicService.setActiveAcademicYear(id, user);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Classes
  // ---------------------------------------------------------------------------
  @Get('classes')
  @Permission('academic.classes.view')
  @ApiOperation({ summary: 'Daftar kelas dengan filter' })
  async findAllClasses(
    @Query('academicYearId') academicYearId?: string,
    @Query('level') level?: string,
    @Query('major') major?: string,
  ) {
    const data = await this.academicService.findAllClasses({ academicYearId, level, major });
    return { message: 'Data kelas berhasil dimuat', data };
  }

  @Get('classes/:id')
  @Permission('academic.classes.view')
  @ApiOperation({ summary: 'Detail kelas dan daftar siswa aktif' })
  async findClassById(@Param('id') id: string) {
    const data = await this.academicService.findClassById(id);
    return { message: 'Detail kelas berhasil dimuat', data };
  }

  @Post('classes')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.classes.manage')
  @ApiOperation({ summary: 'Tambah kelas baru (Admin)' })
  async createClass(@Body() dto: CreateClassDto, @CurrentUser() user: any) {
    const data = await this.academicService.createClass(dto, user);
    return { message: 'Kelas berhasil dibuat', data };
  }

  @Patch('classes/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.classes.manage')
  @ApiOperation({ summary: 'Perbarui kelas (Admin)' })
  async updateClass(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClassDto>,
    @CurrentUser() user: any,
  ) {
    const data = await this.academicService.updateClass(id, dto, user);
    return { message: 'Kelas berhasil diperbarui', data };
  }

  // ---------------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------------
  @Get('subjects')
  @Permission('academic.subjects.view')
  @ApiOperation({ summary: 'Daftar mata pelajaran' })
  async findAllSubjects(@Query('category') category?: string, @Query('search') search?: string) {
    const data = await this.academicService.findAllSubjects({ category, search });
    return { message: 'Data mata pelajaran berhasil dimuat', data };
  }

  @Get('subjects/:id')
  @Permission('academic.subjects.view')
  @ApiOperation({ summary: 'Detail mata pelajaran' })
  async findSubjectById(@Param('id') id: string) {
    const data = await this.academicService.findSubjectById(id);
    return { message: 'Detail mapel berhasil dimuat', data };
  }

  @Post('subjects')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.subjects.manage')
  @ApiOperation({ summary: 'Tambah mata pelajaran baru (Admin)' })
  async createSubject(@Body() dto: CreateSubjectDto, @CurrentUser() user: any) {
    const data = await this.academicService.createSubject(dto, user);
    return { message: 'Mata pelajaran berhasil ditambahkan', data };
  }

  @Patch('subjects/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.subjects.manage')
  @ApiOperation({ summary: 'Perbarui mata pelajaran (Admin)' })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubjectDto>,
    @CurrentUser() user: any,
  ) {
    const data = await this.academicService.updateSubject(id, dto, user);
    return { message: 'Mata pelajaran berhasil diperbarui', data };
  }

  // ---------------------------------------------------------------------------
  // Schedules
  // ---------------------------------------------------------------------------
  @Get('schedules')
  @Permission('academic.schedules.view')
  @ApiOperation({ summary: 'Daftar jadwal pelajaran aktif' })
  async findAllSchedules(
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('dayOfWeek') dayOfWeek?: DayOfWeek,
    @CurrentUser() user?: any,
  ) {
    const data = await this.academicService.findAllSchedules({ classId, teacherId, dayOfWeek }, user);
    return { message: 'Jadwal pelajaran berhasil dimuat', data };
  }

  @Post('schedules')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.schedules.manage')
  @ApiOperation({ summary: 'Tambah jadwal pelajaran (Admin)' })
  async createSchedule(@Body() dto: CreateScheduleDto, @CurrentUser() user: any) {
    const data = await this.academicService.createSchedule(dto, user);
    return { message: 'Jadwal pelajaran berhasil dibuat', data };
  }

  @Patch('schedules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.schedules.manage')
  @ApiOperation({ summary: 'Perbarui jadwal pelajaran (Admin)' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: Partial<CreateScheduleDto>,
    @CurrentUser() user: any,
  ) {
    const data = await this.academicService.updateSchedule(id, dto, user);
    return { message: 'Jadwal pelajaran berhasil diperbarui', data };
  }

  @Delete('schedules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('academic.schedules.manage')
  @ApiOperation({ summary: 'Hapus jadwal pelajaran (Admin)' })
  async deleteSchedule(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.academicService.deleteSchedule(id, user);
    return result;
  }
}
