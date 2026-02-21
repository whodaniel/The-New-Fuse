import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
import { ConsolidatedRedisService } from './consolidated-redis.service.js';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  providers: [
    {
      provide: RedisService,
      useClass: ConsolidatedRedisService
    },
    ConsolidatedRedisService
  ],
  exports: [
    RedisService,
    ConsolidatedRedisService
  ]
})
export class RedisModule {}
