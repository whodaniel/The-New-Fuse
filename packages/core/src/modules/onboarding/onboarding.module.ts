import { Module } from '@nestjs/common';
import { OnboardingConfigService } from '../../services/onboarding-config.service.js';
import { OnboardingAdminController } from '../../controllers/OnboardingAdminController.js';
import { PrismaService } from '../../services/prisma.service.js';

@Module({
  providers: [OnboardingConfigService, PrismaService],
  controllers: [OnboardingAdminController],
  exports: [OnboardingConfigService],
})
export class OnboardingModule {}
