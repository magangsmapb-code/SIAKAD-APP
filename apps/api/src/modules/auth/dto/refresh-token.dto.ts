import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token (opsional bila dikirimkan via HTTP-only cookie)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
