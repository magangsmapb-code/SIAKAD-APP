import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getSettings() {
    let setting = await this.prisma.schoolSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.schoolSetting.create({
        data: {
          schoolName: 'SMA Pemberdayaan Bangsa Ngrayun',
          npsn: '20512345',
          address: 'Jl. Raya Ngrayun No. 45, Ponorogo, Jawa Timur 63464',
          phone: '(0352) 123456',
          email: 'info@smapbngrayun.sch.id',
          minAttendancePercentage: 90.0,
          timezone: 'Asia/Jakarta',
          allowSelfPermission: true,
        },
      });
    }
    return setting;
  }

  async updateSettings(dto: UpdateSettingsDto, currentUser: any, ip?: string, userAgent?: string) {
    let setting = await this.prisma.schoolSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.schoolSetting.create({
        data: {
          schoolName: dto.schoolName || 'SMA Pemberdayaan Bangsa Ngrayun',
          npsn: dto.npsn || '20512345',
          address: dto.address || 'Jl. Raya Ngrayun No. 45, Ponorogo, Jawa Timur 63464',
          phone: dto.phone || '(0352) 123456',
          email: dto.email || 'info@smapbngrayun.sch.id',
          minAttendancePercentage: dto.minAttendancePercentage || 90.0,
          timezone: dto.timezone || 'Asia/Jakarta',
          allowSelfPermission: dto.allowSelfPermission ?? true,
        },
      });
    } else {
      setting = await this.prisma.schoolSetting.update({
        where: { id: setting.id },
        data: dto,
      });
    }

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'SETTINGS_UPDATED',
      entity: 'SCHOOL_SETTING',
      entityId: setting.id,
      newValue: dto,
      ipAddress: ip,
      userAgent,
    });

    return setting;
  }
}
