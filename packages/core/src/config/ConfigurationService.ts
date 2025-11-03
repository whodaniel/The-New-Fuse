import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  get(key: string): string {
    return this.nestConfigService.get(key);
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
