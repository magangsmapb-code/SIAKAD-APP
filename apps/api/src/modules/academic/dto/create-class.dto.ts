import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassLevel, Major } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'X MIPA 3', description: 'Nama kelas' })
  @IsNotEmpty({ message: 'Nama kelas wajib diisi' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ClassLevel, example: ClassLevel.X })
  @IsEnum(ClassLevel)
  level: ClassLevel;

  @ApiProperty({ enum: Major, example: Major.MIPA })
  @IsEnum(Major)
  major: Major;

  @ApiPropertyOptional({ example: 'R. 104' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiProperty({ description: 'ID Tahun Ajaran' })
  @IsNotEmpty({ message: 'Tahun ajaran wajib dipilih' })
  @IsString()
  academicYearId: string;

  @ApiPropertyOptional({ description: 'ID Guru Wali Kelas' })
  @IsOptional()
  @IsString()
  homeroomTeacherId?: string;
}
