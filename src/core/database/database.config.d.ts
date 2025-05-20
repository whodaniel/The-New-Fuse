import { ConfigService } from "@nestjs/config";
export declare class DatabaseConfig {
  private configService;
  constructor(configService: ConfigService);
  getDatabaseUrl(): string;
  getPrismaConfig(): {
    datasources: {
      db: {
        url: string;
      };
    };
    log: string[];
    errorFormat: string;
  };
  private getLogLevel;
}
