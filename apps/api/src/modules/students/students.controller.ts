import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Data Siswa')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Permission('students.view')
  @ApiOperation({ summary: 'Daftar data siswa dengan pagination, search, dan filter' })
  async findAll(@Query() query: QueryStudentDto, @CurrentUser() user: any) {
    const result = await this.studentsService.findAll(query, user);
    return {
      message: 'Data siswa berhasil dimuat',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permission('students.view')
  @ApiOperation({ summary: 'Detail profil dan riwayat siswa berdasarkan ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const student = await this.studentsService.findOne(id, user);
    return {
      message: 'Detail siswa berhasil dimuat',
      data: student,
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @Permission('students.manage')
  @ApiOperation({ summary: 'Tambah data siswa baru (Hanya Admin)' })
  @ApiResponse({ status: 201, description: 'Siswa berhasil ditambahkan' })
  async create(
    @Body() createDto: CreateStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.studentsService.create(createDto, user, ip, userAgent);
    return {
      message: 'Data siswa berhasil ditambahkan',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @Permission('students.manage')
  @ApiOperation({ summary: 'Perbarui data siswa (Hanya Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.studentsService.update(id, updateDto, user, ip, userAgent);
    return {
      message: 'Data siswa berhasil diperbarui',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN)
  @Permission('students.manage')
  @ApiOperation({ summary: 'Hapus atau nonaktifkan data siswa (Hanya Admin)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.studentsService.delete(id, user, ip, userAgent);
    return result;
  }
}
