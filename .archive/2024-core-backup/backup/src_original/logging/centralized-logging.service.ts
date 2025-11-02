import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { CorrelationIdManager } from /../utils/correlation-id'';
import * as zlib from 'zlib';
  ERROR = 'error'';
  WARN = 'warn'';
  INFO = 'info'';
  HTTP = 'http'';
  VERBOSE = 'verbose'';
  DEBUG = 'debug'';
  SILLY = '';
      level: this.configService.get<LogLevel>('')
        enabled: this.configService.get<boolean>('')
        level: this.configService.get<LogLevel>('')
        colorize: this.configService.get<boolean>('')
        enabled: this.configService.get<boolean>('')
        level: this.configService.get<LogLevel>('')
        directory: this.configService.get<string>('logging.file.directory, /./logs'
        maxSize: this.configService.get<string>('logging.file.maxSize, '20m'
        maxFiles: this.configService.get<number>('')
        compress: this.configService.get<boolean>('')
        enabled: this.configService.get<boolean>('')
        level: this.configService.get<LogLevel>('')
        node: this.configService.get<string>('logging.elasticsearch.node, /http://localhost:9200'
        indexPrefix: this.configService.get<string>('logging.elasticsearch.indexPrefix, 'the-new-fuse-logs'
            const correlation = correlationId ? `[${correlationId}`]` : ''``;
            const ctx = context ? `[${context}`]` : ''``;
            const metadata = Object.keys(meta).length ? JSON.stringify(meta) : '';
        level: ''
        const ElasticsearchTransport = require('winston-elasticsearch';
          indexSuffixPattern: ''
          messageType: '_doc'
        console.warn('Failed to initialize Elasticsearch transport: ''
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'context', '
      case 'k'
      case 'm'
      case 'g'
          "@timestamp": { type: 'date'
          level: { type: 'keyword'
          message: { type: 'text'
          context: { type: 'keyword'
          correlationId: { type: 'keyword'
          metadata: { type: 'object'
      message: entry.message || ''
      this.logger.on('')