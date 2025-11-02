import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(prompt: string): Promise<string> {
    this.logger.log(`Generating text for prompt: ${prompt}`);
    const completion = await this.openai.completions.create({
      model: 'text-davinci-003',
      prompt,
    });
    return completion.choices[0].text;
  }
}
