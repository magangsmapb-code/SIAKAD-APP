import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Semester, GradePredicate } from '@prisma/client';

export class QueryGradeDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Siswa' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Rombel / Kelas' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Mata Pelajaran' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Tahun Ajaran' })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiPropertyOptional({ enum: Semester, description: 'Filter semester' })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({ enum: GradePredicate, description: 'Filter predikat huruf (A, B, C, D)' })
  @IsOptional()
  @IsEnum(GradePredicate)
  predicate?: GradePredicate;

  @ApiPropertyOptional({ description: 'Halaman data', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Jumlah entri per halaman', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
