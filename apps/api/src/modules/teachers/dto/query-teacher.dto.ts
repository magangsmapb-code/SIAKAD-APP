import { ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Transform } from 'class-transformer';

export class QueryTeacherDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TeacherStatus, description: 'Filter status guru' })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;

  @ApiPropertyOptional({ description: 'Filter guru wali kelas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isHomeroom?: boolean;
}
