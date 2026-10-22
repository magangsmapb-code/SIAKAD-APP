import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Laporan')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRINCIPAL, Role.SCHOOL_ADMIN)
  @Permission('reports.view')
  @ApiOperation({ summary: 'Laporan agregat kehadiran seluruh sekolah' })
  async getSchoolReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    const data = await this.reportsService.getSchoolAttendanceReport({ startDate, endDate, academicYearId });
    return {
      message: 'Laporan kehadiran sekolah berhasil dimuat',
      data,
    };
  }

  @Get('students/:id/attendance')
  @Permission('reports.view')
  @ApiOperation({ summary: 'Laporan rekapitulasi kehadiran per siswa' })
  async getStudentReport(
    @Param('id') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.reportsService.getStudentAttendanceReport(studentId, { startDate, endDate }, user);
    return {
      message: 'Laporan kehadiran siswa berhasil dimuat',
      data,
    };
  }

  @Get('classes/:id/attendance')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @Permission('reports.view')
  @ApiOperation({ summary: 'Laporan rekapitulasi kehadiran per kelas' })
  async getClassReport(
    @Param('id') classId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.reportsService.getClassAttendanceReport(classId, { startDate, endDate }, user);
    return {
      message: 'Laporan kehadiran kelas berhasil dimuat',
      data,
    };
  }
}
