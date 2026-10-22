import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PermissionStatus } from '@prisma/client';

export class ReviewCorrectionDto {
  @ApiProperty({
    enum: [PermissionStatus.DISETUJUI, PermissionStatus.DITOLAK],
    description: 'Status persetujuan koreksi (DISETUJUI atau DITOLAK)',
  })
  @IsNotEmpty()
  @IsEnum(PermissionStatus)
  status: PermissionStatus;

  @ApiPropertyOptional({
    example: 'Disetujui berdasarkan surat dokter yang valid',
    description: 'Catatan peninjauan koreksi absensi',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
