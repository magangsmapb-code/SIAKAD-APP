import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { FeaturesService } from './features.service';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';

@ApiTags('Feature Registry & Tata Kelola Pengembang')
@Controller('features')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER, Role.ADMIN)
  @ApiOperation({ summary: 'Daftar seluruh registri fitur, status implementasi, dan status aktivasi' })
  @ApiResponse({ status: 200, description: 'Registri fitur berhasil dimuat' })
  async findAll() {
    const data = await this.featuresService.findAll();
    return {
      message: 'Registri fitur sistem berhasil dimuat',
      data,
    };
  }

  @Get('permissions/matrix')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER, Role.ADMIN)
  @ApiOperation({ summary: 'Daftar izin granular sistem dan matriks hak akses per role' })
  @ApiResponse({ status: 200, description: 'Matriks role dan permission berhasil dimuat' })
  async getPermissionMatrix() {
    const data = await this.featuresService.getPermissionMatrix();
    return {
      message: 'Matriks izin granular dan role berhasil dimuat',
      data,
    };
  }

  @Patch('permissions/:role')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @Permission('developer.manage_features')
  @ApiOperation({ summary: 'Atur satu permission role (khusus Developer dan Super Admin)' })
  async updateRolePermission(
    @Param('role') role: string,
    @Body() dto: UpdateRolePermissionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await this.featuresService.updateRolePermission(
      role,
      dto,
      user,
      ip,
      userAgent,
    );
    return {
      message: 'Permission role berhasil diperbarui dan dicatat pada audit log',
      data,
    };
  }

  @Get('security/overview')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @Permission('developer.manage_features')
  @ApiOperation({ summary: 'Ringkasan postur keamanan, metrik ancaman, dan kontrol sistem' })
  @ApiResponse({ status: 200, description: 'Overview keamanan berhasil dimuat' })
  async getSecurityOverview() {
    const data = await this.featuresService.getSecurityOverview();
    return {
      message: 'Postur dan ringkasan kontrol keamanan berhasil dimuat',
      data,
    };
  }

  @Post('security/diagnostics')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @Permission('developer.manage_features')
  @ApiOperation({ summary: 'Jalankan uji coba kontrol keamanan non-destruktif' })
  @ApiResponse({ status: 200, description: 'Hasil diagnostik keamanan berhasil diperoleh' })
  async runSecurityDiagnostics() {
    const data = await this.featuresService.runSecurityDiagnostics();
    return {
      message: 'Uji diagnostik keamanan non-destruktif berhasil dieksekusi',
      data,
    };
  }

  @Get(':key')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER, Role.ADMIN)
  @ApiOperation({ summary: 'Detail spesifik fitur sistem berdasarkan identifier unik' })
  @ApiResponse({ status: 200, description: 'Detail fitur berhasil dimuat' })
  async findOne(@Param('key') key: string) {
    const data = await this.featuresService.findOne(key);
    return {
      message: 'Detail fitur berhasil dimuat',
      data,
    };
  }

  @Patch(':key')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @Permission('developer.manage_features')
  @ApiOperation({ summary: 'Aktivasi, nonaktifkan, atau atur maintenance mode fitur (khusus Developer)' })
  @ApiResponse({ status: 200, description: 'Konfigurasi fitur berhasil diperbarui' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const data = await this.featuresService.update(key, dto, user, ip, userAgent);
    return {
      message: `Konfigurasi fitur '${data.name}' berhasil diperbarui`,
      data,
    };
  }
}
