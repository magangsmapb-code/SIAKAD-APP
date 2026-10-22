import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ReviewPermissionDto } from './dto/review-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Pengajuan Izin')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar pengajuan izin dengan pagination dan filter status' })
  async findAll(@Query() query: QueryPermissionDto, @CurrentUser() user: any) {
    const result = await this.permissionsService.findAll(query, user);
    return {
      message: 'Daftar pengajuan izin berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Ajukan permohonan izin atau sakit baru' })
  @ApiResponse({ status: 201, description: 'Pengajuan izin berhasil dibuat' })
  async create(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.permissionsService.create(dto, user, ip, userAgent);
    return {
      message: 'Pengajuan izin berhasil dikirimkan',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengajuan izin berdasarkan ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.permissionsService.findOne(id, user, ip, userAgent);
    return {
      message: 'Detail izin berhasil dimuat',
      data: result,
    };
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Setujui permohonan izin (Guru Wali / Admin)' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewPermissionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.permissionsService.approve(id, dto, user, ip, userAgent);
    return {
      message: 'Pengajuan izin berhasil disetujui',
      data: result,
    };
  }

  @Post(':id/reject')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Tolak permohonan izin (Guru Wali / Admin)' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewPermissionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.permissionsService.reject(id, dto, user, ip, userAgent);
    return {
      message: 'Pengajuan izin berhasil ditolak',
      data: result,
    };
  }
}
