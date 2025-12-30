import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AgentRegistryModule, DrizzleModule.forRootAsync()],
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
