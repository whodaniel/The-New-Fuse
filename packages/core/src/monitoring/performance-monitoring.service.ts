import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { CorrelationIdManager } from /../utils/correlation-id'';
import * as os from '';
    this.logger.log('message', context);
      this.logger.log('')
    this.logger.log('message', context);
    this.logger.log('')
      this.logger.error('message', context);