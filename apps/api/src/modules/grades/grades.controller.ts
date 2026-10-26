import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { BatchGradeDto } from './dto/batch-grade.dto';
import { QueryGradeDto } from './dto/query-grade.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Semester } from '@prisma/client';

@ApiTags('Penilaian Akademik (Kurikulum Merdeka)')
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @Permission('grades.input')
  @ApiOperation({ summary: 'Input atau perbarui nilai asesmen Kurikulum Merdeka (Formatif, Sumatif, PTS, PAS)' })
  @ApiResponse({ status: 201, description: 'Nilai berhasil disimpan dan dihitung otomatis' })
  async createOrUpdate(
    @Body() dto: CreateGradeDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.gradesService.createOrUpdateGrade(dto, user, ip, userAgent);
    return {
      message: 'Nilai Kurikulum Merdeka berhasil disimpan',
      data: result,
    };
  }

  @Post('batch')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @Permission('grades.input')
  @ApiOperation({ summary: 'Input nilai massal (batch) satu kelas rombongan belajar' })
  @ApiResponse({ status: 201, description: 'Daftar nilai sekelas berhasil disimpan' })
  async batchUpsert(
    @Body() dto: BatchGradeDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.gradesService.batchUpsertGrades(dto, user, ip, userAgent);
    return result;
  }

  @Get()
  @Permission('grades.view')
  @ApiOperation({ summary: 'Daftar nilai dengan filter siswa, kelas, mapel, semester, dan predikat' })
  async findAll(@Query() query: QueryGradeDto, @CurrentUser() user: any) {
    const result = await this.gradesService.findAll(query, user);
    return {
      message: 'Data nilai berhasil dimuat',
      ...result,
    };
  }

  @Get('student/:studentId')
  @Permission('grades.view')
  @ApiOperation({ summary: 'Transkrip / Rapor akademik individual siswa lengkap dengan rerata & status kelulusan' })
  async findByStudent(
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('semester') semester: Semester,
    @CurrentUser() user: any,
  ) {
    const result = await this.gradesService.findByStudent(studentId, { academicYearId, semester }, user);
    return {
      message: 'Rapor akademik siswa berhasil dimuat',
      data: result,
    };
  }

  @Get('class-summary')
  @Permission('grades.view')
  @ApiOperation({ summary: 'Statistik & distribusi predikat A/B/C/D penilaian kelas' })
  async getClassSummary(
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('semester') semester?: Semester,
  ) {
    const result = await this.gradesService.getClassSummary(classId, subjectId, academicYearId, semester);
    return {
      message: 'Ringkasan distribusi nilai kelas berhasil dimuat',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Permission('grades.manage')
  @ApiOperation({ summary: 'Hapus entri nilai siswa (khusus Admin & Super Admin)' })
  async deleteGrade(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.gradesService.deleteGrade(id, user, ip, userAgent);
    return result;
  }
}
