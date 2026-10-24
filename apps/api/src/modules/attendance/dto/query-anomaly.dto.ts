import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AnomalySeverity, AnomalyStatus } from '@prisma/client';

export class QueryAnomalyDto {
  @ApiPropertyOptional({ enum: AnomalySeverity })
  @IsOptional()
  @IsEnum(AnomalySeverity)
  severity?: AnomalySeverity;

  @ApiPropertyOptional({ enum: AnomalyStatus })
  @IsOptional()
  @IsEnum(AnomalyStatus)
  status?: AnomalyStatus;

  @ApiPropertyOptional({ description: 'Filter jenis anomali' })
  @IsOptional()
  @IsString()
  anomalyType?: string;

  @ApiPropertyOptional({ description: 'Filter ID pengguna' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
