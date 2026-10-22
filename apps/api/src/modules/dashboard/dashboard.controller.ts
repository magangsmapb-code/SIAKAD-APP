import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Permission('attendance.view')
  @ApiOperation({ summary: 'Ringkasan data dashboard berbasis role pengguna' })
  @ApiResponse({ status: 200, description: 'Ringkasan statistik berhasil didapatkan' })
  async getSummary(@CurrentUser() user: any) {
    const data = await this.dashboardService.getSummary(user);
    return {
      message: 'Data summary dashboard berhasil dimuat',
      data,
    };
  }

  @Get('attendance-trends')
  @Permission('attendance.view')
  @ApiOperation({ summary: 'Tren kehadiran harian (default 7 hari terakhir)' })
  async getAttendanceTrends(@CurrentUser() user: any, @Query('days') days?: number) {
    const data = await this.dashboardService.getAttendanceTrends(user, days ? Number(days) : 7);
    return {
      message: 'Tren kehadiran berhasil dimuat',
      data,
    };
  }

  @Get('class-statistics')
  @Permission('attendance.view')
  @ApiOperation({ summary: 'Statistik kehadiran per kelas' })
  async getClassStatistics(@CurrentUser() user: any) {
    const data = await this.dashboardService.getClassStatistics(user);
    return {
      message: 'Statistik kelas berhasil dimuat',
      data,
    };
  }
}
