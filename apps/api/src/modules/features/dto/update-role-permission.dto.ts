import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiProperty({ example: 'attendance.student.check_in' })
  @IsString()
  @MinLength(3)
  permissionKey: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
