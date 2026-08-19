import { Test, TestingModule } from '@nestjs/testing';
import { RemediationActionsController } from './remediation-actions.controller';

describe('RemediationActionsController', () => {
  let controller: RemediationActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemediationActionsController],
    }).compile();

    controller = module.get<RemediationActionsController>(RemediationActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
