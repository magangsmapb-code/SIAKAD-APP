import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateCorrectionRequestDto {
  @ApiProperty({ description: 'ID catatan absensi yang ingin dikoreksi' })
  @IsNotEmpty()
  @IsString()
  recordId: string;

  @ApiProperty({
    enum: AttendanceStatus,
    description: 'Status kehadiran baru yang diajukan',
  })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  newStatus: AttendanceStatus;

  @ApiProperty({
    example: 'Koreksi karena sebelumnya surat izin sakit baru diserahkan ke wali kelas',
    description: 'Alasan pengajuan koreksi status kehadiran',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
