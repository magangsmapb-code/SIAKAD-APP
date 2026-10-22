import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: { role?: Role; search?: string; page?: number; limit?: number }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { teacher: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { student: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true,
              nip: true,
              fullName: true,
              roleTitle: true,
            },
          },
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              currentClass: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      fullName: u.teacher?.fullName || u.student?.fullName || u.username,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      teacher: u.teacher,
      student: u.student,
    }));

    return {
      data: formattedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        teacher: true,
        student: {
          include: {
            currentClass: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID '${id}' tidak ditemukan`);
    }

    return user;
  }

  async create(dto: CreateUserDto, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(`Username '${dto.username}' sudah terdaftar`);
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException(`Email '${dto.email}' sudah terdaftar`);
      }
    }

    if (
      (dto.role === Role.SUPER_ADMIN || dto.role === Role.DEVELOPER) &&
      currentUser.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Akses ditolak: Hanya SUPER_ADMIN yang berwenang menetapkan peran SUPER_ADMIN atau DEVELOPER',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: created.id,
      newValue: { username: created.username, role: created.role },
      ipAddress: ip,
      userAgent,
    });

    return created;
  }

  async update(id: string, dto: UpdateUserDto, currentUser: any, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Pengguna dengan ID '${id}' tidak ditemukan`);
    }

    if (
      (existing.role === Role.SUPER_ADMIN || existing.role === Role.DEVELOPER) &&
      currentUser.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Akses ditolak: Hanya SUPER_ADMIN yang berwenang mengubah akun SUPER_ADMIN atau DEVELOPER',
      );
    }

    if (
      (dto.role === Role.SUPER_ADMIN || dto.role === Role.DEVELOPER) &&
      currentUser.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Akses ditolak: Hanya SUPER_ADMIN yang berwenang menetapkan peran SUPER_ADMIN atau DEVELOPER',
      );
    }

    const data: any = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === false) {
        // Revoke active sessions immediately upon account deactivation
        data.refreshToken = null;
      }
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      // Invalidate active session tokens on password change
      data.refreshToken = null;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditService.record({
      userId: currentUser.id,
      actorName: currentUser.fullName || currentUser.username,
      actorRole: currentUser.role,
      action: 'USER_UPDATED',
      entity: 'USER',
      entityId: id,
      oldValue: { role: existing.role, isActive: existing.isActive },
      newValue: { role: updated.role, isActive: updated.isActive },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }
}
