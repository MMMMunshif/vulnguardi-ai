import { RemediationStatus } from '@prisma/client';
import { RemediationActionsController } from './remediation-actions.controller';
import { RemediationActionsService } from './remediation-actions.service';

describe('RemediationActionsController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new RemediationActionsController(
    service as unknown as RemediationActionsService,
  );
  const tenantRequest = {
    user: { role: 'IT Technician', organizationId: 'org-1' },
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('forwards tenant scope for list and detail requests', () => {
    controller.findAll(tenantRequest);
    controller.findOne('action-1', tenantRequest);

    expect(service.findAll).toHaveBeenCalledWith('org-1');
    expect(service.findOne).toHaveBeenCalledWith('action-1', 'org-1');
  });

  it('forwards create and update payloads within tenant scope', () => {
    const createDto = {
      actionTitle: 'Patch application',
      vulnerabilityFindingId: 'finding-1',
    };
    const updateDto = { status: RemediationStatus.IN_PROGRESS };

    controller.create(createDto, tenantRequest);
    controller.update('action-1', updateDto, tenantRequest);

    expect(service.create).toHaveBeenCalledWith(createDto, 'org-1');
    expect(service.update).toHaveBeenCalledWith(
      'action-1',
      updateDto,
      'org-1',
    );
  });

  it('uses global scope for Super Admin deletion', () => {
    controller.remove('action-1', {
      user: { role: 'Super Admin', organizationId: 'org-1' },
    } as never);

    expect(service.remove).toHaveBeenCalledWith('action-1', undefined);
  });
});
