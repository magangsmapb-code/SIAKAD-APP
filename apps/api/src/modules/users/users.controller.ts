import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Manajemen Pengguna')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @Permission('users.view')
  @ApiOperation({ summary: 'Daftar semua pengguna dengan filter dan pencarian' })
  async findAll(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.usersService.findAll({ role, search, page, limit });
    return {
      message: 'Data pengguna berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @Permission('users.view')
  @ApiOperation({ summary: 'Detail pengguna' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return {
      message: 'Detail pengguna berhasil dimuat',
      data,
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('users.create')
  @ApiOperation({ summary: 'Tambah akun pengguna baru (Admin)' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil dibuat' })
  async create(
    @Body() createDto: CreateUserDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.usersService.create(createDto, user, ip, userAgent);
    return {
      message: 'Akun pengguna berhasil dibuat',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('users.update')
  @ApiOperation({ summary: 'Perbarui peran atau status akun pengguna (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.usersService.update(id, updateDto, user, ip, userAgent);
    return {
      message: 'Akun pengguna berhasil diperbarui',
      data: result,
    };
  }
}
