import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'ID Kelas' })
  @IsNotEmpty({ message: 'Kelas wajib dipilih' })
  @IsString()
  classId: string;

  @ApiProperty({ description: 'ID Mata Pelajaran' })
  @IsNotEmpty({ message: 'Mata pelajaran wajib dipilih' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'ID Guru Pengampu' })
  @IsNotEmpty({ message: 'Guru pengampu wajib dipilih' })
  @IsString()
  teacherId: string;

  @ApiPropertyOptional({ enum: DayOfWeek, example: DayOfWeek.SENIN })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ enum: DayOfWeek, example: DayOfWeek.SENIN, description: 'Alias hari jadwal pelajaran' })
  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek;


  @ApiProperty({ example: '07:30', description: 'Waktu mulai format HH:MM' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu mulai harus HH:MM' })
  startTime: string;

  @ApiProperty({ example: '09:00', description: 'Waktu selesai format HH:MM' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Format waktu selesai harus HH:MM' })
  endTime: string;

  @ApiProperty({ example: 'R. 101' })
  @IsNotEmpty()
  @IsString()
  room: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
