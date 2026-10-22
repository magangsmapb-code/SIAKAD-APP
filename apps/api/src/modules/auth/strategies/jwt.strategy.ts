import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        teacher: true,
        student: {
          include: {
            currentClass: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sesi tidak valid atau akun dinonaktifkan');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.teacher?.fullName || user.student?.fullName || user.username,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      classId: user.student?.classId,
      teacherNip: user.teacher?.nip,
      studentNis: user.student?.nis,
    };
  }
}
