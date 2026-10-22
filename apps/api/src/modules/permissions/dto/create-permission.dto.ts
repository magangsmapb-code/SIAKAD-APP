import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePermissionDto {
  @ApiPropertyOptional({ description: 'ID Siswa (wajib jika diajukan oleh guru/admin; jika oleh siswa otomatis terisi)' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ enum: PermissionType, example: PermissionType.SAKIT, description: 'Jenis permohonan izin (SAKIT, IZIN, DISPENSASI)' })
  @IsNotEmpty({ message: 'Tipe izin wajib dipilih' })
  @IsEnum(PermissionType)
  type: PermissionType;

  @ApiProperty({ example: '2026-10-16', description: 'Tanggal mulai izin format YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal mulai wajib diisi' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-17', description: 'Tanggal akhir izin format YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal akhir wajib diisi' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 2, default: 1, description: 'Jumlah hari perizinan' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalDays?: number;

  @ApiProperty({ example: 'Demam dan flu, istirahat atas petunjuk dokter' })
  @IsNotEmpty({ message: 'Alasan permohonan izin wajib diisi' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'surat-dokter.jpg' })
  @IsOptional()
  @IsString()
  attachmentName?: string;

  @ApiPropertyOptional({ example: 'https://storage.smapemberdayaanbangsa.sch.id/surat-dokter.jpg' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})?(:\d+)?\/[a-zA-Z0-9_.\-\/%]*|\/uploads\/[a-zA-Z0-9_.\-\/%]*)$/, {
    message: 'attachmentUrl harus berupa URL HTTP/HTTPS yang sah atau path internal /uploads/ yang valid',
  })
  attachmentUrl?: string;
}
