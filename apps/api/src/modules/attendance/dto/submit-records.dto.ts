import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceMethod, AttendanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class StudentAttendanceItemDto {
  @ApiProperty({ description: 'ID Siswa' })
  @IsNotEmpty({ message: 'ID Siswa wajib diisi' })
  @IsString()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.HADIR })
  @IsEnum(AttendanceStatus, { message: 'Status harus salah satu dari: HADIR, TERLAMBAT, SAKIT, IZIN, ALPA' })
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Izin surat keterangan lomba' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: AttendanceMethod, default: AttendanceMethod.MANUAL_TEACHER })
  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @ApiPropertyOptional({ example: '2026-10-20T07:10:00Z', description: 'Waktu check-in presensi' })
  @IsOptional()
  @IsString()
  checkInTime?: string;
}

export class SubmitAttendanceRecordsDto {
  @ApiProperty({ type: [StudentAttendanceItemDto], description: 'Daftar catatan absensi siswa' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceItemDto)
  records: StudentAttendanceItemDto[];

  @ApiPropertyOptional({ description: 'Catatan umum sesi absensi' })
  @IsOptional()
  @IsString()
  sessionNotes?: string;
}
