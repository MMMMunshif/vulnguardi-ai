import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const createContext = (user?: { role?: string }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('denies protected routes when authentication data is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['Security Analyst']);

    expect(guard.canActivate(createContext())).toBe(false);
    expect(guard.canActivate(createContext({}))).toBe(false);
  });

  it('allows a user with one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'Super Admin',
      'Security Analyst',
    ]);

    expect(
      guard.canActivate(createContext({ role: 'Security Analyst' })),
    ).toBe(true);
  });

  it('denies a user whose role is not permitted', () => {
    reflector.getAllAndOverride.mockReturnValue(['Super Admin']);

    expect(
      guard.canActivate(createContext({ role: 'IT Technician' })),
    ).toBe(false);
  });
});
