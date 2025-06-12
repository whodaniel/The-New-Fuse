import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service.tsx';
import { QueueService } from './queue.service.tsx';
import { PubSubService } from './pubsub.service.tsx';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    QueueService,
    PubSubService,
  ],
  exports: [
    RedisService,
    QueueService,
    PubSubService,
  ],
})
export class RedisModule {}