import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service.js';
import { QueueService } from './queue.service.js';
import { PubSubService } from './pubsub.service.js';

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