import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class UpdateAttendanceConfigDto {
  @ApiPropertyOptional({ example: '06:30', description: 'Waktu mulai check-in (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkInStartTime harus dalam format HH:mm',
  })
  checkInStartTime?: string;

  @ApiPropertyOptional({ example: '07:30', description: 'Waktu selesai batas check-in (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkInEndTime harus dalam format HH:mm',
  })
  checkInEndTime?: string;

  @ApiPropertyOptional({ example: '07:00', description: 'Ambang batas waktu keterlambatan (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'lateThresholdTime harus dalam format HH:mm',
  })
  lateThresholdTime?: string;

  @ApiPropertyOptional({ example: 15, description: 'Toleransi keterlambatan dalam menit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  lateToleranceMinutes?: number;

  @ApiPropertyOptional({ example: '14:00', description: 'Waktu mulai check-out pulang (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkOutStartTime harus dalam format HH:mm',
  })
  checkOutStartTime?: string;

  @ApiPropertyOptional({ example: '16:00', description: 'Waktu selesai batas check-out pulang (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkOutEndTime harus dalam format HH:mm',
  })
  checkOutEndTime?: string;

  @ApiPropertyOptional({ example: true, description: 'Wajibkan verifikasi lokasi geofencing GPS' })
  @IsOptional()
  @IsBoolean()
  enableGps?: boolean;

  @ApiPropertyOptional({ example: -8.0435, description: 'Latitude koordinat sekolah SMA PB Ngrayun' })
  @IsOptional()
  @IsNumber()
  schoolLatitude?: number;

  @ApiPropertyOptional({ example: 111.4123, description: 'Longitude koordinat sekolah SMA PB Ngrayun' })
  @IsOptional()
  @IsNumber()
  schoolLongitude?: number;

  @ApiPropertyOptional({ example: 100, description: 'Radius batas toleransi GPS dalam meter' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(5000)
  maxGpsRadiusMeters?: number;

  @ApiPropertyOptional({
    example: '["MANUAL_TEACHER","QR_CODE","RFID_CARD","FACE_RECOGNITION","SELF_MOBILE"]',
    description: 'Metode absensi yang diizinkan dalam format JSON string',
  })
  @IsOptional()
  @IsString()
  allowedMethods?: string;

  @ApiPropertyOptional({ example: false, description: 'Izinkan murid melakukan check-in mandiri di aplikasi' })
  @IsOptional()
  @IsBoolean()
  allowStudentSelfCheckIn?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Izinkan guru melakukan check-in mandiri' })
  @IsOptional()
  @IsBoolean()
  allowTeacherSelfCheckIn?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Wajibkan verifikasi foto kamera selfie' })
  @IsOptional()
  @IsBoolean()
  requirePhotoVerification?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Wajibkan persetujuan wali kelas untuk koreksi absensi' })
  @IsOptional()
  @IsBoolean()
  requireCorrectionApproval?: boolean;

  @ApiPropertyOptional({
    example: 'TEACHER_HOMEROOM',
    description: 'Peran yang berhak menyetujui koreksi (TEACHER_HOMEROOM, ADMIN, PRINCIPAL)',
  })
  @IsOptional()
  @IsString()
  correctionApproverRole?: string;

  @ApiPropertyOptional({ example: false, description: 'Aktifkan mode pemeliharaan (maintenance) modul absensi' })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ example: 'Sistem absensi sedang sinkronisasi data', description: 'Pesan maintenance' })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;
}
