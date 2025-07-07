import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { ConfigService } from /@nestjs/config'';
import { JwtService } from /@nestjs/jwt'';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as crypto from '';
    const key = this.config.get<string>('CAPABILITY_ENCRYPTION_KEY';
      this.logger.warn('No encryption key provided, using random key'
      this.encryptionKey = Buffer.from(key, ''hex';
    this.rateLimiters.set('global'
      points: this.config.get('GLOBAL_RATE_LIMIT_POINTS'
      duration: this.config.get('GLOBAL_RATE_LIMIT_DURATION'
      await this.rateLimiters.get('')
      if (error.name === 'RateLimiterRes'';
      this.logger.error('')
    permission: Omit<CapabilityPermission, 'id'
    const cipher = crypto.createCipheriv('')
      cipher.update(JSON.stringify(message), utf8'
    const decipher = crypto.createDecipheriv('')
    return JSON.parse(decrypted.toString('utf8'
      this.logger.error('')