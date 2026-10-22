import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  const mockUser = {
    id: 'user-1',
    username: 'admin',
    email: 'admin@smapemberdayaanbangsa.sch.id',
    passwordHash: '',
    role: Role.ADMIN,
    isActive: true,
    refreshToken: null,
    teacher: null,
    student: null,
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('admin123', 10);
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_token'),
      verifyAsync: jest.fn(),
    };

    auditService = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => defaultValue),
            getOrThrow: jest.fn((key: string) =>
              key === 'JWT_ACCESS_SECRET'
                ? 'a8d91c347f6b205ea4d7831c9f6240b7'
                : 'e13b7a90d54c826fa1b6093e7d2458c6',
            ),
          },
        },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('harus berhasil login dengan kredensial yang valid dan mengembalikan token', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login({ username: 'admin', password: 'admin123' });

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock_token');
      expect(result.user.username).toBe('admin');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGIN_SUCCESS' }),
      );
    });

    it('harus melempar UnauthorizedException jika password salah', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.login({ username: 'admin', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGIN_FAILED' }),
      );
    });

    it('harus melempar UnauthorizedException jika pengguna tidak ditemukan', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ username: 'unknown_user', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken security', () => {
    it('harus menolak jika refresh token telah dicabut (user.refreshToken === null)', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, refreshToken: null });

      await expect(service.refreshToken('some_valid_jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('harus mendeteksi token reuse attack dan mencabut sesi jika hash tidak cocok', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      const hashedValidToken = await bcrypt.hash('legitimate_token', 10);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, refreshToken: hashedValidToken });

      // An attacker presents an outdated or stolen token
      await expect(service.refreshToken('stolen_or_reused_token')).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify that the user's session was invalidated immediately
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SECURITY_TOKEN_REUSE_DETECTED' }),
      );
    });
  });

  describe('logout', () => {
    it('harus menghapus refresh token pengguna dan mencatat audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: null });

      const result = await service.logout('user-1');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTH_LOGOUT' }),
      );
    });
  });
});
