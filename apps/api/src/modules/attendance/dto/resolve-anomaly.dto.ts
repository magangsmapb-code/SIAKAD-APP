import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AnomalyStatus } from '@prisma/client';

export class ResolveAnomalyDto {
  @ApiProperty({
    enum: AnomalyStatus,
    example: AnomalyStatus.RESOLVED_CONFIRMED_FRAUD,
    description: 'Status resolusi anomali',
  })
  @IsEnum(AnomalyStatus)
  @IsNotEmpty()
  status: AnomalyStatus;

  @ApiProperty({
    example: 'Telah dikonfirmasi siswa menggunakan fake GPS di luar sekolah',
    description: 'Catatan tinjauan hasil audit investigasi',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reviewNotes: string;
}
