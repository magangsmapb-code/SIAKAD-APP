import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role, FeatureMaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceModuleStatusGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role === Role.SUPER_ADMIN || user?.role === Role.DEVELOPER) {
      return true;
    }

    const feature = await this.prisma.featureRegistry.findUnique({
      where: { key: 'feat_attendance_session' },
      select: {
        isEnabled: true,
        maintenanceStatus: true,
        maintenanceMessage: true,
      },
    });

    if (
      !feature ||
      !feature.isEnabled ||
      feature.maintenanceStatus === FeatureMaintenanceStatus.MAINTENANCE
    ) {
      throw new ForbiddenException(
        feature?.maintenanceMessage ||
          (!feature || !feature.isEnabled
            ? 'Modul absensi sedang dinonaktifkan oleh Developer.'
            : 'Modul absensi sedang dalam pemeliharaan. Silakan coba kembali nanti.'),
      );
    }
    return true;
  }
}
