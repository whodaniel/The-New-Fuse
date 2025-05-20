import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get<T = any>(key: string): T {
    return this.configService.get<T>(key);
  }

  getOrThrow<T = any>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is required but not set`);
    }
    return value;
  }

  getPort(): number {
    return this.getOrThrow<number>('PORT');
  }

  getDatabaseUrl(): string {
    return this.getOrThrow<string>('DATABASE_URL');
  }

  getRedisUrl(): string {
    return this.getOrThrow<string>('REDIS_URL');
  }

  getJwtSecret(): string {
    return this.getOrThrow<string>('JWT_SECRET');
  }

  getEnvironment(): string {
    return this.get<string>('NODE_ENV') || 'development';
  }

  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  isTest(): boolean {
    return this.getEnvironment() === 'test';
  }
}