import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Pengaturan Sekolah')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Dapatkan konfigurasi pengaturan sekolah aktif' })
  async getSettings() {
    const data = await this.settingsService.getSettings();
    return {
      message: 'Pengaturan sekolah berhasil dimuat',
      data,
    };
  }

  @Patch()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Perbarui konfigurasi pengaturan sekolah (Admin)' })
  @ApiResponse({ status: 200, description: 'Pengaturan berhasil diperbarui' })
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const data = await this.settingsService.updateSettings(dto, user, ip, userAgent);
    return {
      message: 'Pengaturan sekolah berhasil disimpan',
      data,
    };
  }
}
