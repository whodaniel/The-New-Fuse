import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingAdminController } from '../OnboardingAdminController';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('OnboardingAdminController', () => {
  let controller: OnboardingAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingAdminController],
      providers: [
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<OnboardingAdminController>(OnboardingAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
