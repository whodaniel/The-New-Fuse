import { Module } from '@nestjs/common';
import { AgentBridgeService } from '../../services/agent-bridge.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [AgentBridgeService],
  exports: [AgentBridgeService]
})
export class AgentBridgeModule {} 