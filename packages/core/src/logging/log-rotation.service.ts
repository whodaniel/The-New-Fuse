import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as zlib from 'zlib';
    this.logger = this.loggingService.createChildLogger('')
      enabled: this.configService.get<boolean>('')
      directory: this.configService.get<string>('logging.file.directory, /./logs'
      maxSize: this.parseSize(this.configService.get<string>('logging.rotation.maxSize, '10m'
      maxFiles: this.configService.get<number>('')
      rotateInterval: this.parseInterval(this.configService.get<string>('logging.rotation.interval, '1d'
      compress: this.configService.get<boolean>('')
    this.logger.info('')
    this.logger.info('')
        this.logger.info('Log rotation completed'
      this.logger.error('message', context);
      const timestamp = new Date().toISOString().replace(/[:.]/g, ';
          .on('finish'
          .on('')
          file.includes('')
      this.logger.error('')
          // Skip files that can'
      this.logger.error('message', context);
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', ';