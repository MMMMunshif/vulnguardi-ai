import { Test, TestingModule } from '@nestjs/testing';
import { SoftwareUpdateFindingsController } from './software-update-findings.controller';

describe('SoftwareUpdateFindingsController', () => {
  let controller: SoftwareUpdateFindingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoftwareUpdateFindingsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<SoftwareUpdateFindingsController>(
      SoftwareUpdateFindingsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
