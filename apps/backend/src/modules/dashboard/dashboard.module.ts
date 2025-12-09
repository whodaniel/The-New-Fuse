import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AgentRegistryModule, PrismaModule],
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
