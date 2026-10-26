import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';
import { Semester } from '@prisma/client';

export class BatchGradeDto {
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

  @ApiPropertyOptional({ enum: Semester, default: Semester.GANJIL })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester = Semester.GANJIL;

  @ApiProperty({ type: [CreateGradeDto], description: 'Daftar nilai seluruh siswa dalam rombel' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeDto)
  grades: CreateGradeDto[];
}
