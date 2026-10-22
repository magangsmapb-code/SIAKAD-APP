import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: '198506142010011009', description: 'Username unik' })
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: 'user@smapbngrayun.sch.id' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiProperty({ example: 'password123', description: 'Kata sandi minimal 6 karakter' })
  @IsNotEmpty({ message: 'Kata sandi wajib diisi' })
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.TEACHER })
  @IsNotEmpty({ message: 'Role wajib ditentukan' })
  @IsEnum(Role)
  role: Role;
}
