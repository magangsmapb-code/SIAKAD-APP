import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionStatus, PermissionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryPermissionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PermissionStatus, description: 'Filter status (MENUNGGU, DISETUJUI, DITOLAK)' })
  @IsOptional()
  @IsEnum(PermissionStatus)
  status?: PermissionStatus;

  @ApiPropertyOptional({ enum: PermissionType, description: 'Filter jenis permohonan' })
  @IsOptional()
  @IsEnum(PermissionType)
  type?: PermissionType;

  @ApiPropertyOptional({ description: 'Filter ID Kelas' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter ID Siswa' })
  @IsOptional()
  @IsString()
  studentId?: string;
}
