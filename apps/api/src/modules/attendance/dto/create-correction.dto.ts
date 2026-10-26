import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateCorrectionRequestDto {
  @ApiPropertyOptional({ description: 'ID catatan absensi yang ingin dikoreksi' })
  @IsOptional()
  @IsString()
  recordId?: string;

  @ApiPropertyOptional({ description: 'ID sesi absensi' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'ID siswa yang mengajukan koreksi' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    description: 'Status kehadiran sebelumnya',
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  previousStatus?: AttendanceStatus;

  @ApiProperty({
    enum: AttendanceStatus,
    description: 'Status kehadiran baru yang diajukan',
  })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  newStatus: AttendanceStatus;

  @ApiProperty({
    example: 'Koreksi karena sebelumnya surat izin sakit baru diserahkan ke wali kelas',
    description: 'Alasan pengajuan koreksi status kehadiran',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'URL lampiran bukti pendukung jika ada' })
  @IsOptional()
  @IsString()
  proofAttachmentUrl?: string;
}

