var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
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
], AppModule);
export { AppModule };
