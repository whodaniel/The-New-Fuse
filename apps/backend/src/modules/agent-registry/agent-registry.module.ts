import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DrizzleModule } from '@the-new-fuse/database';
import { AgentRegistryController } from './agent-registry.controller';
import {
  AgentDirectoryService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentRegistrationService,
  AgentRegistryImportService,
} from './services';

@Module({
  imports: [DrizzleModule.forRootAsync(), EventEmitterModule],
  controllers: [AgentRegistryController],
  providers: [
    AgentRegistrationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
    AgentRegistryImportService,
  ],
  exports: [
    AgentRegistrationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
    AgentRegistryImportService,
  ],
})
export class AgentRegistryModule {}
