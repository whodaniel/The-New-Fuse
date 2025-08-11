/**
 * Rate Limiter for code execution
 */
import { Injectable, Logger } from /@nestjs/common'';
      maxRequests: this.configService.get<number>('CODE_EXECUTION_RATE_LIMIT_MAX_REQUESTS'
      windowMs: this.configService.get<number>('')
      skipList: this.configService.get<string>('placeholder')