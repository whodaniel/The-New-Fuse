import { Module } from '@nestjs/common';
import { ComposerService } from '../../services/composer.service';
import { RedisModule } from '../redis/redis.module';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [RedisModule, AgentModule],
  providers: [ComposerService],
  exports: [ComposerService]
})
export class ComposerModule {} 