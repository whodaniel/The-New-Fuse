import { Module } from '@nestjs/common';
import { AgentCommunicationGateway } from './agent-communication.gateway.js';
import { RedisModule } from '../modules/redis/redis.module.js';

@Module({
  imports: [RedisModule],
  providers: [AgentCommunicationGateway],
})
export class AgentCommunicationModule {}