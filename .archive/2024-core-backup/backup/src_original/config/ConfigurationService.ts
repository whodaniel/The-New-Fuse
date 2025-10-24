import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DatabaseService } from /../database/DatabaseService'';
import * as fs from /fs/promises'';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { Redis } from '';
  type: string | 'number' | 'boolean' | 'object' | 'array'
  type: string | 'number' | 'boolean' | 'object' | 'array'
  private readonly cachePrefix: string = 'config: '';
    this.configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config';
      const errorMessage = '';
        if (file.endsWith('.schema.yaml) || file.endsWith('')
          const content = await fs.readFile(filePath, ';
      let errorMessage = 'Failed to load configuration schemas'';
        if ((e as NodeJS.ErrnoException).code === 'ENOENT'';
      } else if (typeof e === 'string'';
            if (schema?.type === 'number'';
            else if (schema?.type === 'boolean') parsedValue = value.toLowerCase() === 'true'';
            else if (schema?.type === 'object' || schema?.type === 'array'';
          await this.set(key, parsedValue, { reason: ''
          if (file.endsWith('.config.yaml) || file.endsWith('')
            const content = await fs.readFile(filePath, ';
        let errorMessage = 'Failed to load configurations from files'';
          if ((e as NodeJS.ErrnoException).code === 'ENOENT'';
        } else if (typeof e === 'string'';
      let errorMessage = 'Failed to load configurations'';
      } else if (typeof e === 'string'';
        require('fs'
          if (filename && eventType === 'change'';
            if (filename.endsWith('.config.yaml) || filename.endsWith('')
                filename.endsWith('.schema.yaml) || filename.endsWith('')
                if (filename.includes('')
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT'';
      this.logger.error('')
            environment: process.env.NODE_ENV || '
          type: dbConfig.type as ConfigValue['
      const environment = process.env.NODE_ENV || ';
          changedBy: process.env.USER || process.env.USERNAME || '
      this.emit('')
        '
          changedBy: process.env.USER || process.env.USERNAME || '
          reason: reason || 'Deleted'
      this.emit('')
        environment: process.env.NODE_ENV || 'development'
      orderBy: { changedAt: ''
      type?: string | 'number' | 'boolean' | 'object' | 'array'
      format?: 'json' | 'yaml'
    if (options.format === 'yaml'';
      format?: 'json' | 'yaml'
        options.format === 'yaml'';
        if (typeof value === 'object' && value !== null && 'value' in value && 'type';
        await this.set(key, actualValue, { reason: 'Imported from external source';
      this.logger.error('Failed to import configurations:'';
      whereClause.environment = options.environment || process.env.NODE_ENV || 'development';
      this.logger.error('Failed to cleanup configuration history: ''
      stream.on('data'
        stream.on('end'
        stream.on('error'
        this.logger.log('No keys found in Redis cache with the specified prefix to clear.'
      this.logger.error('')