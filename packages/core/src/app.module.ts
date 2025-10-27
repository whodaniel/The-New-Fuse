import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/ConfigModule';
import { AgentLLMService } from './services/AgentLLMService';
import { PromptService } from './services/PromptService';
import { MemoryManager } from './memory/MemoryManager';
import { LoggingService } from './services/LoggingService';
import { MessageHandler } from './communication/message_handler';
import { PubSubService } from './redis/pubsub.service';
import { SharedMemory } from './agents/shared-memory';
@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    PubSubService,
    SharedMemory
  ],
  exports: [
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    PubSubService,
    SharedMemory
  ]
})
export class AppModule {}