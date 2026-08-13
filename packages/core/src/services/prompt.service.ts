import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor() {}
}
