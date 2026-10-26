import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Semester } from '@prisma/client';

export class CreateGradeDto {
  @ApiProperty({ description: 'ID Siswa yang dinilai' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'ID Mata Pelajaran' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'ID Rombel / Kelas' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ description: 'ID Tahun Ajaran' })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiPropertyOptional({ enum: Semester, default: Semester.GANJIL, description: 'Semester ajaran' })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester = Semester.GANJIL;

  @ApiPropertyOptional({ description: 'Nilai Formatif (Rata-rata tugas & kuis harian, 0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  formatif?: number = 0;

  @ApiPropertyOptional({ description: 'Nilai Sumatif Lingkup Materi (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sumatifMateri?: number = 0;

  @ApiPropertyOptional({ description: 'Nilai Penilaian Tengah Semester / PTS (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pts?: number = 0;

  @ApiPropertyOptional({ description: 'Nilai Penilaian Akhir Semester / PAS (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pas?: number = 0;

  @ApiPropertyOptional({ description: 'Kriteria Ketercapaian Tujuan Pembelajaran / KKTP Kurikulum Merdeka', default: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  kktp?: number = 75;

  @ApiPropertyOptional({ description: 'Deskripsi Capaian Kompetensi Rapor Kurikulum Merdeka' })
  @IsOptional()
  @IsString()
  competencySummary?: string;
}
