import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatCompletion, ChatCompletionCreateParams } from 'openai/resources/chat';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'): ChatCompletionCreateParams
  ): Promise<ChatCompletion> {
    try {
      const response = await this.openai.(chat as any).completions.create(params)): void {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}