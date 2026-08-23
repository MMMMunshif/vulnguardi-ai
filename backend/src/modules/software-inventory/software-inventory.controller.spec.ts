import { Test, TestingModule } from '@nestjs/testing';
import { SoftwareInventoryController } from './software-inventory.controller';

describe('SoftwareInventoryController', () => {
  let controller: SoftwareInventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoftwareInventoryController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<SoftwareInventoryController>(SoftwareInventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
