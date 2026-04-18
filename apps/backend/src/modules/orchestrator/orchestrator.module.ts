import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller.js';
import { OrchestratorService } from './orchestrator.service.js';
import { RedisLockService } from '../../services/redis-lock.service.js';

@Module({
  controllers: [OrchestratorController],
  providers: [RedisLockService, OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
