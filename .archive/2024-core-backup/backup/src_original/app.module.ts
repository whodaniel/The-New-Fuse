import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentLLMService } from './services/AgentLLMService';
import { PromptService } from './services/PromptService';
import { MemoryManager } from './memory/MemoryManager';
import { LoggingService } from './services/LoggingService';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService
  ],
  exports: [
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService
  ]
})
export class AppModule {}