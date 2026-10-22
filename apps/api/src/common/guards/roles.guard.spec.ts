import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('harus mengizinkan akses jika endpoint tidak memiliki dekorator roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.STUDENT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('harus selalu mengizinkan pengguna dengan role SUPER_ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.SUPER_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('harus mengizinkan pengguna jika role sesuai dengan kebutuhan endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TEACHER, Role.ADMIN]);
    const context = createMockContext({ role: Role.TEACHER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('harus melempar ForbiddenException jika role pengguna tidak memiliki wewenang', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.PRINCIPAL]);
    const context = createMockContext({ role: Role.STUDENT });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('harus melempar ForbiddenException jika pengguna tidak terautentikasi', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('harus menolak role DEVELOPER untuk endpoint khusus role lain seperti TEACHER (Least Privilege)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TEACHER]);
    const context = createMockContext({ role: Role.DEVELOPER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('harus mengizinkan role DEVELOPER jika endpoint terdaftar mengizinkan DEVELOPER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.DEVELOPER, Role.SUPER_ADMIN]);
    const context = createMockContext({ role: Role.DEVELOPER });

    expect(guard.canActivate(context)).toBe(true);
  });
});
