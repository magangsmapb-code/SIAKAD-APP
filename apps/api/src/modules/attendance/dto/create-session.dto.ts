import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID Kelas' })
  @IsNotEmpty({ message: 'Kelas wajib dipilih' })
  @IsString()
  classId: string;

  @ApiProperty({ description: 'ID Mata Pelajaran' })
  @IsNotEmpty({ message: 'Mata pelajaran wajib dipilih' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'ID Jadwal Pelajaran jika terjadwal' })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiProperty({ example: '2026-10-15', description: 'Tanggal pelaksanaan format YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal sesi wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal harus YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: '07:00', description: 'Waktu mulai format HH:MM' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu mulai harus HH:MM' })
  startTime: string;

  @ApiProperty({ example: '08:30', description: 'Waktu selesai format HH:MM' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu selesai harus HH:MM' })
  endTime: string;

  @ApiPropertyOptional({ example: 'R. 101' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ example: 'Pertemuan 9: Gelombang Mekanik' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: SessionStatus, default: SessionStatus.SEDANG_BERLANGSUNG, description: 'Status sesi (mendukung SELESAI / DITUTUP)' })
  @IsOptional()
  @Transform(({ value }) => (value === 'SELESAI' ? SessionStatus.DITUTUP : value))
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
