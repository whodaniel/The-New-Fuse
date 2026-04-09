import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MultiAgentChatLlmService {
  private readonly logger = new Logger(MultiAgentChatLlmService.name);

  constructor(private configService: ConfigService) {}
}
