import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DrizzleModule } from '@the-new-fuse/database';
import { AuthModule } from '../../auth/auth.module';
import { AgentRegistryController } from './agent-registry.controller';
import {
  AgentDirectoryService,
  AgentInvitationService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentRegistrationService,
  RateLimitService,
} from './services';

@Module({
  imports: [ConfigModule, DrizzleModule.forRootAsync(), EventEmitterModule.forRoot(), AuthModule],
  controllers: [AgentRegistryController],
  providers: [
    AgentRegistrationService,
    AgentInvitationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
    RateLimitService,
  ],
  exports: [
    AgentRegistrationService,
    AgentInvitationService,
    AgentOnboardingService,
    AgentOrientationService,
    AgentDirectoryService,
    RateLimitService,
  ],
})
export class AgentRegistryModule {}
