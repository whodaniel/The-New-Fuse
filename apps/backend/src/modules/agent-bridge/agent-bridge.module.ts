import { Module } from '@nestjs/common';
import { AgentBridgeService } from '../../services/agent-bridge.service.js';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [RedisModule],
  providers: [AgentBridgeService],
  exports: [AgentBridgeService]
})
export class AgentBridgeModule {} 