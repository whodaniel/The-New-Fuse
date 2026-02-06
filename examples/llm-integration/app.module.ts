import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentService } from './services/agent.service.js';
import { OpenAIService } from './services/openai.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          ai: {
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4',
          },
        }),
      ],
    }),
    TypeOrmModule.forFeature([Agent]),
  ],
  providers: [OpenAIService, AgentService],
  exports: [OpenAIService, AgentService],
})
export class AppModule {}
