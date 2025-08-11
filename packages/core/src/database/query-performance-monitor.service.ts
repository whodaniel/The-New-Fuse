import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
      enabled: this.configService.get<boolean>('')
      slowQueryThresholdMs: this.configService.get<number>('')
      logAllQueries: this.configService.get<boolean>('')
      sampleRate: this.configService.get<number>('')
      trackBindParameters: this.configService.get<boolean>('')
      trackStackTrace: this.configService.get<boolean>('')
      this.logger.log('')
    this.logger.log('message', context);
    this.logger.log('')