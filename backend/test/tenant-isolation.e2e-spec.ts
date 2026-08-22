import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { RemediationActionsController } from '../src/modules/remediation-actions/remediation-actions.controller';
import { RemediationActionsService } from '../src/modules/remediation-actions/remediation-actions.service';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      sub: 'test-user',
      email: 'test@example.com',
      role: request.headers['x-test-role'] || 'Organization Admin',
      organizationId: request.headers['x-test-organization'] || 'org-a',
    };
    return true;
  }
}

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication<App>;
  const remediationService = {
    findAll: jest.fn().mockResolvedValue({ actions: [] }),
    findOne: jest.fn().mockResolvedValue({ action: {} }),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [RemediationActionsController],
      providers: [
        {
          provide: RemediationActionsService,
          useValue: remediationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes an organization administrator list request', async () => {
    await request(app.getHttpServer())
      .get('/remediation-actions')
      .set('x-test-role', 'Organization Admin')
      .set('x-test-organization', 'org-a')
      .expect(200);

    expect(remediationService.findAll).toHaveBeenCalledWith('org-a');
  });

  it('preserves global access for a super administrator', async () => {
    await request(app.getHttpServer())
      .get('/remediation-actions')
      .set('x-test-role', 'Super Admin')
      .set('x-test-organization', 'org-a')
      .expect(200);

    expect(remediationService.findAll).toHaveBeenCalledWith(undefined);
  });

  it('passes tenant scope into direct record lookups', async () => {
    await request(app.getHttpServer())
      .get('/remediation-actions/action-from-another-tenant')
      .set('x-test-role', 'Organization Admin')
      .set('x-test-organization', 'org-a')
      .expect(200);

    expect(remediationService.findOne).toHaveBeenCalledWith(
      'action-from-another-tenant',
      'org-a',
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
