import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherStatus } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ example: '198501012010011005', description: 'Nomor Induk Pegawai (NIP)' })
  @IsNotEmpty({ message: 'NIP wajib diisi' })
  @IsString()
  nip: string;

  @ApiPropertyOptional({ example: '1234567890123456', description: 'NUPTK jika ada' })
  @IsOptional()
  @IsString()
  nuptk?: string;

  @ApiProperty({ example: 'Drs. Hendro Wibowo, M.Pd.', description: 'Nama lengkap beserta gelar' })
  @IsNotEmpty({ message: 'Nama lengkap guru wajib diisi' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: 'M.Pd.' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'hendro.wibowo@smapemberdayaanbangsa.sch.id' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({ example: '081234567895' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Guru Kimia' })
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiPropertyOptional({ default: false, description: 'Apakah guru merupakan wali kelas' })
  @IsOptional()
  @IsBoolean()
  isHomeroom?: boolean;

  @ApiPropertyOptional({ enum: TeacherStatus, default: TeacherStatus.AKTIF })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;
}
