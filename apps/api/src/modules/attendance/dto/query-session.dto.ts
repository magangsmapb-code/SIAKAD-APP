import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QuerySessionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter ID Kelas' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter ID Guru' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Filter ID Mata Pelajaran' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ enum: SessionStatus, description: 'Filter status sesi (mendukung SELESAI / DITUTUP)' })
  @IsOptional()
  @Transform(({ value }) => (value === 'SELESAI' ? SessionStatus.DITUTUP : value))
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ example: '2026-10-15', description: 'Filter tanggal sesi format YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Tanggal mulai rentang' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Tanggal akhir rentang' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
