import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceRecordDto {
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.HADIR })
  @IsNotEmpty({ message: 'Status kehadiran baru wajib diisi' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ example: 'Siswa salah tercatat alfa karena terlambat masuk', description: 'Alasan koreksi absensi' })
  @IsNotEmpty({ message: 'Alasan perubahan status kehadiran wajib dicantumkan' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Keterangan tambahan' })
  @IsOptional()
  @IsString()
  notes?: string;
}
