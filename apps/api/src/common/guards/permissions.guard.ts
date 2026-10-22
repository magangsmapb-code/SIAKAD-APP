import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSION_MATRIX } from '../../modules/features/features.service';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role || !user?.id) {
      throw new ForbiddenException('Akses ditolak: identitas pengguna tidak valid');
    }

    // SUPER_ADMIN has full permissions; DEVELOPER is governed by technical role permissions
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const override = await this.prisma.rolePermission.findUnique({
      where: {
        role_permissionKey: {
          role: user.role,
          permissionKey: permission,
        },
      },
      select: { enabled: true },
    });
    const defaultPermissions =
      ROLE_PERMISSION_MATRIX[user.role as keyof typeof ROLE_PERMISSION_MATRIX] ?? [];
    const allowed = override?.enabled ?? defaultPermissions.includes(permission);

    if (!allowed) {
      throw new ForbiddenException(
        `Akses ditolak: izin '${permission}' tidak tersedia untuk role akun Anda`,
      );
    }
    return true;
  }
}
