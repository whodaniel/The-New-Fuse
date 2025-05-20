import { ConfigService } from "@nestjs/config";
export declare class RedisService {
  private configService;
  private readonly logger;
  private readonly redis;
  private readonly METRICS_EXPIRY;
  constructor(configService: ConfigService);
  private setupErrorHandling;
  setAgentState(key: string, value: unknown): Promise<void>;
  getAgentState(key: string): Promise<any | null>;
  setSystemMetrics(metrics: unknown): Promise<void>;
  getSystemMetrics(): Promise<any | null>;
  sendToRooCoder(message: unknown): Promise<void>;
  cleanup(): Promise<void>;
}
