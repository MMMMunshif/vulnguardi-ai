import { Test, TestingModule } from '@nestjs/testing';
import { SoftwareInventoryService } from './software-inventory.service';

describe('SoftwareInventoryService', () => {
  let service: SoftwareInventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SoftwareInventoryService],
    }).compile();

    service = module.get<SoftwareInventoryService>(SoftwareInventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
