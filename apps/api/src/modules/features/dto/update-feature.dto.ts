import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { FeatureMaintenanceStatus } from '@prisma/client';

export class UpdateFeatureDto {
  @ApiPropertyOptional({ example: true, description: 'Status aktivasi fitur' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ enum: FeatureMaintenanceStatus, example: 'ACTIVE', description: 'Status pemeliharaan fitur' })
  @IsOptional()
  @IsEnum(FeatureMaintenanceStatus)
  maintenanceStatus?: FeatureMaintenanceStatus;

  @ApiPropertyOptional({ example: 'Sistem sedang dalam sinkronisasi berkala', description: 'Pesan pemeliharaan' })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @ApiPropertyOptional({ example: 'Pembaruan modul presensi', description: 'Catatan perubahan konfigurasi' })
  @IsOptional()
  @IsString()
  changeNotes?: string;
}
