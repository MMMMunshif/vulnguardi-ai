import { getJwtSecret } from '../auth.config';
import { JwtStrategy } from './jwt.strategy';

describe('JWT security configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  it('uses the configured JWT secret', () => {
    process.env.JWT_SECRET = 'configured-test-secret';

    expect(getJwtSecret()).toBe('configured-test-secret');
    expect(() => new JwtStrategy()).not.toThrow();
  });

  it('uses a development-only fallback outside production', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';

    expect(getJwtSecret()).toBe('vulnguard_development_only_secret');
  });

  it('refuses to start production without a configured secret', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET must be configured in production',
    );
    expect(() => new JwtStrategy()).toThrow(
      'JWT_SECRET must be configured in production',
    );
  });

  it('returns the validated tenant-aware JWT payload unchanged', async () => {
    process.env.JWT_SECRET = 'configured-test-secret';
    const strategy = new JwtStrategy();
    const payload = {
      sub: 'user-1',
      email: 'analyst@vulnguard.test',
      role: 'Security Analyst',
      organizationId: 'org-1',
    };

    await expect(strategy.validate(payload)).resolves.toEqual(payload);
  });
});
