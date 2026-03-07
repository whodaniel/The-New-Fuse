import { Module } from '@nestjs/common';
import { AgentCommunicationGateway } from './agent-communication.gateway';
import { RedisModule } from '../modules/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [AgentCommunicationGateway],
})
export class AgentCommunicationModule {}