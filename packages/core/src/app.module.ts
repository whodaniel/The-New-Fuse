import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/ConfigModule';
import { AgentLLMService } from './services/AgentLLMService';
import { PromptService } from './services/PromptService';
import { MemoryManager } from './memory/MemoryManager';
import { LoggingService } from './services/LoggingService';
import { MessageHandler } from './message_handler';
import { RedisService } from './redis/redis.service';
import { SharedMemory } from './agents/shared-memory';
@Module({
  // Implementation needed
}
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    RedisService,
    SharedMemory
  ],
  exports: [
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    RedisService,
    SharedMemory
  ]
})
export class AppModule {}