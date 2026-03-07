import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor() {}

  async query(query: string): Promise<string> {
    this.logger.log(`Querying with: ${query}`);
    return `Response to: ${query}`;
  }
}
