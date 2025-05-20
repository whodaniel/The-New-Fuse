import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentProcessor } from './AgentProcessor.js';
import { AgentProcessorConfig } from './config/AgentProcessorConfig.js';
import { TaskProcessor } from './processors/TaskProcessor.js';
import { NotificationProcessor } from './processors/NotificationProcessor.js';
import { CommandProcessor } from './processors/CommandProcessor.js';
import { MessageValidator } from './services/MessageValidator.js';
import { QueueManager } from './services/QueueManager.js';
import { CacheModule } from '../cache/CacheModule.js';
import { ErrorRecoveryModule } from '../error/ErrorRecoveryModule.js';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    CacheModule,
    ErrorRecoveryModule
  ],
  providers: [
    AgentProcessor,
    AgentProcessorConfig,
    TaskProcessor,
    NotificationProcessor,
    CommandProcessor,
    MessageValidator,
    QueueManager
  ],
  exports: [AgentProcessor]
})
export class AgentModule {}
