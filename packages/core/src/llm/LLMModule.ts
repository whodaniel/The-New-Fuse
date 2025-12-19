import { Module, Global } from '@nestjs/common';
import { LLMRegistry } from './LLMRegistry';
import { LLMService } from './LLMService';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { PromptCachingService } from './prompt-caching.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LLMService,
    LLMRegistry,
    AnthropicProvider,
    PromptCachingService,
  ],
  exports: [LLMService],
})
export class LLMModule {}
