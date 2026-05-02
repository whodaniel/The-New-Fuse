import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmConfigService {
  constructor(private readonly configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('LLM_API_KEY') || '';
  }

  get model(): string {
    return this.configService.get<string>('LLM_MODEL') || 'gpt-4';
  }

  get apiEndpoint(): string {
    return this.configService.get<string>('LLM_API_ENDPOINT') || 'https://api.openai.com/v1';
  }
}
