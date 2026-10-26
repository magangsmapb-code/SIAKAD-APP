import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'KIM-10', description: 'Kode mata pelajaran unik' })
  @IsNotEmpty({ message: 'Kode mapel wajib diisi' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Kimia', description: 'Nama mata pelajaran' })
  @IsNotEmpty({ message: 'Nama mapel wajib diisi' })
  @IsString()
  name: string;

  @ApiProperty({ enum: SubjectCategory, default: SubjectCategory.WAJIB })
  @IsEnum(SubjectCategory)
  category: SubjectCategory;

  @ApiPropertyOptional({ default: 2, description: 'Jam pelajaran per minggu' })
  @IsOptional()
  @IsInt()
  @Min(1)
  creditHours?: number;

  @ApiPropertyOptional({ example: 2, description: 'Alias jam pelajaran per minggu' })
  @IsOptional()
  @IsInt()
  hoursPerWeek?: number;


  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
