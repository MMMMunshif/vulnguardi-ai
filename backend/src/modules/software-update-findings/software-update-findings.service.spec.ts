import { Test, TestingModule } from '@nestjs/testing';
import { SoftwareUpdateFindingsService } from './software-update-findings.service';

describe('SoftwareUpdateFindingsService', () => {
  let service: SoftwareUpdateFindingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SoftwareUpdateFindingsService],
    }).compile();

    service = module.get<SoftwareUpdateFindingsService>(SoftwareUpdateFindingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
