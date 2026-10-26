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

  @ApiPropertyOptional({ example: 12.5, description: 'Akurasi GPS perangkat dalam meter' })
  @IsOptional()
  @IsNumber()
  gpsAccuracyMeters?: number;

  @ApiPropertyOptional({ example: 'dev_pixel7_abc123', description: 'Identifier unik hardware/instalasi perangkat' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'Pixel 7 Pro', description: 'Model perangkat client' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'Android 14', description: 'Versi sistem operasi client' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: '2.1.0', description: 'Versi aplikasi SIAKAD' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({ example: 'nonce_9876543210', description: 'One-time challenge/nonce pencegah replay attack' })
  @IsOptional()
  @IsString()
  nonce?: string;

  @ApiPropertyOptional({ example: 'Hadir apel pagi', description: 'Catatan tambahan keterangan presensi' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'E280116060000204', description: 'UID Kartu RFID fisik siswa/guru' })
  @IsOptional()
  @IsString()
  rfidCardUid?: string;

  @ApiPropertyOptional({ example: '749201', description: 'Token sesi 6-digit dinamis' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: 'BC-2026-X-MIPA1', description: 'Barcode sesi kelas' })
  @IsOptional()
  @IsString()
  barcode?: string;
}

