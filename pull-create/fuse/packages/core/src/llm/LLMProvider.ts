import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export abstract class LLMProvider {
  protected readonly logger = new Logger(this.constructor.name);

  abstract generate(prompt: string): Promise<string>;
}
