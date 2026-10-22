import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: '2411', description: 'Nomor Induk Siswa (NIS)' })
  @IsNotEmpty({ message: 'NIS wajib diisi' })
  @IsString()
  nis: string;

  @ApiProperty({ example: '0071234571', description: 'Nomor Induk Siswa Nasional (NISN)' })
  @IsNotEmpty({ message: 'NISN wajib diisi' })
  @IsString()
  nisn: string;

  @ApiProperty({ example: 'Muhammad Farhan', description: 'Nama lengkap siswa' })
  @IsNotEmpty({ message: 'Nama lengkap siswa wajib diisi' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: Gender, example: Gender.L, description: 'Jenis kelamin (L / P)' })
  @IsEnum(Gender, { message: 'Jenis kelamin harus L atau P' })
  gender: Gender;

  @ApiProperty({ description: 'ID Kelas siswa' })
  @IsNotEmpty({ message: 'Kelas wajib dipilih' })
  @IsString()
  classId: string;

  @ApiPropertyOptional({ example: '081234567899' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Suryanto' })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiPropertyOptional({ example: '081234567800' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'Desa Baosan Kidul, Ngrayun' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.AKTIF })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
