import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') ||
      'postgresql://postgres:postgres@localhost:5432/the_new_fuse';
  }

  getPrismaConfig() {
    return {
      datasources: {
        db: {
          url: this.getDatabaseUrl()
        }
      },
      log: this.getLogLevel(),
      errorFormat: 'pretty'
    };
  }

  private getLogLevel() {
    const env = this.configService.get<string>('NODE_ENV');
    return env === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'];
  }
}
