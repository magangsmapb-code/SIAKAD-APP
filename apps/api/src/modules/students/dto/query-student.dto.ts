import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryStudentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Kelas' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ enum: StudentStatus, description: 'Filter status siswa' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: Gender, description: 'Filter jenis kelamin' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
