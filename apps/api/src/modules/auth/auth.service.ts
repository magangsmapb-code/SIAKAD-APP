import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  private async generateTokens(user: { id: string; username: string; role: string }) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { username, password } = loginDto;

    // Support login via username, email, NIP, or NIS
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          { teacher: { nip: username } },
          { student: { nis: username } },
        ],
      },
      include: {
        teacher: true,
        student: {
          include: {
            currentClass: true,
          },
        },
      },
    });

    if (!user) {
      await this.auditService.record({
        actorName: username,
        actorRole: 'ANONYMOUS',
        action: 'AUTH_LOGIN_FAILED',
        entity: 'USER',
        entityId: 'UNKNOWN',
        newValue: { reason: 'User not found', identifier: username },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Kredensial login tidak valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.record({
        userId: user.id,
        actorName: user.username,
        actorRole: user.role,
        action: 'AUTH_LOGIN_FAILED',
        entity: 'USER',
        entityId: user.id,
        newValue: { reason: 'Invalid password' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Kredensial login tidak valid');
    }

    const tokens = await this.generateTokens(user);

    // Securely hash the refresh token before storing in database
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    // Record success audit
    await this.auditService.record({
      userId: user.id,
      actorName: user.teacher?.fullName || user.student?.fullName || user.username,
      actorRole: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      entity: 'USER',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.teacher?.fullName || user.student?.fullName || user.username,
        profile: user.teacher || user.student || null,
      },
      tokens,
    };
  }

  async refreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    if (!rawRefreshToken) {
      throw new BadRequestException('Refresh token tidak disediakan');
    }

    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: refreshSecret,
      });
    } catch (e) {
      throw new UnauthorizedException('Refresh token tidak valid atau kedaluwarsa');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        teacher: true,
        student: {
          include: { currentClass: true },
        },
      },
    });

    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Akses ditolak: token telah dicabut');
    }

    // Verify stored hashed refresh token against incoming token
    const isTokenMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!isTokenMatch) {
      // Possible token reuse attack: invalidate all sessions immediately
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });

      await this.auditService.record({
        userId: user.id,
        actorName: user.username,
        actorRole: user.role,
        action: 'SECURITY_TOKEN_REUSE_DETECTED',
        entity: 'USER',
        entityId: user.id,
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException('Pelanggaran keamanan token terdeteksi. Silakan login kembali.');
    }

    // Token rotation: Issue new token pair
    const tokens = await this.generateTokens(user);
    const newHashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashedRefresh },
    });

    return {
      tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.teacher?.fullName || user.student?.fullName || user.username,
      },
    };
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      await this.auditService.record({
        userId,
        actorName: user.username,
        actorRole: user.role,
        action: 'AUTH_LOGOUT',
        entity: 'USER',
        entityId: userId,
        ipAddress,
        userAgent,
      });
    }
    return { success: true, message: 'Berhasil keluar dari sistem' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        teacher: {
          include: {
            homeroomClasses: true,
            teachingAssignments: {
              include: {
                schoolClass: true,
                subject: true,
              },
            },
          },
        },
        student: {
          include: {
            currentClass: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return {
      ...user,
      fullName: user.teacher?.fullName || user.student?.fullName || user.username,
    };
  }
}
