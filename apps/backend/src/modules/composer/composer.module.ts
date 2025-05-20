import { Module } from '@nestjs/common';
import { ComposerService } from '../../services/composer.service.js';
import { RedisModule } from '../redis/redis.module.js';
import { AgentModule } from '../agent/agent.module.js';

@Module({
  imports: [RedisModule, AgentModule],
  providers: [ComposerService],
  exports: [ComposerService]
})
export class ComposerModule {} 