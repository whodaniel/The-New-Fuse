import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { RedisLockService } from '../../services/redis-lock.service';

@Module({
  controllers: [OrchestratorController],
  providers: [RedisLockService, OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
