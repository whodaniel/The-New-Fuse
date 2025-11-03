import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationManager {
  constructor(private readonly configService: ConfigService) {}

  get(key: string): string {
    return this.configService.get(key);
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}
