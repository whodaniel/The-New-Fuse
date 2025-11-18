import { Module } from '@nestjs/common';
import { AgentRegistryController } from './agent-registry.controller';
import {
  AgentRegistrationService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentDirectoryService,
} from './services';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AgentRegistryController],
  providers: [
    AgentRegistrationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
  ],
  exports: [
    AgentRegistrationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
  ],
})
export class AgentRegistryModule {}
