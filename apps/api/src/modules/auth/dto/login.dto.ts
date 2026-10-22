import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '198403152009032008',
    description: 'Username, NIP guru, NIS siswa, atau email',
  })
  @IsNotEmpty({ message: 'Username atau identitas login wajib diisi' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123', description: 'Kata sandi pengguna' })
  @IsNotEmpty({ message: 'Kata sandi wajib diisi' })
  @IsString()
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter' })
  password: string;
}
