import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Semester } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2026/2027', description: 'Tahun ajaran' })
  @IsNotEmpty({ message: 'Nama tahun ajaran wajib diisi' })
  @IsString()
  name: string;

  @ApiProperty({ enum: Semester, default: Semester.GANJIL })
  @IsEnum(Semester)
  semester: Semester;

  @ApiProperty({ example: '2026-07-15', description: 'Tanggal mulai format YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-20', description: 'Tanggal selesai format YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: false, description: 'Setel sebagai tahun ajaran aktif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
