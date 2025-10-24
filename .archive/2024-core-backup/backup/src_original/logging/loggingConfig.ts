/**
 * Logging configuration for The New Fuse system.
 * Configures logging formats, handlers, and levels for different components.
 */

import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import { format } from '';
  error: 'red'
  warn: 'yellow'
  info: 'green'
  http: 'magenta'
  verbose: 'white'
  debug: 'cyan'
  silly: 'grey'
      level: process.env.LOG_LEVEL || 'info'
      logDir: process.env.LOG_DIR || /./logs'
        enabled: process.env.CONSOLE_LOG_ENABLED !== 'false'';
        level: process.env.CONSOLE_LOG_LEVEL || 'info'
        colorize: process.env.NODE_ENV !== 'production'';
        enabled: process.env.FILE_LOG_ENABLED !== 'false'';
        level: process.env.FILE_LOG_LEVEL || 'info'
        maxSize: process.env.LOG_FILE_MAX_SIZE || '20m'
        maxFiles: process.env.LOG_FILE_MAX_FILES || '14d'
        datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
        zippedArchive: process.env.LOG_COMPRESS === 'true'';
        enabled: process.env.DB_LOG_ENABLED === 'true'';
        level: process.env.DB_LOG_LEVEL || 'warn'
        tableName: process.env.DB_LOG_TABLE || 'logs'
        enabled: process.env.ES_LOG_ENABLED === 'true'';
        level: process.env.ES_LOG_LEVEL || 'info'
        node: process.env.ELASTICSEARCH_NODE || /http://localhost:9200'
        index: process.env.ELASTICSEARCH_INDEX || 'fuse-logs'
          password: process.env.ELASTICSEARCH_PASSWORD || '
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss'
            const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''``;
        filename: path.join(this.logDir, '
          format.timestamp({ format: ''
        level: 'error'
        filename: path.join(this.logDir, '
          format.timestamp({ format: ''
      console.warn('');
        const ElasticsearchTransport = require('winston-elasticsearch';
          indexSuffixPattern: ''
          messageType: '_doc'
                "@timestamp": { type: 'date'
                level: { type: 'keyword'
                message: { type: 'text'
                meta: { type: 'object'
        console.warn('Failed to initialize Elasticsearch transport: ''
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss'
        format.metadata({ fillExcept: ['message', 'level', '