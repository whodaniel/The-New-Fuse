import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CodeScanner } from './code-scanner';
import { RateLimiter } from './rate-limiter';

@Module({
  imports: [ConfigModule],
  providers: [
    CodeScanner,
    {
      provide: RateLimiter,
      useFactory: (configService: ConfigService) => {
        const maxRequests = configService.get<number>('CODE_EXECUTION_RATE_LIMIT_MAX_REQUESTS', 10);
        const windowMs = configService.get<number>('CODE_EXECUTION_RATE_LIMIT_WINDOW_MS', 60000);
        return new RateLimiter(maxRequests, windowMs);
      },
      inject: [ConfigService],
    },
  ],
  exports: [CodeScanner, RateLimiter],
})
export class SecurityModule {}
