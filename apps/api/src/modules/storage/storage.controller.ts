import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { StorageService } from './storage.service';

@ApiTags('Penyimpanan Berkas (Supabase Storage)')
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @Permission('permissions.create')
  @ApiOperation({ summary: 'Unggah berkas surat izin/sakit privat ke Supabase Storage' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Berkas berhasil diunggah' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Berkas lampiran wajib diunggah.');
    }

    const result = await this.storageService.uploadFile(file);
    return {
      message: 'Berkas lampiran berhasil diunggah ke Supabase Storage',
      data: result,
    };
  }
}
