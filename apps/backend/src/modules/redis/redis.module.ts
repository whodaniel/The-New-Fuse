import { Module } from '@nestjs/common';
import { RedisService } from '../../services/redis.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {} 