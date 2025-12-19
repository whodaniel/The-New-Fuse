import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/ConfigModule';
import { ConfigService } from './config/ConfigService';
import { AgentLLMService } from './services/AgentLLMService';
import { PromptService } from './services/PromptService';
import { MemoryManager } from './memory/MemoryManager';
import { LoggingService } from './services/LoggingService';
import { MessageHandler } from './communication/message_handler';
import { PubSubService } from './redis/pubsub.service';
import { SharedMemory } from './agents/shared-memory';
import { SupabaseService } from './supabase/SupabaseService';
import { VectorDatabaseModule } from '@the-new-fuse/core-vector-db';
import { VectorMemorySystem } from './memory/VectorMemorySystem';

@Module({
  imports: [
    ConfigModule,
    VectorDatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        vectorDbConfig: {
          provider: 'pgvector',
          connectionString: configService.getEnv('DATABASE_URL'),
          host: configService.getEnv('DATABASE_HOST', 'localhost'),
          port: configService.getEnvNumber('DATABASE_PORT', 5432),
          database: configService.getEnv('DATABASE_NAME', 'fuse'),
          user: configService.getEnv('DATABASE_USER'),
          password: configService.getEnv('DATABASE_PASSWORD'),
        },
        embeddingConfig: {
          provider: 'openai',
          apiKey: configService.getEnv('OPENAI_API_KEY'),
          model: configService.getEnv('EMBEDDING_MODEL', 'text-embedding-3-small'),
          dimension: configService.getEnvNumber('EMBEDDING_DIMENSION', 1536),
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    PubSubService,
    SharedMemory,
    SupabaseService,
    VectorMemorySystem,
  ],
  exports: [
    AgentLLMService,
    PromptService,
    MemoryManager,
    LoggingService,
    MessageHandler,
    PubSubService,
    SharedMemory,
    SupabaseService,
    VectorDatabaseModule,
    VectorMemorySystem,
  ],
})
export class AppModule {}
