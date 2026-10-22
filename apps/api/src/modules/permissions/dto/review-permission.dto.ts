import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewPermissionDto {
  @ApiPropertyOptional({ example: 'Disetujui, surat dokter telah diverifikasi.' })
  @IsOptional()
  @IsString()
  note?: string;
}
