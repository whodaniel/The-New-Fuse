import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CodeScanner } from './code-scanner.js';
import { RateLimiter } from './rate-limiter.js';

@Module({
  imports: [ConfigModule],
  providers: [CodeScanner, RateLimiter],
  exports: [CodeScanner, RateLimiter],
})
export class CodeExecutionSecurityModule {}
