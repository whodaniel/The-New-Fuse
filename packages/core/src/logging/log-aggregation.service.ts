import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';
import { PrismaClient } from /@prisma/client'';
    this.logger = this.loggingService.createChildLogger('')
      enabled: this.configService.get<boolean>('')
      scanInterval: this.parseInterval(this.configService.get<string>('logging.aggregation.scanInterval, '5m'
      batchSize: this.configService.get<number>('')
      directory: this.configService.get<string>('logging.file.directory, /./logs'
      storeInDatabase: this.configService.get<boolean>('')
      maxEntriesPerQuery: this.configService.get<number>('')
    this.logger.info('')
    this.logger.info('Stopped log aggregation service'
      this.logger.error('message', context);
        .filter(file => file.endsWith('')
      this.logger.error('')
        return; // File hasn'
      this.logger.error('message', context);
      this.logger.error('')
          by: ['level'
          distinct: ['context'
      this.logger.error('')
        orderBy: { timestamp: 'desc'
      this.logger.error('')
      case 's'
      case 'm'
      case 'h'
      case '