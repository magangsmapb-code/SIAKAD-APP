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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Data Guru')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar data guru dengan pagination, filter, dan search' })
  async findAll(@Query() query: QueryTeacherDto) {
    const result = await this.teachersService.findAll(query);
    return {
      message: 'Data guru berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail profil guru berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    const teacher = await this.teachersService.findOne(id);
    return {
      message: 'Detail guru berhasil dimuat',
      data: teacher,
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Tambah data guru baru (Hanya Admin)' })
  @ApiResponse({ status: 201, description: 'Guru berhasil ditambahkan' })
  async create(
    @Body() createDto: CreateTeacherDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.teachersService.create(createDto, user, ip, userAgent);
    return {
      message: 'Data guru berhasil ditambahkan',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Perbarui data guru (Hanya Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeacherDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.teachersService.update(id, updateDto, user, ip, userAgent);
    return {
      message: 'Data guru berhasil diperbarui',
      data: result,
    };
  }
}
