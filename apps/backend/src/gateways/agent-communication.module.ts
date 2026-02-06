import { Module } from '@nestjs/common';
import { RedisModule } from '../modules/redis/redis.module';
import { AgentCommunicationGateway } from './agent-communication.gateway';

@Module({
  imports: [RedisModule],
  providers: [AgentCommunicationGateway],
})
export class AgentCommunicationModule {}
