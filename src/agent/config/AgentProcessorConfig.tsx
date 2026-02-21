import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AgentProcessorConfig {
  constructor(private configService: ConfigService) {}

  get defaultTimeout(): number {
    return this.configService.get<number>("AGENT_PROCESSOR_TIMEOUT", 30000);
  }

  get maxRetryAttempts(): number {
    return this.configService.get<number>("AGENT_PROCESSOR_MAX_RETRIES", 3);
  }

  get queueTtl(): number {
    return this.configService.get<number>("AGENT_QUEUE_TTL", 3600);
  }

  get processedMessageTtl(): number {
    return this.configService.get<number>("AGENT_PROCESSED_MESSAGE_TTL", 86400);
  }
}
