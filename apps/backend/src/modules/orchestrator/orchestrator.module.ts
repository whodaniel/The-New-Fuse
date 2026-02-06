import { Module } from '@nestjs/common';
import { RedisLockService } from '../../services/redis-lock.service';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';

@Module({
  imports: [AgentRegistryModule],
  controllers: [OrchestratorController],
  providers: [RedisLockService, OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
