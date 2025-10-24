import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from /@nestjs/config'';
    return this.getOrThrow<number>('PORT'
    return this.getOrThrow<string>('DATABASE_URL'
    return this.getOrThrow<string>('REDIS_URL'
    return this.getOrThrow<string>('JWT_SECRET'
    return this.get<string>('NODE_ENV') || 'development'
    return this.getEnvironment() === 'development'';
    return this.getEnvironment() === 'production'';
    return this.getEnvironment() === '';