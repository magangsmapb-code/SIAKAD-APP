import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'dev_pixel7_9921', description: 'Unique device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ example: 'Samsung Galaxy A54', description: 'Model/Tipe perangkat' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'Android 14', description: 'Versi sistem operasi' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: '2.1.0', description: 'Versi aplikasi SIAKAD' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}
