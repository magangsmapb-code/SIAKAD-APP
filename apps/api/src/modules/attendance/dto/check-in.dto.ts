import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AttendanceMethod } from '@prisma/client';

export class CheckInDto {
  @ApiPropertyOptional({ example: -8.0435, description: 'Garis lintang latitude perangkat' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 111.4123, description: 'Garis bujur longitude perangkat' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    enum: AttendanceMethod,
    default: AttendanceMethod.MANUAL_TEACHER,
    description: 'Metode absensi yang digunakan',
  })
  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @ApiPropertyOptional({ example: 'Hadir apel pagi', description: 'Catatan tambahan keterangan presensi' })
  @IsOptional()
  @IsString()
  notes?: string;
}
