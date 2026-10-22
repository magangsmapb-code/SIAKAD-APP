import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'SMA Pemberdayaan Bangsa Ngrayun' })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional({ example: '20512345' })
  @IsOptional()
  @IsString()
  npsn?: string;

  @ApiPropertyOptional({ example: 'Jl. Raya Ngrayun No. 45, Ponorogo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '(0352) 123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@smapbngrayun.sch.id' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 90.0 })
  @IsOptional()
  @IsNumber()
  minAttendancePercentage?: number;

  @ApiPropertyOptional({ example: 'Asia/Jakarta' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowSelfPermission?: boolean;
}
