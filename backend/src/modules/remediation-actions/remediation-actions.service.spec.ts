import { Test, TestingModule } from '@nestjs/testing';
import { RemediationActionsService } from './remediation-actions.service';

describe('RemediationActionsService', () => {
  let service: RemediationActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemediationActionsService],
    }).compile();

    service = module.get<RemediationActionsService>(RemediationActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
