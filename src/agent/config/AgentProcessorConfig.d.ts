import { ConfigService } from "@nestjs/config";
export declare class AgentProcessorConfig {
  private configService;
  constructor(configService: ConfigService);
  get defaultTimeout(): number;
  get maxRetryAttempts(): number;
  get queueTtl(): number;
  get processedMessageTtl(): number;
}
